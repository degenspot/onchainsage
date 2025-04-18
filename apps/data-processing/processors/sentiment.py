import logging
from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod
import numpy as np
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import tensorflow as tf
from transformers import pipeline

logger = logging.getLogger(__name__)

class SentimentAnalyzer(ABC):
    """Base class for sentiment analyzers."""
    
    @abstractmethod
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        pass

class VaderSentimentAnalyzer(SentimentAnalyzer):
    """VADER sentiment analyzer."""
    
    def __init__(self):
        """Initialize VADER sentiment analyzer."""
        self.analyzer = SentimentIntensityAnalyzer()
        
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using VADER.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing sentiment scores
        """
        scores = self.analyzer.polarity_scores(text)
        
        # Convert compound score to [0, 1] range
        normalized_score = (scores['compound'] + 1) / 2
        
        # Determine sentiment label
        if normalized_score > 0.6:
            label = 'positive'
        elif normalized_score < 0.4:
            label = 'negative'
        else:
            label = 'neutral'
            
        return {
            'score': normalized_score,
            'label': label,
            'raw_scores': scores
        }

class TensorFlowSentimentAnalyzer(SentimentAnalyzer):
    """TensorFlow-based sentiment analyzer using pre-trained model."""
    
    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        """
        Initialize TensorFlow sentiment analyzer.
        
        Args:
            model_name: Name of pre-trained model to use
        """
        self.classifier = pipeline("sentiment-analysis", model=model_name)
        
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using TensorFlow model.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing sentiment scores
        """
        result = self.classifier(text)[0]
        
        # Convert label to score (0-1)
        score = result['score']
        if result['label'].lower() == 'negative':
            score = 1 - score
            
        return {
            'score': score,
            'label': 'positive' if score > 0.5 else 'negative',
            'raw_scores': result
        }

class KeywordSentimentAnalyzer(SentimentAnalyzer):
    """Keyword-based sentiment analyzer."""
    
    def __init__(self):
        """Initialize keyword-based sentiment analyzer."""
        # Define positive and negative keywords with weights
        self.positive_keywords = {
            'bullish': 1.0, 'moon': 0.8, 'buy': 0.6, 'long': 0.6,
            'up': 0.4, 'gain': 0.4, 'profit': 0.4, 'good': 0.3,
            'great': 0.3, 'strong': 0.3
        }
        
        self.negative_keywords = {
            'bearish': 1.0, 'dump': 0.8, 'sell': 0.6, 'short': 0.6,
            'down': 0.4, 'loss': 0.4, 'bad': 0.3, 'weak': 0.3,
            'crash': 0.8, 'scam': 0.8
        }
        
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using keyword matching.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing sentiment scores
        """
        text = text.lower()
        words = text.split()
        
        # Calculate positive and negative scores
        pos_score = sum(self.positive_keywords[word] for word in words if word in self.positive_keywords)
        neg_score = sum(self.negative_keywords[word] for word in words if word in self.negative_keywords)
        
        # Normalize scores
        total = pos_score + neg_score
        if total > 0:
            score = pos_score / total
        else:
            score = 0.5  # Neutral if no keywords found
            
        # Determine label
        if score > 0.6:
            label = 'positive'
        elif score < 0.4:
            label = 'negative'
        else:
            label = 'neutral'
            
        return {
            'score': score,
            'label': label,
            'raw_scores': {
                'positive_score': pos_score,
                'negative_score': neg_score
            }
        }

class CompositeSentimentAnalyzer:
    """Combines multiple sentiment analyzers with weighted voting."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize composite sentiment analyzer.
        
        Args:
            config: Configuration dictionary containing sentiment settings
        """
        self.config = config
        self.backend = config['backend']
        self.weights = config['weights']
        self.thresholds = config['thresholds']
        
        # Initialize backend analyzer
        if self.backend == 'vader':
            self.analyzer = VaderSentimentAnalyzer()
        elif self.backend == 'tensorflow':
            self.analyzer = TensorFlowSentimentAnalyzer()
        else:
            self.analyzer = KeywordSentimentAnalyzer()
            
    def analyze_tweet(self, tweet: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze sentiment of a tweet considering text and metrics.
        
        Args:
            tweet: Tweet dictionary containing text and metrics
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        # Analyze text sentiment
        text_sentiment = self.analyzer.analyze(tweet['text'])
        text_score = text_sentiment['score']
        
        # Calculate metric-based scores
        likes_score = min(tweet['likes'] / 1000, 1.0)  # Normalize to [0, 1]
        retweets_score = min(tweet['retweets'] / 500, 1.0)
        comments_score = min(tweet['comments'] / 200, 1.0)
        
        # Calculate weighted average
        weighted_score = (
            self.weights['text'] * text_score +
            self.weights['likes'] * likes_score +
            self.weights['retweets'] * retweets_score +
            self.weights['comments'] * comments_score
        )
        
        # Determine sentiment category
        if weighted_score >= self.thresholds['strong_positive']:
            category = 'strong_positive'
        elif weighted_score >= self.thresholds['positive']:
            category = 'positive'
        elif weighted_score >= self.thresholds['neutral']:
            category = 'neutral'
        elif weighted_score >= self.thresholds['negative']:
            category = 'negative'
        else:
            category = 'strong_negative'
            
        return {
            'score': weighted_score,
            'category': category,
            'components': {
                'text': {
                    'score': text_score,
                    'weight': self.weights['text']
                },
                'metrics': {
                    'likes': {
                        'score': likes_score,
                        'weight': self.weights['likes']
                    },
                    'retweets': {
                        'score': retweets_score,
                        'weight': self.weights['retweets']
                    },
                    'comments': {
                        'score': comments_score,
                        'weight': self.weights['comments']
                    }
                }
            }
        }
        
    def analyze_tweets(self, tweets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment of multiple tweets.
        
        Args:
            tweets: List of tweet dictionaries
            
        Returns:
            List of sentiment analysis results
        """
        results = []
        for tweet in tweets:
            try:
                sentiment = self.analyze_tweet(tweet)
                results.append({
                    'tweet_id': tweet['id'],
                    'sentiment': sentiment
                })
            except Exception as e:
                logger.error(f"Error analyzing tweet {tweet.get('id', 'unknown')}: {str(e)}")
                
        logger.info(f"Analyzed sentiment for {len(results)} tweets")
        return results 