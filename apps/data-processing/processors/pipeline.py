import logging
import yaml
from typing import Any, Dict, List
from datetime import datetime, timedelta
import os
import asyncio
from prometheus_client import start_http_server, Counter, Gauge, Histogram
import sentry_sdk

from clients import create_clients
from processors.validation import DataValidator
from processors.sentiment import CompositeSentimentAnalyzer
from processors.profitability import ProfitabilityCalculator
from processors.signal_aggregator import SignalAggregator
from models.storage import Storage

logger = logging.getLogger(__name__)

# Prometheus metrics
PROCESSED_TWEETS = Counter('processed_tweets_total', 'Number of tweets processed')
PROCESSED_POOLS = Counter('processed_pools_total', 'Number of liquidity pools processed')
PROCESSED_CALLS = Counter('processed_forum_calls_total', 'Number of forum calls processed')
GENERATED_SIGNALS = Counter('generated_signals_total', 'Number of trading signals generated')

PROCESSING_TIME = Histogram('processing_time_seconds', 'Time spent processing data')
SIGNAL_SCORE = Gauge('signal_score', 'Trading signal score', ['token', 'category'])

class Pipeline:
    """Main pipeline orchestrator."""
    
    def __init__(self, config_path: str):
        """
        Initialize pipeline.
        
        Args:
            config_path: Path to pipeline configuration file
        """
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
            
        # Initialize Sentry
        sentry_sdk.init(
            dsn=self.config['monitoring']['sentry']['dsn'],
            environment=self.config['monitoring']['sentry']['environment']
        )
        
        # Initialize components
        self.clients = create_clients(self.config)
        self.validator = DataValidator()
        self.sentiment_analyzer = CompositeSentimentAnalyzer(self.config['sentiment'])
        self.profitability_calculator = ProfitabilityCalculator()
        self.signal_aggregator = SignalAggregator(self.config['signal'])
        self.storage = Storage(self.config['storage'])
        
        # Connect to databases
        self.storage.connect()
        
        # Start Prometheus server
        start_http_server(self.config['monitoring']['prometheus']['port'])
        
    async def ingest_data(self) -> Dict[str, Any]:
        """
        Ingest data from all sources.
        
        Returns:
            Dictionary containing ingested data
        """
        try:
            # Get tweets
            tweets = await asyncio.to_thread(
                self.clients['x'].get_tweets,
                start_time=datetime.utcnow() - timedelta(hours=24)
            )
            PROCESSED_TWEETS.inc(len(tweets))
            
            # Get liquidity pools
            pools = await asyncio.to_thread(self.clients['raydium'].get_pools)
            PROCESSED_POOLS.inc(len(pools))
            
            # Get token metrics for each pool
            token_metrics = []
            for pool in pools:
                metrics = await asyncio.to_thread(
                    self.clients['dex_screener'].get_token_metrics,
                    pool['mintA']
                )
                token_metrics.append(metrics)
                
            # Get forum calls
            forum_calls = await asyncio.to_thread(
                self.clients['forum'].get_calls,
                start_time=datetime.utcnow() - timedelta(days=7)
            )
            PROCESSED_CALLS.inc(len(forum_calls))
            
            return {
                'tweets': tweets,
                'pools': pools,
                'token_metrics': token_metrics,
                'forum_calls': forum_calls
            }
            
        except Exception as e:
            logger.error(f"Error ingesting data: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise
            
    async def process_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process ingested data.
        
        Args:
            data: Dictionary containing ingested data
            
        Returns:
            Dictionary containing processed data
        """
        try:
            # Validate data
            valid_data = self.validator.filter_valid_data(
                tweets=data['tweets'],
                pools=data['pools'],
                token_metrics=data['token_metrics'],
                forum_calls=data['forum_calls']
            )
            
            # Analyze sentiment
            sentiments = await asyncio.to_thread(
                self.sentiment_analyzer.analyze_tweets,
                valid_data['tweets']
            )
            
            # Calculate profitability
            # Create price lookup from token metrics
            current_prices = {
                metric['address']: metric['price_usd']
                for metric in valid_data['token_metrics']
            }
            
            profitability = await asyncio.to_thread(
                self.profitability_calculator.calculate_calls_profitability,
                valid_data['forum_calls'],
                current_prices
            )
            
            # Generate signals
            signals = await asyncio.to_thread(
                self.signal_aggregator.generate_signals,
                sentiments=sentiments,
                market_metrics={m['address']: m for m in valid_data['token_metrics']},
                profitability={p['token']: [p] for p in profitability}
            )
            
            GENERATED_SIGNALS.inc(len(signals))
            
            # Update Prometheus metrics
            for signal in signals:
                SIGNAL_SCORE.labels(
                    token=signal['token'],
                    category=signal['category']
                ).set(signal['score'])
                
            return {
                'valid_data': valid_data,
                'sentiments': sentiments,
                'profitability': profitability,
                'signals': signals
            }
            
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise
            
    async def store_data(self, data: Dict[str, Any]):
        """
        Store processed data.
        
        Args:
            data: Dictionary containing processed data
        """
        try:
            # Store in PostgreSQL
            await asyncio.to_thread(
                self.storage.store_tweets,
                data['valid_data']['tweets']
            )
            
            await asyncio.to_thread(
                self.storage.store_market_metrics,
                data['valid_data']['token_metrics']
            )
            
            await asyncio.to_thread(
                self.storage.store_forum_calls,
                data['valid_data']['forum_calls']
            )
            
            await asyncio.to_thread(
                self.storage.store_signals,
                data['signals']
            )
            
            # Cache in Redis
            self.storage.cache_data(
                'latest_signals',
                data['signals'],
                ttl=3600  # 1 hour
            )
            
            self.storage.cache_data(
                'latest_market_metrics',
                {m['address']: m for m in data['valid_data']['token_metrics']},
                ttl=300  # 5 minutes
            )
            
        except Exception as e:
            logger.error(f"Error storing data: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise
            
    async def run(self):
        """Run the pipeline."""
        try:
            with PROCESSING_TIME.time():
                # Ingest data
                logger.info("Starting data ingestion")
                data = await self.ingest_data()
                logger.info("Data ingestion complete")
                
                # Process data
                logger.info("Starting data processing")
                processed = await self.process_data(data)
                logger.info("Data processing complete")
                
                # Store results
                logger.info("Starting data storage")
                await self.store_data(processed)
                logger.info("Data storage complete")
                
        except Exception as e:
            logger.error(f"Pipeline run failed: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise
            
        finally:
            self.storage.close()
            
    @classmethod
    async def create_and_run(cls, config_path: str):
        """
        Create and run pipeline instance.
        
        Args:
            config_path: Path to pipeline configuration file
        """
        pipeline = cls(config_path)
        await pipeline.run()

if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Get config path
    config_path = os.getenv('PIPELINE_CONFIG', 'config/pipeline.yaml')
    
    # Run pipeline
    asyncio.run(Pipeline.create_and_run(config_path)) 