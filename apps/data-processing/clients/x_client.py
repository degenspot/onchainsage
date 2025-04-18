import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import json

from .base import BaseClient

logger = logging.getLogger(__name__)

class XClient(BaseClient):
    """Client for fetching tweets using Nitter."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the X client.
        
        Args:
            config: Configuration dictionary containing X API settings
        """
        super().__init__(config)
        self.bearer_token = config['bearer_token']
        self.endpoint = config['endpoint']
        self.query = config['query']
        self.max_results = config['max_results']
        
    def validate_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate the X API response format.
        
        Args:
            response: API response to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = ['data', 'includes']
        if not all(field in response for field in required_fields):
            return False
            
        if not isinstance(response['data'], list):
            return False
            
        for tweet in response['data']:
            if not all(field in tweet for field in ['id', 'text', 'author_id']):
                return False
                
        return True
        
    def get_tweets(self, 
                  start_time: Optional[datetime] = None, 
                  end_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Fetch tweets matching the configured query.
        
        Args:
            start_time: Optional start time for tweet search
            end_time: Optional end time for tweet search
            
        Returns:
            List of tweets with their metadata
        """
        params = {
            'query': self.query,
            'max_results': self.max_results,
            'tweet.fields': 'id,text,author_id,created_at,public_metrics',
            'user.fields': 'id,name,username,verified',
            'expansions': 'author_id'
        }
        
        if start_time:
            params['start_time'] = start_time.isoformat() + 'Z'
        if end_time:
            params['end_time'] = end_time.isoformat() + 'Z'
            
        headers = {
            'Authorization': f'Bearer {self.bearer_token}'
        }
        
        response = self._make_request(
            method='GET',
            url=self.endpoint,
            headers=headers,
            params=params
        )
        
        # Process and enrich tweet data
        tweets = []
        users = {user['id']: user for user in response['includes']['users']}
        
        for tweet in response['data']:
            user = users.get(tweet['author_id'], {})
            enriched_tweet = {
                'id': tweet['id'],
                'text': tweet['text'],
                'author_id': tweet['author_id'],
                'created_at': tweet['created_at'],
                'likes': tweet['public_metrics']['like_count'],
                'retweets': tweet['public_metrics']['retweet_count'],
                'comments': tweet['public_metrics']['reply_count'],
                'author_name': user.get('name'),
                'author_username': user.get('username'),
                'author_verified': user.get('verified', False)
            }
            tweets.append(enriched_tweet)
            
        logger.info(f"Fetched {len(tweets)} tweets")
        return tweets 