from abc import ABC, abstractmethod
import logging
import time
from typing import Any, Dict, Optional
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class BaseClient(ABC):
    """Base class for all API clients with common functionality."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the base client.
        
        Args:
            config: Configuration dictionary containing API settings
        """
        self.config = config
        self.session = requests.Session()
        
    @abstractmethod
    def validate_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate the API response format.
        
        Args:
            response: API response to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        pass
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _make_request(self, 
                     method: str, 
                     url: str, 
                     headers: Optional[Dict[str, str]] = None, 
                     params: Optional[Dict[str, Any]] = None,
                     data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make an HTTP request with retry logic.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            headers: Optional request headers
            params: Optional query parameters
            data: Optional request body
            
        Returns:
            Dict containing the response data
            
        Raises:
            requests.exceptions.RequestException: If request fails after retries
        """
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            if not self.validate_response(data):
                raise ValueError("Invalid response format")
                
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
            raise
            
    def close(self):
        """Close the client session."""
        self.session.close() 