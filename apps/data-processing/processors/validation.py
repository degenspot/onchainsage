import logging
from typing import Any, Dict, List, Set
import re

logger = logging.getLogger(__name__)

class DataValidator:
    """Validates data from various sources."""
    
    def __init__(self):
        """Initialize the data validator."""
        # Common crypto keywords for validation
        self.crypto_keywords: Set[str] = {
            'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'token', 'blockchain',
            'defi', 'nft', 'solana', 'sol', 'trading', 'market', 'price',
            'bull', 'bear', 'buy', 'sell', 'long', 'short', 'hodl', 'moon'
        }
        
    def validate_tweet(self, tweet: Dict[str, Any]) -> bool:
        """
        Validate a tweet.
        
        Args:
            tweet: Tweet data dictionary
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check required fields
            required_fields = ['id', 'text', 'author_id', 'created_at']
            if not all(field in tweet for field in required_fields):
                logger.warning(f"Tweet missing required fields: {tweet.get('id', 'unknown')}")
                return False
                
            # Check text content
            text = tweet['text'].lower()
            if not text or len(text.strip()) == 0:
                logger.warning(f"Empty tweet text: {tweet['id']}")
                return False
                
            # Check for crypto relevance
            if not any(keyword in text for keyword in self.crypto_keywords):
                logger.warning(f"Tweet not crypto-related: {tweet['id']}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error validating tweet: {str(e)}")
            return False
            
    def validate_pool(self, pool: Dict[str, Any]) -> bool:
        """
        Validate a Raydium liquidity pool.
        
        Args:
            pool: Pool data dictionary
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check required fields
            required_fields = ['id', 'mintA', 'mintB', 'tvl', 'price']
            if not all(field in pool for field in required_fields):
                logger.warning(f"Pool missing required fields: {pool.get('id', 'unknown')}")
                return False
                
            # Validate numerical fields
            numerical_fields = ['tvl', 'price', 'volume_24h', 'fee_24h', 'apy']
            for field in numerical_fields:
                if field in pool:
                    value = pool[field]
                    if not isinstance(value, (int, float)) or value < 0:
                        logger.warning(f"Invalid {field} in pool {pool['id']}: {value}")
                        return False
                        
            return True
            
        except Exception as e:
            logger.error(f"Error validating pool: {str(e)}")
            return False
            
    def validate_token_metrics(self, metrics: Dict[str, Any]) -> bool:
        """
        Validate token metrics from DexScreener.
        
        Args:
            metrics: Token metrics dictionary
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check required fields
            required_fields = ['address', 'volume_24h', 'liquidity_usd', 'price_usd']
            if not all(field in metrics for field in required_fields):
                logger.warning(f"Token metrics missing required fields: {metrics.get('address', 'unknown')}")
                return False
                
            # Validate numerical fields
            numerical_fields = ['volume_24h', 'liquidity_usd', 'price_usd', 'price_change_pct']
            for field in numerical_fields:
                if field in metrics:
                    value = metrics[field]
                    if not isinstance(value, (int, float)) or (field != 'price_change_pct' and value < 0):
                        logger.warning(f"Invalid {field} in token metrics {metrics['address']}: {value}")
                        return False
                        
            return True
            
        except Exception as e:
            logger.error(f"Error validating token metrics: {str(e)}")
            return False
            
    def validate_forum_call(self, call: Dict[str, Any]) -> bool:
        """
        Validate a forum trading call.
        
        Args:
            call: Forum call dictionary
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check required fields
            required_fields = ['post_id', 'author', 'content', 'timestamp']
            if not all(field in call for field in required_fields):
                logger.warning(f"Forum call missing required fields: {call.get('post_id', 'unknown')}")
                return False
                
            # Check content
            content = call['content'].lower()
            if not content or len(content.strip()) == 0:
                logger.warning(f"Empty forum call content: {call['post_id']}")
                return False
                
            # Check for trading action
            if not any(action in content for action in ['buy', 'sell', 'long', 'short']):
                logger.warning(f"No trading action in forum call: {call['post_id']}")
                return False
                
            # Check for asset mention
            if not any(keyword in content for keyword in self.crypto_keywords):
                logger.warning(f"No asset mentioned in forum call: {call['post_id']}")
                return False
                
            # Validate numerical fields if present
            if 'confidence' in call:
                confidence = call['confidence']
                if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                    logger.warning(f"Invalid confidence in forum call {call['post_id']}: {confidence}")
                    return False
                    
            return True
            
        except Exception as e:
            logger.error(f"Error validating forum call: {str(e)}")
            return False
            
    def filter_valid_data(self, 
                         tweets: List[Dict[str, Any]] = None,
                         pools: List[Dict[str, Any]] = None,
                         token_metrics: List[Dict[str, Any]] = None,
                         forum_calls: List[Dict[str, Any]] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Filter and return only valid data from all sources.
        
        Args:
            tweets: List of tweets
            pools: List of liquidity pools
            token_metrics: List of token metrics
            forum_calls: List of forum calls
            
        Returns:
            Dictionary containing filtered valid data for each source
        """
        valid_data = {}
        
        if tweets is not None:
            valid_tweets = [tweet for tweet in tweets if self.validate_tweet(tweet)]
            logger.info(f"Validated tweets: {len(valid_tweets)}/{len(tweets)} valid")
            valid_data['tweets'] = valid_tweets
            
        if pools is not None:
            valid_pools = [pool for pool in pools if self.validate_pool(pool)]
            logger.info(f"Validated pools: {len(valid_pools)}/{len(pools)} valid")
            valid_data['pools'] = valid_pools
            
        if token_metrics is not None:
            valid_metrics = [metrics for metrics in token_metrics if self.validate_token_metrics(metrics)]
            logger.info(f"Validated token metrics: {len(valid_metrics)}/{len(token_metrics)} valid")
            valid_data['token_metrics'] = valid_metrics
            
        if forum_calls is not None:
            valid_calls = [call for call in forum_calls if self.validate_forum_call(call)]
            logger.info(f"Validated forum calls: {len(valid_calls)}/{len(forum_calls)} valid")
            valid_data['forum_calls'] = valid_calls
            
        return valid_data 