""" Main script to run the signal pipeline. """


import time
import logging
from x_scraper.main import scrape_tweets
from sentiment_analysis import CryptoSentimentAnalyzer
from validation.validation import validate_tweets
from signal_aggregator import SignalAggregator



# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_pipeline():
    """Execute the pipeline: ingest data, analyze it, and generate signals."""
    logger.info("Starting pipeline run")

    # Step 1: Ingestion
    logger.info("Ingesting data from market APIs and tweets")
    try:
        tweets = scrape_tweets(terms = ['crypto', 'btc', 'bitcoin', 'eth', 'ethereum', 'web3'], num_tweets = 100)  # Fetch raw market and sentiment data 

    except ValueError as e:  # Replace with the specific exception type
        logger.error("Ingestion failed: %s", str(e))
        return

    # Step 2: Analysis
    logger.info("Analyzing ingested data")
    try:
        validated_data = validate_tweets(tweets)  # Process data into required format
    except ValueError as e:  # Replace with the specific exception type for analyze_data
        logger.error("Analysis failed: %s", str(e))
        return

    # Step 3: Aggregation
    logger.info("Aggregating data and generating signals")
    try:
        aggregator = SignalAggregator()
        signals = aggregator.generate_signals_batch(validated_data)
        
        # Save signals with timestamp
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        output_path = f"output/signals_{timestamp}.json"
        aggregator.save_signals_to_json(signals, output_path)
        logger.info("Generated and saved %d signals for this cycle", len(signals))
    except (IOError, ValueError) as e:  # Replace with specific exceptions relevant to aggregation
        logger.error("Aggregation failed: %s", str(e))
        return

    logger.info("Pipeline run completed successfully")

def main():
    """Run the pipeline for 5 cycles, with 5 minutes between each run."""
    total_cycles = 5
    for cycle in range(total_cycles):
        logger.info("Starting cycle %d of %d", cycle + 1, total_cycles)
        run_pipeline()
        if cycle < total_cycles - 1:  # No sleep after the last cycle
            logger.info("Waiting 5 minutes until the next cycle")
            time.sleep(300)  # 300 seconds = 5 minutes
    logger.info("Pipeline: Completed all 5 cycles")

if __name__ == "__main__":
    main()
