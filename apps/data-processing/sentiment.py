from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_sentiments(tweets):
    analyzer = SentimentIntensityAnalyzer()
    scores = {}
    for tweet in tweets:
        vs = analyzer.polarity_scores(tweet)
        scores[tweet] = vs['compound']
    return scores

if __name__ == "__main__":
    sample_tweets = [
        "Bitcoin is great",
        "I love programming",
        "This is terrible",
        "I am not happy with this",
        "What a wonderful day",
        "I hate it when this happens",
        "This is the best thing ever",
        "I am so sad",
        "Could be better",
        "Absolutely fantastic!"
    ]
    scores = analyze_sentiments(sample_tweets)
    for tweet, score in scores.items():
        print(f"Tweet: {tweet} | Compound Score: {score}")
