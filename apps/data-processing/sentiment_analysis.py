'''
Integrated script for ingesting crypto tweets from X API and analyzing sentiment.
'''

import json
import time
import random 
import os
import re
from typing import Tuple, Dict, Any, List
import requests
import pandas as pd
from collections import Counter
from datetime import datetime
from flask import Flask, request, jsonify


# Twitter API Configuration
BEARER_TOKEN = os.environ.get("BEARER_TOKEN")
ENDPOINT_URL = "https://api.x.com/2/tweets/search/recent"

query_parameters = {
    "query": '("crypto news" OR "crypto" OR tokens) lang:en -is:retweet',
    "tweet.fields": "id,text,author_id,created_at",
    "user.fields": "id,name,username,created_at,description,location,verified",
    "expansions": "author_id",
    "max_results": 100,  # Increased for better sentiment analysis
}


class CryptoSentimentAnalyzer:
    """
    Analyzes sentiment of crypto-related tweets ingested from Twitter/X API.
    """
    
    def __init__(self):
        # Define positive and negative sentiment keywords specific to crypto
        self.positive_keywords = {
            # Market sentiment
            "bullish", "moon", "mooning", "gain", "gains", "profit", "profits", 
            "winner", "winning", "success", "successful", "opportunity", "opportunities", 
            "potential", "promising", "growth", "growing", "up", "rise", "rising", 
            "soar", "soaring", "outperform", "outperforming",
            
            # Trading actions
            "buy", "buying", "hodl", "hodling", "hold", "holding", "accumulate", "accumulating",
            
            # Emotional responses
            "good", "great", "excellent", "amazing", "awesome", "excited", "excitement",
            "happy", "happier", "confident", "confidence",
            
            # Tech progress
            "breakthrough", "innovation", "innovative", "strong", "stronger",
            "adoption", "partner", "partnership", "utility", "secure", "security"
        }
        
        self.negative_keywords = {
            # Market sentiment
            "bearish", "crash", "crashing", "dump", "dumping", "loss", "losses", 
            "loser", "losing", "fail", "failing", "failure", "down", "dip", "dipping", 
            "fall", "falling", "drop", "dropping", "weak", "weaker", "underperform", "underperforming",
            
            # Trading actions
            "sell", "selling", "sold", "short", "shorting",
            
            # Security/legitimacy concerns
            "scam", "fraud", "fraudulent", "hack", "hacked", "exploit", "bug", "vulnerability",
            
            # Emotional responses
            "bad", "worse", "worst", "terrible", "horrible", "disappointed", "disappointing", 
            "disappointment", "worried", "worry", "concerning", "concern", "fear", "fearful",
            
            # Regulatory
            "ban", "banned", "regulation", "regulate", "sec", "lawsuit", "illegal", "risky", "risk"
        }
    
    def analyze_tweet(self, tweet_text: str) -> Dict[str, Any]:
        """
        Analyzes the sentiment of a single tweet based on keyword presence.
        
        Args:
            tweet_text (str): The text of the tweet to analyze
            
        Returns:
            dict: A dictionary containing sentiment analysis results
        """
        # Clean and tokenize text
        tweet_text = tweet_text.lower()
        # Split on word boundaries to properly identify words
        words = re.findall(r'\b\w+\b', tweet_text)
        
        # Use Counter for efficient word counting
        word_counts = Counter(words)
        
        # Count keyword matches - faster with dictionary comprehensions
        positive_matches = {word: count for word, count in word_counts.items() if word in self.positive_keywords}
        negative_matches = {word: count for word, count in word_counts.items() if word in self.negative_keywords}
        
        positive_count = sum(positive_matches.values())
        negative_count = sum(negative_matches.values())
        
        # Calculate sentiment score (-1.0 to 1.0)
        total_count = positive_count + negative_count
        if total_count == 0:
            score = 0.0
        else:
            score = (positive_count - negative_count) / total_count
        
        # Determine sentiment category with thresholds
        if score > 0.1:
            sentiment = "positive"
        elif score < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "score": round(score, 2),
            "keywords_found": {
                "positive": positive_count,
                "negative": negative_count,
                "positive_matches": dict(positive_matches),
                "negative_matches": dict(negative_matches)
            }
        }
    
    def analyze_dataframe(self, tweets_df: pd.DataFrame, users_df: pd.DataFrame = None) -> pd.DataFrame:
        """
        Analyzes sentiment for tweets in a DataFrame and adds sentiment data.
        
        Args:
            tweets_df (pd.DataFrame): DataFrame containing tweets with 'text' column
            users_df (pd.DataFrame, optional): DataFrame containing user data
            
        Returns:
            pd.DataFrame: Original DataFrame with added sentiment columns
        """
        if tweets_df.empty:
            return pd.DataFrame()
        
        # Create a copy to avoid modifying the original
        results_df = tweets_df.copy()
        
        # Apply sentiment analysis to each tweet
        sentiment_results = []
        for _, row in results_df.iterrows():
            analysis = self.analyze_tweet(row['text'])
            sentiment_results.append({
                'sentiment': analysis['sentiment'],
                'score': analysis['score'],
                'positive_count': analysis['keywords_found']['positive'],
                'negative_count': analysis['keywords_found']['negative'],
                'positive_keywords': list(analysis['keywords_found']['positive_matches'].keys()),
                'negative_keywords': list(analysis['keywords_found']['negative_matches'].keys())
            })
        
        # Convert results to DataFrame and join with original
        sentiment_df = pd.DataFrame(sentiment_results)
        results_df = pd.concat([results_df.reset_index(drop=True), 
                              sentiment_df.reset_index(drop=True)], axis=1)
        
        # Join with user data if provided
        if users_df is not None and not users_df.empty:
            results_df = results_df.merge(users_df[['id', 'username', 'name', 'verified']], 
                                        left_on='author_id', 
                                        right_on='id', 
                                        how='left',
                                        suffixes=('', '_user'))
        
        return results_df
    
    def generate_sentiment_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate summary statistics from analyzed tweets.
        
        Args:
            df (pd.DataFrame): DataFrame with sentiment analysis results
            
        Returns:
            dict: Summary statistics
        """
        if df.empty:
            return {"error": "No data to analyze"}
            
        total_tweets = len(df)
        sentiment_counts = df['sentiment'].value_counts().to_dict()
        
        # Ensure all categories are represented
        for sentiment in ['positive', 'negative', 'neutral']:
            if sentiment not in sentiment_counts:
                sentiment_counts[sentiment] = 0
        
        avg_score = df['score'].mean()
        
        # Get most common positive and negative keywords
        all_pos_keywords = []
        for keywords in df['positive_keywords'].dropna():
            all_pos_keywords.extend(keywords)
        
        all_neg_keywords = []
        for keywords in df['negative_keywords'].dropna():
            all_neg_keywords.extend(keywords)
        
        top_pos_keywords = dict(Counter(all_pos_keywords).most_common(5))
        top_neg_keywords = dict(Counter(all_neg_keywords).most_common(5))
        
        return {
            "total_tweets": total_tweets,
            "sentiment_distribution": {
                "positive": sentiment_counts.get('positive', 0),
                "negative": sentiment_counts.get('negative', 0),
                "neutral": sentiment_counts.get('neutral', 0)
            },
            "positive_percentage": round((sentiment_counts.get('positive', 0) / total_tweets) * 100, 2),
            "negative_percentage": round((sentiment_counts.get('negative', 0) / total_tweets) * 100, 2),
            "neutral_percentage": round((sentiment_counts.get('neutral', 0) / total_tweets) * 100, 2),
            "average_score": round(avg_score, 2),
            "top_positive_keywords": top_pos_keywords,
            "top_negative_keywords": top_neg_keywords,
            "timestamp": datetime.now().isoformat()
        }


# Twitter API functions
def request_headers(token: str) -> dict:
    '''Returns a dictionary summarizing the bearer token authentication details.'''
    return {"Authorization": f"Bearer {token}"}


def connect_to_endpoint(header: dict, parameters: dict, max_retries: int = 5) -> json:
    """
    Connects to the endpoint and requests data.
    Returns a json with Twitter data if a 200 status code is yielded.
    Programme stops if there is a problem with the request and sleeps
    if there is a temporary problem accessing the endpoint.
    """
    attempt = 0
    while attempt < max_retries:
        response = requests.get(url=ENDPOINT_URL, headers=header, params=parameters, timeout=10)
        response_status_code = response.status_code
        
        if response_status_code == 200:
            return response.json()
        
        elif response_status_code == 429:
            retry_after = int(response.headers.get("Retry-After", random.randint(5,60)))
            print(f"Rate limited. Retrying in {retry_after} seconds...")
            time.sleep(retry_after)

        elif 400 <= response_status_code < 500:
            raise requests.exceptions.HTTPError(
                f"Cannot get data, the program will stop!\nHTTP {response_status_code}: {response.text}"
                )
        else:
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            print(f"Temporary issue, retrying in {wait_time:.2f} seconds...\nHTTP {response_status_code}: {response.text}")
            time.sleep(wait_time)
        attempt += 1

    raise requests.exceptions.RetryError("Max retries exceeded. Unable to get data. ")


def process_x_data(json_response: json,
                   query_tag: str,
                   tweets_df: pd.DataFrame,
                   users_df: pd.DataFrame
                   ) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Adds new tweet/user information to the table of 
    tweets/users and saves dataframes as pickle files,
    if data is available.
    """
    if "data" in json_response.keys():
        new = pd.DataFrame(json_response["data"])
        tweets_df = pd.concat([tweets_df, new])
        tweets_df.to_pickle("tweets_" + query_tag + ".pkl")

        if "users" in json_response["includes"].keys():
            new = pd.DataFrame(json_response["includes"]["users"])
            users_df = pd.concat([users_df, new])
            users_df.drop_duplicates("id", inplace=True)
            users_df.to_pickle("users_" + query_tag + ".pkl")
    return tweets_df, users_df


