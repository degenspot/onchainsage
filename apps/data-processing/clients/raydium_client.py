import logging
from typing import Any, Dict, List
import time

from .base import BaseClient

logger = logging.getLogger(__name__)

class RaydiumClient(BaseClient):
    """Client for fetching Raydium liquidity pool data."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Raydium client.
        
        Args:
            config: Configuration dictionary containing Raydium API settings
        """
        super().__init__(config)
        self.endpoint = config['endpoint']
        self.rate_limit = config['rate_limit']
        self.last_request_time = 0
        
    def validate_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate the Raydium API response format.
        
        Args:
            response: API response to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not isinstance(response, dict):
            return False
            
        required_fields = ['success', 'data']
        if not all(field in response for field in required_fields):
            return False
            
        if not response['success']:
            return False
            
        if not isinstance(response['data'], list):
            return False
            
        for pool in response['data']:
            required_pool_fields = ['id', 'mintA', 'mintB', 'tvl', 'price']
            if not all(field in pool for field in required_pool_fields):
                return False
                
        return True
        
    def _rate_limit(self):
        """Implement rate limiting."""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < 1.0 / self.rate_limit:
            time.sleep(1.0 / self.rate_limit - elapsed)
        self.last_request_time = time.time()
        
    def get_pools(self) -> List[Dict[str, Any]]:
        """
        Fetch all liquidity pools.
        
        Returns:
            List of liquidity pools with their metadata
        """
        self._rate_limit()
        
        response = self._make_request(
            method='GET',
            url=f"{self.endpoint}/pools"
        )
        
        pools = []
        for pool in response['data']:
            processed_pool = {
                'id': pool['id'],
                'mintA': pool['mintA'],
                'mintB': pool['mintB'],
                'tvl': float(pool['tvl']),
                'price': float(pool['price']),
                'volume_24h': float(pool.get('volume24h', 0)),
                'fee_24h': float(pool.get('fee24h', 0)),
                'apy': float(pool.get('apy', 0))
            }
            pools.append(processed_pool)
            
        logger.info(f"Fetched {len(pools)} liquidity pools")
        return pools
        
    def get_pool_by_id(self, pool_id: str) -> Dict[str, Any]:
        """
        Fetch a specific liquidity pool by ID.
        
        Args:
            pool_id: The ID of the pool to fetch
            
        Returns:
            Pool data dictionary
            
        Raises:
            ValueError: If pool is not found
        """
        self._rate_limit()
        
        response = self._make_request(
            method='GET',
            url=f"{self.endpoint}/pools/{pool_id}"
        )
        
        if not response['success'] or not response['data']:
            raise ValueError(f"Pool {pool_id} not found")
            
        pool = response['data']
        return {
            'id': pool['id'],
            'mintA': pool['mintA'],
            'mintB': pool['mintB'],
            'tvl': float(pool['tvl']),
            'price': float(pool['price']),
            'volume_24h': float(pool.get('volume24h', 0)),
            'fee_24h': float(pool.get('fee24h', 0)),
            'apy': float(pool.get('apy', 0))
        } 