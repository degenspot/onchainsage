import logging
from typing import Any, Dict, List, Optional
import json
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import Json
import redis

logger = logging.getLogger(__name__)

class Storage:
    """Handles data storage in PostgreSQL and Redis."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize storage connections.
        
        Args:
            config: Configuration dictionary containing storage settings
        """
        self.config = config
        self.pg_config = config['postgres']
        self.redis_config = config['redis']
        self.cache_ttl = config.get('cache_ttl', 86400)  # 24 hours default
        
        # Initialize connections
        self.pg_conn = None
        self.redis_client = None
        
    def connect(self):
        """
        Establish database connections.
        
        Raises:
            psycopg2.Error: If PostgreSQL connection fails
            redis.ConnectionError: If Redis connection fails
        """
        try:
            # Connect to PostgreSQL
            self.pg_conn = psycopg2.connect(
                host=self.pg_config['host'],
                port=self.pg_config['port'],
                database=self.pg_config['database'],
                user=self.pg_config['user'],
                password=self.pg_config['password']
            )
            
            # Create tables if they don't exist
            self._create_tables()
            
            # Connect to Redis
            self.redis_client = redis.Redis(
                host=self.redis_config['host'],
                port=self.redis_config['port'],
                password=self.redis_config['password'],
                db=self.redis_config['db'],
                decode_responses=True
            )
            
            logger.info("Successfully connected to PostgreSQL and Redis")
            
        except Exception as e:
            logger.error(f"Error connecting to databases: {str(e)}")
            raise
            
    def _create_tables(self):
        """Create required database tables if they don't exist."""
        with self.pg_conn.cursor() as cur:
            # Create tweets table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS tweets (
                    id BIGINT PRIMARY KEY,
                    text TEXT NOT NULL,
                    author_id BIGINT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    likes INTEGER NOT NULL DEFAULT 0,
                    retweets INTEGER NOT NULL DEFAULT 0,
                    comments INTEGER NOT NULL DEFAULT 0,
                    sentiment JSONB,
                    created_at_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create market_metrics table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS market_metrics (
                    token_address TEXT NOT NULL,
                    volume_24h NUMERIC NOT NULL,
                    liquidity_usd NUMERIC NOT NULL,
                    price_usd NUMERIC NOT NULL,
                    price_change_pct NUMERIC,
                    whale_transactions INTEGER,
                    whale_volume_usd NUMERIC,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (token_address, timestamp)
                )
            """)
            
            # Create forum_calls table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS forum_calls (
                    post_id TEXT PRIMARY KEY,
                    author TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    sentiment TEXT,
                    confidence NUMERIC,
                    profitability JSONB,
                    created_at_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create signals table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    token TEXT NOT NULL,
                    score NUMERIC NOT NULL,
                    category TEXT NOT NULL,
                    confidence TEXT NOT NULL,
                    components JSONB NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.pg_conn.commit()
            
    def store_tweets(self, tweets: List[Dict[str, Any]]):
        """
        Store tweets in PostgreSQL.
        
        Args:
            tweets: List of tweet dictionaries
        """
        with self.pg_conn.cursor() as cur:
            for tweet in tweets:
                cur.execute("""
                    INSERT INTO tweets (
                        id, text, author_id, created_at,
                        likes, retweets, comments, sentiment
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        likes = EXCLUDED.likes,
                        retweets = EXCLUDED.retweets,
                        comments = EXCLUDED.comments,
                        sentiment = EXCLUDED.sentiment
                """, (
                    tweet['id'],
                    tweet['text'],
                    tweet['author_id'],
                    tweet['created_at'],
                    tweet['likes'],
                    tweet['retweets'],
                    tweet['comments'],
                    Json(tweet.get('sentiment', {}))
                ))
            self.pg_conn.commit()
            
    def store_market_metrics(self, metrics: List[Dict[str, Any]]):
        """
        Store market metrics in PostgreSQL.
        
        Args:
            metrics: List of market metrics dictionaries
        """
        with self.pg_conn.cursor() as cur:
            for metric in metrics:
                cur.execute("""
                    INSERT INTO market_metrics (
                        token_address, volume_24h, liquidity_usd,
                        price_usd, price_change_pct,
                        whale_transactions, whale_volume_usd,
                        timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (token_address, timestamp) DO UPDATE SET
                        volume_24h = EXCLUDED.volume_24h,
                        liquidity_usd = EXCLUDED.liquidity_usd,
                        price_usd = EXCLUDED.price_usd,
                        price_change_pct = EXCLUDED.price_change_pct,
                        whale_transactions = EXCLUDED.whale_transactions,
                        whale_volume_usd = EXCLUDED.whale_volume_usd
                """, (
                    metric['address'],
                    metric['volume_24h'],
                    metric['liquidity_usd'],
                    metric['price_usd'],
                    metric.get('price_change_pct'),
                    metric.get('whale_transactions'),
                    metric.get('whale_volume_usd'),
                    datetime.utcnow()
                ))
            self.pg_conn.commit()
            
    def store_forum_calls(self, calls: List[Dict[str, Any]]):
        """
        Store forum calls in PostgreSQL.
        
        Args:
            calls: List of forum call dictionaries
        """
        with self.pg_conn.cursor() as cur:
            for call in calls:
                cur.execute("""
                    INSERT INTO forum_calls (
                        post_id, author, content, timestamp,
                        sentiment, confidence, profitability
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (post_id) DO UPDATE SET
                        sentiment = EXCLUDED.sentiment,
                        confidence = EXCLUDED.confidence,
                        profitability = EXCLUDED.profitability
                """, (
                    call['post_id'],
                    call['author'],
                    call['content'],
                    call['timestamp'],
                    call.get('sentiment'),
                    call.get('confidence'),
                    Json(call.get('profitability', {}))
                ))
            self.pg_conn.commit()
            
    def store_signals(self, signals: List[Dict[str, Any]]):
        """
        Store trading signals in PostgreSQL.
        
        Args:
            signals: List of signal dictionaries
        """
        with self.pg_conn.cursor() as cur:
            for signal in signals:
                cur.execute("""
                    INSERT INTO signals (
                        token, score, category, confidence,
                        components, timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    signal['token'],
                    signal['score'],
                    signal['category'],
                    signal['confidence'],
                    Json(signal['components']),
                    signal['timestamp']
                ))
            self.pg_conn.commit()
            
    def cache_data(self, key: str, data: Any, ttl: Optional[int] = None):
        """
        Cache data in Redis.
        
        Args:
            key: Cache key
            data: Data to cache
            ttl: Optional TTL in seconds (defaults to configured TTL)
        """
        try:
            self.redis_client.set(
                key,
                json.dumps(data),
                ex=ttl or self.cache_ttl
            )
        except Exception as e:
            logger.error(f"Error caching data: {str(e)}")
            
    def get_cached_data(self, key: str) -> Optional[Any]:
        """
        Get cached data from Redis.
        
        Args:
            key: Cache key
            
        Returns:
            Cached data if found, None otherwise
        """
        try:
            data = self.redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Error getting cached data: {str(e)}")
            return None
            
    def close(self):
        """Close database connections."""
        if self.pg_conn:
            self.pg_conn.close()
        if self.redis_client:
            self.redis_client.close() 