def ingest_and_analyze(query_params: dict = None, tag: str = "crypto") -> Dict[str, Any]:
    """
    Ingest data from Twitter API, process it, and analyze sentiment.
    
    Args:
        query_params (dict, optional): Parameters for Twitter API query
        tag (str): Tag for saving data files
        
    Returns:
        dict: Analysis results and summary
    """
    headers = request_headers(BEARER_TOKEN)
    
    if query_params is None:
        query_params = query_parameters
    
    try:
        # Get data from Twitter API
        j_response = connect_to_endpoint(header=headers, parameters=query_params)
        
        # Process the data
        tweets_data = pd.DataFrame()
        users_data = pd.DataFrame()
        tweets_data, users_data = process_x_data(j_response, tag, tweets_data, users_data)
        
        # Initialize analyzer and analyze the tweets
        analyzer = CryptoSentimentAnalyzer()
        results_df = analyzer.analyze_dataframe(tweets_data, users_data)
        
        # Generate summary
        summary = analyzer.generate_sentiment_summary(results_df)
        
        # Save analyzed data
        if not results_df.empty:
            results_df.to_pickle(f"analyzed_{tag}.pkl")
            results_df.to_csv(f"analyzed_{tag}.csv", index=False)
        
        return {
            "success": True,
            "summary": summary,
            "tweets_analyzed": len(results_df),
            "output_files": [f"analyzed_{tag}.pkl", f"analyzed_{tag}.csv"]
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Flask API for web access
app = Flask(__name__)
analyzer = CryptoSentimentAnalyzer()

@app.route('/api/analyze/tweet', methods=['POST'])
def analyze_single_tweet():
    """Analyze a single tweet text"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
        
    text = data.get("text", "")
    
    if not text:
        return jsonify({"error": "No text provided for analysis"}), 400
    
    # Perform sentiment analysis
    analysis_result = analyzer.analyze_tweet(text)
    
    return jsonify({
        "input_text": text,
        "sentiment_analysis": analysis_result
    })

@app.route('/api/ingest', methods=['POST'])
def ingest_tweets():
    """Trigger ingestion of tweets from Twitter API"""
    data = request.get_json() or {}
    
    # Get custom parameters if provided
    query = data.get("query")
    max_results = data.get("max_results")
    tag = data.get("tag", "crypto")
    
    # Update query parameters if needed
    params = query_parameters.copy()
    if query:
        params["query"] = query
    if max_results:
        params["max_results"] = max_results
    
    # Run the ingestion and analysis
    result = ingest_and_analyze(params, tag)
    
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 500

@app.route('/api/analyze/file', methods=['POST'])
def analyze_file():
    """Analyze tweets from previously saved files"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    tweets_file = data.get("tweets_file")
    users_file = data.get("users_file")
    
    if not tweets_file or not os.path.exists(tweets_file):
        return jsonify({"error": "Tweets file not specified or does not exist"}), 400
    
    try:
        # Load the data
        tweets_df = pd.read_pickle(tweets_file)
        users_df = None
        
        if users_file and os.path.exists(users_file):
            users_df = pd.read_