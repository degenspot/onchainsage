from typing import Dict, Any

from .x_client import XClient
from .raydium_client import RaydiumClient
from .dex_screener_client import DexScreenerClient
from .forum_client import ForumClient

__all__ = ['XClient', 'RaydiumClient', 'DexScreenerClient', 'ForumClient', 'create_clients']

def create_clients(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create instances of all API clients.
    
    Args:
        config: Configuration dictionary containing settings for all clients
        
    Returns:
        Dictionary containing client instances
    """
    return {
        'x': XClient(config['api']['x']),
        'raydium': RaydiumClient(config['api']['raydium']),
        'dex_screener': DexScreenerClient(config['api']['dex_screener']),
        'forum': ForumClient(config['data'])
    } 