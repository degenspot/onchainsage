"""
Test suite for the CryptoSentimentAnalyzer class.
"""

import pytest
from sentiment_analysis import CryptoSentimentAnalyzer

@pytest.fixture
def analyzer():
    """Fixture to create a CryptoSentimentAnalyzer instance"""
    return CryptoSentimentAnalyzer()

def test_positive_sentiment(analyzer):
    """Test analysis of strongly positive crypto-related tweets"""
    tweet = "Extremely bullish on Bitcoin! Great opportunity for growth, seeing strong adoption and innovation."
    result = analyzer.analyze_tweet(tweet)
    
    assert result['sentiment_score'] > 0.5
    assert result['sentiment_label'] == 'positive'
    assert len(result['positive_matches']) >= 4  # Should match: bullish, opportunity, strong, adoption, innovation
    assert len(result['negative_matches']) == 0

def test_negative_sentiment(analyzer):
    """Test analysis of strongly negative crypto-related tweets"""
    tweet = "Major crash incoming! This token looks like a scam, very risky with potential exploit vulnerability."
    result = analyzer.analyze_tweet(tweet)
    
    assert result['sentiment_score'] < -0.3
    assert result['sentiment_label'] == 'negative'
    assert len(result['negative_matches']) >= 4  # Should match: crash, scam, risky, exploit, vulnerability
    assert len(result['positive_matches']) == 0

def test_neutral_sentiment(analyzer):
    """Test analysis of neutral crypto-related tweets"""
    tweet = "Bitcoin price movement continues sideways trading in current range."
    result = analyzer.analyze_tweet(tweet)
    
    assert -0.2 <= result['sentiment_score'] <= 0.2
    assert result['sentiment_label'] == 'neutral'
    assert len(result['positive_matches']) == 0
    assert len(result['negative_matches']) == 0

def test_mixed_sentiment(analyzer):
    """Test analysis of tweets with both positive and negative sentiment"""
    tweet = "Despite the market crash, still bullish on long-term growth. HODL through the dips!"
    result = analyzer.analyze_tweet(tweet)
    
    assert 'crash' in result['negative_matches']
    assert 'dips' in result['negative_matches']
    assert 'bullish' in result['positive_matches']
    assert 'growth' in result['positive_matches']
    assert 'hodl' in result['positive_matches']

def test_case_insensitivity(analyzer):
    """Test that sentiment analysis is case-insensitive"""
    lower_tweet = "bullish on crypto, great opportunity!"
    upper_tweet = "BULLISH ON CRYPTO, GREAT OPPORTUNITY!"
    
    lower_result = analyzer.analyze_tweet(lower_tweet)
    upper_result = analyzer.analyze_tweet(upper_tweet)
    
    assert lower_result['sentiment_score'] == upper_result['sentiment_score']
    assert lower_result['positive_matches'] == upper_result['positive_matches']
    assert lower_result['negative_matches'] == upper_result['negative_matches']

def test_word_boundary_detection(analyzer):
    """Test that sentiment analysis properly detects word boundaries"""
    tweet = "uncrashable unstoppable growing"  # 'crash' shouldn't match within 'uncrashable'
    result = analyzer.analyze_tweet(tweet)
    
    assert 'crash' not in result['negative_matches']
    assert 'growing' in result['positive_matches']
