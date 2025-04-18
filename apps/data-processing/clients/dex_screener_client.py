import logging
from typing import Any, Dict, List
import time

from .base import BaseClient

logger = logging.getLogger(__name__)

class DexScreenerClient(BaseClient):
    """Client for fetching token metrics from DexScreener."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the DexScreener client.
        
        Args:
            config: Configuration dictionary containing DexScreener API settings
        """
        super().__init__(config)
        self.endpoint = config['endpoint']
        self.rate_limit = config['rate_limit']
        self.last_request_time = 0
        
    def validate_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate the DexScreener API response format.
        
        Args:
            response: API response to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not isinstance(response, dict):
            return False
            
        required_fields = ['pairs']
        if not all(field in response for field in required_fields):
            return False
            
        if not isinstance(response['pairs'], list):
            return False
            
        for pair in response['pairs']:
            required_pair_fields = ['chainId', 'dexId', 'baseToken', 'quoteToken', 'priceUsd', 'volume']
            if not all(field in pair for field in required_pair_fields):
                return False
                
        return True
        
    def _rate_limit(self):
        """Implement rate limiting."""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < 1.0 / self.rate_limit:
            time.sleep(1.0 / self.rate_limit - elapsed)
        self.last_request_time = time.time()
        
    def get_token_metrics(self, token_address: str) -> Dict[str, Any]:
        """
        Fetch metrics for a specific token.
        
        Args:
            token_address: The address of the token to fetch metrics for
            
        Returns:
            Token metrics dictionary
            
        Raises:
            ValueError: If token is not found
        """
        self._rate_limit()
        
        response = self._make_request(
            method='GET',
            url=f"{self.endpoint}/tokens/{token_address}"
        )
        
        if not response.get('pairs'):
            raise ValueError(f"No pairs found for token {token_address}")
            
        # Aggregate metrics across all pairs
        total_volume = 0
        total_liquidity = 0
        price_changes = []
        whale_txs = []
        
        for pair in response['pairs']:
            total_volume += float(pair['volume']['h24'])
            total_liquidity += float(pair['liquidity']['usd'])
            
            if 'priceChange' in pair:
                price_changes.append(float(pair['priceChange']['h24']))
                
            # Look for whale transactions (>$100k)
            if 'txns' in pair:
                whale_txs.extend([
                    tx for tx in pair['txns']['h24']
                    if float(tx['volumeUsd']) > 100000
                ])
                
        # Calculate average price change
        avg_price_change = sum(price_changes) / len(price_changes) if price_changes else 0
        
        metrics = {
            'address': token_address,
            'volume_24h': total_volume,
            'liquidity_usd': total_liquidity,
            'price_change_pct': avg_price_change,
            'whale_transactions': len(whale_txs),
            'whale_volume_usd': sum(float(tx['volumeUsd']) for tx in whale_txs),
            'pairs_count': len(response['pairs']),
            'price_usd': float(response['pairs'][0]['priceUsd']) if response['pairs'] else 0
        }
        
        logger.info(f"Fetched metrics for token {token_address}")
        return metrics
        
    def get_top_pairs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch top trading pairs by volume.
        
        Args:
            limit: Maximum number of pairs to return
            
        Returns:
            List of trading pair dictionaries
        """
        self._rate_limit()
        
        response = self._make_request(
            method='GET',
            url=f"{self.endpoint}/pairs/trending",
            params={'limit': limit}
        )
        
        pairs = []
        for pair in response['pairs'][:limit]:
            processed_pair = {
                'chain_id': pair['chainId'],
                'dex_id': pair['dexId'],
                'pair_address': pair['pairAddress'],
                'base_token': {
                    'address': pair['baseToken']['address'],
                    'symbol': pair['baseToken']['symbol'],
                    'name': pair['baseToken'].get('name', '')
                },
                'quote_token': {
                    'address': pair['quoteToken']['address'],
                    'symbol': pair['quoteToken']['symbol'],
                    'name': pair['quoteToken'].get('name', '')
                },
                'price_usd': float(pair['priceUsd']),
                'volume_24h': float(pair['volume']['h24']),
                'liquidity_usd': float(pair['liquidity']['usd']),
                'price_change_24h': float(pair.get('priceChange', {}).get('h24', 0))
            }
            pairs.append(processed_pair)
            
        logger.info(f"Fetched {len(pairs)} top pairs")
        return pairs 