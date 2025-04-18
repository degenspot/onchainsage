import json
import logging
from typing import Any, Dict, List
from datetime import datetime

from .base import BaseClient

logger = logging.getLogger(__name__)

class ForumClient(BaseClient):
    """Client for reading simulated forum trading calls."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Forum client.
        
        Args:
            config: Configuration dictionary containing forum settings
        """
        super().__init__(config)
        self.forum_calls_path = config['forum_calls_path']
        
    def validate_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate the forum calls data format.
        
        Args:
            response: Forum calls data to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not isinstance(response, dict):
            return False
            
        required_fields = ['calls']
        if not all(field in response for field in required_fields):
            return False
            
        if not isinstance(response['calls'], list):
            return False
            
        for call in response['calls']:
            required_call_fields = ['post_id', 'author', 'content', 'timestamp']
            if not all(field in call for field in required_call_fields):
                return False
                
        return True
        
    def get_calls(self, start_time: datetime = None, end_time: datetime = None) -> List[Dict[str, Any]]:
        """
        Read forum trading calls from the JSON file.
        
        Args:
            start_time: Optional start time filter
            end_time: Optional end time filter
            
        Returns:
            List of trading calls
            
        Raises:
            FileNotFoundError: If forum calls file doesn't exist
            json.JSONDecodeError: If forum calls file is invalid JSON
        """
        try:
            with open(self.forum_calls_path, 'r') as f:
                data = json.load(f)
                
            if not self.validate_response(data):
                raise ValueError("Invalid forum calls data format")
                
            calls = []
            for call in data['calls']:
                call_time = datetime.fromisoformat(call['timestamp'].replace('Z', '+00:00'))
                
                # Apply time filters if provided
                if start_time and call_time < start_time:
                    continue
                if end_time and call_time > end_time:
                    continue
                    
                processed_call = {
                    'post_id': call['post_id'],
                    'author': call['author'],
                    'content': call['content'],
                    'timestamp': call_time,
                    'sentiment': call.get('sentiment', 'neutral'),
                    'confidence': float(call.get('confidence', 0.5)),
                    'targets': call.get('targets', []),
                    'stop_loss': call.get('stop_loss'),
                    'take_profit': call.get('take_profit')
                }
                calls.append(processed_call)
                
            logger.info(f"Read {len(calls)} forum calls")
            return calls
            
        except FileNotFoundError:
            logger.error(f"Forum calls file not found: {self.forum_calls_path}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in forum calls file: {str(e)}")
            raise
            
    def parse_trading_action(self, content: str) -> Dict[str, Any]:
        """
        Parse trading action from call content.
        
        Args:
            content: The content of the trading call
            
        Returns:
            Dictionary containing parsed trading action
        """
        content = content.lower()
        
        # Extract action (buy/sell)
        action = None
        if 'buy' in content or 'long' in content:
            action = 'buy'
        elif 'sell' in content or 'short' in content:
            action = 'sell'
            
        # Extract price targets
        import re
        price_pattern = r'\$?\d+(?:,\d{3})*(?:\.\d+)?[k|K|m|M]?'
        prices = re.findall(price_pattern, content)
        
        # Convert price strings to float values
        def parse_price(price_str: str) -> float:
            price_str = price_str.replace('$', '').replace(',', '')
            multiplier = 1
            if price_str[-1].lower() == 'k':
                multiplier = 1000
                price_str = price_str[:-1]
            elif price_str[-1].lower() == 'm':
                multiplier = 1000000
                price_str = price_str[:-1]
            return float(price_str) * multiplier
            
        prices = [parse_price(p) for p in prices]
        
        # Try to identify stop loss and take profit
        stop_loss = None
        take_profit = None
        
        if 'sl' in content or 'stop' in content:
            # Find the closest price after sl/stop mention
            sl_idx = content.find('sl') if 'sl' in content else content.find('stop')
            for price in prices:
                price_idx = content.find(str(price))
                if price_idx > sl_idx:
                    stop_loss = price
                    break
                    
        if 'tp' in content or 'target' in content:
            # Find the closest price after tp/target mention
            tp_idx = content.find('tp') if 'tp' in content else content.find('target')
            for price in prices:
                price_idx = content.find(str(price))
                if price_idx > tp_idx:
                    take_profit = price
                    break
                    
        return {
            'action': action,
            'prices': prices,
            'stop_loss': stop_loss,
            'take_profit': take_profit
        } 