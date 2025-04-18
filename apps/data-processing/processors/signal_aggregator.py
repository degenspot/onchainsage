import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import os
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('signal_aggregator')

class SignalAggregator:
    """
    Aggregates sentiment and market metrics data to generate trading signals.
    
    This class combines various data sources to create categorized signals with
    confidence levels based on the alignment of different indicators.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the SignalAggregator with configuration parameters.
        
        Args:
            config: Dictionary containing configuration parameters
        """
        # Default configuration
        self.config = {
            'sentiment_weight': 0.4,
            'liquidity_weight': 0.2,
            'volume_weight': 0.2,
            'price_action_weight': 0.2,
            'high_threshold': 0.7,
            'medium_threshold': 0.4,
            'low_threshold': 0.0,
            'categories': {
                'strong_buy': {'min_score': 0.8, 'sentiment_min': 0.7, 'price_action_min': 0.6},
                'buy': {'min_score': 0.6, 'sentiment_min': 0.5, 'price_action_min': 0.4},
                'neutral': {'min_score': 0.4, 'max_score': 0.6},
                'sell': {'max_score': 0.4, 'sentiment_max': 0.5, 'price_action_max': 0.4},
                'strong_sell': {'max_score': 0.2, 'sentiment_max': 0.3, 'price_action_max': 0.4}
            }
        }
        
        # Update with provided config
        if config:
            self.config.update(config)
            
        logger.info("SignalAggregator initialized with configuration")
    
    def normalize_sentiment_data(self, sentiment_data: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize sentiment data to a scale of 0-1.
        
        Args:
            sentiment_data: DataFrame containing sentiment data
            
        Returns:
            Normalized sentiment DataFrame
        """
        # Check if sentiment data exists
        if sentiment_data.empty:
            logger.warning("Empty sentiment data provided")
            return pd.DataFrame()
        
        # Create a copy to avoid modifying the original
        normalized = sentiment_data.copy()
        
        # If sentiment scores are already provided, use them
        if 'sentiment_score' in normalized.columns:
            # Ensure scores are between 0 and 1
            normalized['sentiment_score'] = normalized['sentiment_score'].clip(0, 1)
        else:
            # Try to calculate sentiment from text if available
            # This is a simple example - in a real scenario, you'd use a proper NLP model
            if 'text' in normalized.columns:
                # Simple keyword-based sentiment (placeholder for actual NLP)
                positive_words = ['bullish', 'moon', 'up', 'gain', 'profit', 'good', 'great', 'excellent']
                negative_words = ['bearish', 'down', 'crash', 'loss', 'bad', 'terrible', 'poor']
                
                def simple_sentiment(text):
                    if not isinstance(text, str):
                        return 0.5
                    text = text.lower()
                    pos_count = sum(1 for word in positive_words if word in text)
                    neg_count = sum(1 for word in negative_words if word in text)
                    
                    if pos_count + neg_count == 0:
                        return 0.5
                    return pos_count / (pos_count + neg_count)
                
                normalized['sentiment_score'] = normalized['text'].apply(simple_sentiment)
            
            # If likes/retweets/comments are available (social media metrics)
            if all(col in normalized.columns for col in ['likes', 'retweets', 'comments']):
                # Calculate engagement score
                normalized['engagement'] = normalized['likes'] + normalized['retweets']*2 + normalized['comments']*3
                
                # Normalize engagement to 0-1
                if normalized['engagement'].max() > 0:
                    normalized['engagement'] = normalized['engagement'] / normalized['engagement'].max()
                else:
                    normalized['engagement'] = 0
                    
                # Weight sentiment by engagement
                if 'sentiment_score' in normalized.columns:
                    normalized['sentiment_score'] = normalized['sentiment_score'] * (0.5 + 0.5 * normalized['engagement'])
        
        # If we still don't have sentiment scores, use a neutral default
        if 'sentiment_score' not in normalized.columns:
            logger.warning("Could not determine sentiment scores, using neutral default")
            normalized['sentiment_score'] = 0.5
            
        return normalized
    
    def normalize_market_metrics(self, metrics_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalize market metrics to a scale of 0-1.
        
        Args:
            metrics_data: Dictionary containing market metrics
            
        Returns:
            Dictionary with normalized metrics
        """
        normalized_metrics = {}
        
        # Liquidity normalization (assuming higher is better)
        if 'liquidity' in metrics_data:
            # Example normalization logic - adjust based on actual data
            liquidity = metrics_data['liquidity']
            # Normalize to 0-1 scale based on expected range
            # This is a placeholder - real implementation would depend on data
            normalized_metrics['liquidity'] = min(1.0, max(0.0, liquidity / 1000000))
        else:
            normalized_metrics['liquidity'] = 0.5  # Neutral if not available
            
        # Volume normalization
        if 'volume' in metrics_data:
            # Normalize volume relative to average
            volume = metrics_data['volume']
            avg_volume = metrics_data.get('average_volume', volume)
            if avg_volume > 0:
                vol_ratio = volume / avg_volume
                # Map ratio to 0-1 scale (e.g., 2x avg -> 0.8, 0.5x avg -> 0.3)
                normalized_metrics['volume'] = min(1.0, max(0.0, 0.5 + 0.3 * np.log2(vol_ratio)))
            else:
                normalized_metrics['volume'] = 0.5
        else:
            normalized_metrics['volume'] = 0.5
            
        # Price action normalization
        if 'price_change_pct' in metrics_data:
            # Convert percent change to 0-1 scale
            # E.g., +5% -> 0.8, -5% -> 0.2
            pct_change = metrics_data['price_change_pct']
            normalized_metrics['price_action'] = min(1.0, max(0.0, 0.5 + pct_change / 20))
        else:
            normalized_metrics['price_action'] = 0.5
            
        return normalized_metrics
    
    def calculate_aggregate_score(self, sentiment_score: float, metrics: Dict[str, float]) -> float:
        """
        Calculate an aggregate score based on sentiment and metrics.
        
        Args:
            sentiment_score: Normalized sentiment score (0-1)
            metrics: Dictionary of normalized market metrics
            
        Returns:
            Aggregate score (0-1)
        """
        # Get weights from config
        weights = {
            'sentiment': self.config['sentiment_weight'],
            'liquidity': self.config['liquidity_weight'],
            'volume': self.config['volume_weight'],
            'price_action': self.config['price_action_weight']
        }
        
        # Calculate weighted score
        score = weights['sentiment'] * sentiment_score
        
        # Add metrics with their weights
        for metric, weight in weights.items():
            if metric != 'sentiment' and metric in metrics:
                score += weight * metrics[metric]
                
        return score
    
    def determine_confidence(self, score: float, sentiment: float, metrics: Dict[str, float]) -> str:
        """
        Determine confidence level based on score and alignment of indicators.
        
        Args:
            score: Aggregate score
            sentiment: Sentiment score
            metrics: Normalized metrics
            
        Returns:
            Confidence level (high, medium, low)
        """
        # Check alignment between sentiment and price action
        aligned = abs(sentiment - metrics.get('price_action', 0.5)) < 0.3
        
        # High confidence: high score and aligned indicators
        if score >= self.config['high_threshold'] and aligned:
            return "high"
        # Low confidence: contradictory signals
        elif abs(sentiment - metrics.get('price_action', 0.5)) > 0.6:
            return "low"
        # Medium confidence: everything else
        elif score >= self.config['medium_threshold']:
            return "medium"
        else:
            return "low"
    
    def categorize_signal(self, score: float, sentiment: float, metrics: Dict[str, float]) -> str:
        """
        Categorize the signal based on score, sentiment, and metrics.
        
        Args:
            score: Aggregate score
            sentiment: Sentiment score
            metrics: Normalized metrics
            
        Returns:
            Signal category
        """
        categories = self.config['categories']
        price_action = metrics.get('price_action', 0.5)
        
        # Strong buy
        if (score >= categories['strong_buy']['min_score'] and 
            sentiment >= categories['strong_buy']['sentiment_min'] and 
            price_action >= categories['strong_buy']['price_action_min']):
            return "strong_buy"
            
        # Buy
        elif (score >= categories['buy']['min_score'] and 
              sentiment >= categories['buy']['sentiment_min'] and 
              price_action >= categories['buy']['price_action_min']):
            return "buy"
            
        # Strong sell
        elif (score <= categories['strong_sell']['max_score'] and 
              sentiment <= categories['strong_sell']['sentiment_max'] and 
              price_action <= categories['strong_sell']['price_action_max']):
            return "strong_sell"
            
        # Sell
        elif (score <= categories['sell']['max_score'] and 
              sentiment <= categories['sell']['sentiment_max'] and 
              price_action <= categories['sell']['price_action_max']):
            return "sell"
            
        # Neutral
        else:
            return "neutral"
    
    def generate_signal(self, 
                        asset_id: str, 
                        sentiment_data: pd.DataFrame, 
                        metrics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a signal for a specific asset.
        
        Args:
            asset_id: Identifier for the asset
            sentiment_data: DataFrame containing sentiment data
            metrics_data: Dictionary containing market metrics
            
        Returns:
            Signal dictionary
        """
        # Normalize data
        normalized_sentiment = self.normalize_sentiment_data(sentiment_data)
        normalized_metrics = self.normalize_market_metrics(metrics_data)
        
        # Calculate aggregate sentiment score
        if not normalized_sentiment.empty and 'sentiment_score' in normalized_sentiment.columns:
            # Weight by engagement if available
            if 'engagement' in normalized_sentiment.columns:
                weights = normalized_sentiment['engagement']
                if weights.sum() > 0:
                    sentiment_score = (normalized_sentiment['sentiment_score'] * weights).sum() / weights.sum()
                else:
                    sentiment_score = normalized_sentiment['sentiment_score'].mean()
            else:
                sentiment_score = normalized_sentiment['sentiment_score'].mean()
        else:
            sentiment_score = 0.5  # Neutral default
        
        # Calculate aggregate score
        aggregate_score = self.calculate_aggregate_score(sentiment_score, normalized_metrics)
        
        # Determine confidence
        confidence = self.determine_confidence(aggregate_score, sentiment_score, normalized_metrics)
        
        # Categorize signal
        category = self.categorize_signal(aggregate_score, sentiment_score, normalized_metrics)
        
        # Create signal object
        signal = {
            "asset_id": asset_id,
            "timestamp": pd.Timestamp.now().isoformat(),
            "signal": {
                "category": category,
                "confidence": confidence,
                "score": round(aggregate_score, 2)
            },
            "components": {
                "sentiment": round(sentiment_score, 2),
                "metrics": {k: round(v, 2) for k, v in normalized_metrics.items()}
            },
            "metadata": {
                "sentiment_count": len(normalized_sentiment) if not normalized_sentiment.empty else 0,
                "config": {k: v for k, v in self.config.items() if k != 'categories'}
            }
        }
        
        return signal
    
    def generate_signals_batch(self, 
                              data: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate signals for multiple assets.
        
        Args:
            data: Dictionary mapping asset IDs to their data
                  Each asset should have 'sentiment' (DataFrame) and 'metrics' (Dict)
                  
        Returns:
            List of signal dictionaries
        """
        signals = []
        
        for asset_id, asset_data in data.items():
            sentiment_data = asset_data.get('sentiment', pd.DataFrame())
            metrics_data = asset_data.get('metrics', {})
            
            signal = self.generate_signal(asset_id, sentiment_data, metrics_data)
            signals.append(signal)
            
        return signals
    
    def save_signals_to_json(self, signals: List[Dict[str, Any]], output_path: str) -> None:
        """
        Save signals to a JSON file.
        
        Args:
            signals: List of signal dictionaries
            output_path: Path to save the JSON file
        """
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(signals, f, indent=2)
            
        logger.info(f"Saved {len(signals)} signals to {output_path}")


# Example usage function
def example_usage():
    """
    Example of how to use the SignalAggregator class.
    """
    # Initialize the aggregator
    aggregator = SignalAggregator()
    
    # Sample data for BTC
    btc_sentiment = pd.DataFrame({
        'text': [
            "Bitcoin looking bullish today!",
            "BTC might break resistance soon",
            "Not sure about BTC, market seems uncertain",
            "Bearish on Bitcoin for now"
        ],
        'likes': [120, 45, 10, 30],
        'retweets': [50, 15, 2, 12],
        'comments': [25, 8, 3, 5]
    })
    
    btc_metrics = {
        'liquidity': 850000,
        'volume': 25000000,
        'average_volume': 20000000,
        'price_change_pct': 2.5
    }
    
    # Sample data for ETH
    eth_sentiment = pd.DataFrame({
        'text': [
            "Ethereum upgrade coming soon!",
            "ETH looking weak compared to BTC",
            "Bullish on ETH long term",
            "ETH might drop further"
        ],
        'likes': [80, 25, 60, 40],
        'retweets': [30, 10, 25, 15],
        'comments': [15, 5, 12, 8]
    })
    
    eth_metrics = {
        'liquidity': 650000,
        'volume': 15000000,
        'average_volume': 18000000,
        'price_change_pct': -1.2
    }
    
    # Generate signals for both assets
    data = {
        'BTC': {'sentiment': btc_sentiment, 'metrics': btc_metrics},
        'ETH': {'sentiment': eth_sentiment, 'metrics': eth_metrics}
    }
    
    signals = aggregator.generate_signals_batch(data)
    
    # Save to JSON
    aggregator.save_signals_to_json(signals, 'output/signals.json')
    
    # Print the signals
    print(json.dumps(signals, indent=2))
    
    return signals


if __name__ == "__main__":
    # Run the example
    example_usage()

