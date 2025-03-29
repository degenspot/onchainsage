import pandas as pd
import json
import os
from signal_aggregator import SignalAggregator

def run_examples():
    """
    Run examples using the X scraper data to demonstrate the signal aggregator.
    """
    # Initialize the aggregator
    aggregator = SignalAggregator()
    
    # Load X scraper data
    try:
        x_data = pd.read_csv('x_scraper/x_scraper.csv')
        print(f"Loaded {len(x_data)} tweets from X scraper data")
    except Exception as e:
        print(f"Error loading X scraper data: {e}")
        # Create sample data if file not found
        x_data = pd.DataFrame({
            'text': [
                "Bitcoin looking bullish today!",
                "BTC might break resistance soon",
                "Not sure about BTC, market seems uncertain",
                "Bearish on Bitcoin for now"
            ],
            'likes': [120, 45, 10, 30],
            'retweets': [50, 15, 2, 12],
            'comments': [25, 8, 3, 5],
            'user': ['user1', 'user2', 'user3', 'user4']
        })
    
    # Filter data for different assets
    # For this example, we'll use simple keyword filtering
    btc_data = x_data[x_data['text'].str.contains('BTC|Bitcoin|bitcoin', case=False, na=False)]
    eth_data = x_data[x_data['text'].str.contains('ETH|Ethereum|ethereum', case=False, na=False)]
    crypto_general = x_data[x_data['text'].str.contains('crypto|token|coin', case=False, na=False)]
    
    print(f"Found {len(btc_data)} BTC related tweets")
    print(f"Found {len(eth_data)} ETH related tweets")
    print(f"Found {len(crypto_general)} general crypto tweets")
    
    # Sample market metrics (in a real scenario, these would come from market data APIs)
    btc_metrics = {
        'liquidity': 850000,
        'volume': 25000000,
        'average_volume': 20000000,
        'price_change_pct': 2.5
    }
    
    eth_metrics = {
        'liquidity': 650000,
        'volume': 15000000,
        'average_volume': 18000000,
        'price_change_pct': -1.2
    }
    
    # General crypto market metrics
    market_metrics = {
        'liquidity': 750000,
        'volume': 20000000,
        'average_volume': 19000000,
        'price_change_pct': 0.8
    }
    
    # Generate signals
    data = {
        'BTC': {'sentiment': btc_data, 'metrics': btc_metrics},
        'ETH': {'sentiment': eth_data, 'metrics': eth_metrics},
        'CRYPTO_MARKET': {'sentiment': crypto_general, 'metrics': market_metrics}
    }
    
    signals = aggregator.generate_signals_batch(data)
    
    # Create output directory if it doesn't exist
    os.makedirs('output', exist_ok=True)
    
    # Save to JSON
    aggregator.save_signals_to_json(signals, 'output/x_scraper_signals.json')
    
    # Print the signals
    print("\nGenerated Signals:")
    print(json.dumps(signals, indent=2))
    
    return signals


if __name__ == "__main__":
    run_examples()

