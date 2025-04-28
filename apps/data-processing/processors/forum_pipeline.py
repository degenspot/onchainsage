import requests
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)

# 1. Parse the forum trading call
def parse_forum_call(call: str):
    """
    Parse a trading call string like 'Buy ETH at $3000' into action, asset, and price.
    """
    parts = call.split()
    action = parts[0]  # 'Buy' or 'Sell'
    asset = parts[1]   # 'ETH'
    price = float(parts[3].replace("$", ""))  # Remove $ sign and convert to float
    return {
        "action": action,
        "asset": asset,
        "price": price
    }


# 2. Get the current price (using dummy data for now)
def get_current_price(asset: str):
    """
    Fake current price for local testing instead of calling real API.
    """
    dummy_prices = {
        "ETH": 3200,
        "BTC": 60000,
        "SOL": 150
    }
    price = dummy_prices.get(asset.upper())
    if price:
        logging.info(f"Using dummy current price for {asset}: ${price}")
    else:
        logging.warning(f"No dummy price found for {asset}. Defaulting to $1000")
        price = 1000
    return price


# 3. Compute profitability
def compute_profitability(entry_price: float, current_price: float):
    """
    Calculate the percentage profit or loss.
    """
    profitability = ((current_price - entry_price) / entry_price) * 100
    return profitability


# 4. Get sentiment score (dummy for now)
def get_sentiment_score(asset: str):
    """
    Dummy sentiment score. In real case, you would call a social metrics API.
    """
    # Assume 0.8 (80% positive sentiment) for testing
    return 0.8


# 5. Send data to SignalSystem
def send_to_signal_system(signal_data: dict):
    """
    Simulate sending the processed signal data to the SignalSystem.
    """
    try:
        # For now, just log instead of actually sending
        logging.info(f"Pretending to send to SignalSystem: {signal_data}")
        # Uncomment below if real API is ready
        # url = "http://localhost:8000/api/signal"
        # response = requests.post(url, json=signal_data)
        # response.raise_for_status()
    except Exception as e:
        logging.error(f"Failed to send data to SignalSystem: {str(e)}")


# 6. Send data to PostSystem
def send_to_post_system(post_metadata: dict):
    """
    Simulate sending the post metadata to the PostSystem.
    """
    try:
        # For now, just log instead of actually sending
        logging.info(f"Pretending to send to PostSystem: {post_metadata}")
        # Uncomment below if real API is ready
        # url = "http://localhost:8001/api/post"
        # response = requests.post(url, json=post_metadata)
        # response.raise_for_status()
    except Exception as e:
        logging.error(f"Failed to send data to PostSystem: {str(e)}")


# 7. Main pipeline execution
def process_forum_call(call: str):
    """
    Main function to process a forum call.
    """
    logging.info(f"Processing call: {call}")

    # Step 1: Parse call
    parsed_call = parse_forum_call(call)
    asset = parsed_call['asset']
    entry_price = parsed_call['price']

    # Step 2: Get current asset price
    current_price = get_current_price(asset)
    if current_price is None:
        logging.error("Cannot compute profitability without current price.")
        return

    # Step 3: Compute profitability
    profitability = compute_profitability(entry_price, current_price)

    # Step 4: Get sentiment score
    sentiment_score = get_sentiment_score(asset)

    # Step 5: Prepare data
    signal_data = {
        "asset": asset,
        "action": parsed_call['action'],
        "entry_price": entry_price,
        "current_price": current_price,
        "profitability": profitability,
        "confidence": sentiment_score,
        "timestamp": datetime.utcnow().isoformat()
    }

    post_metadata = {
        "asset": asset,
        "entry_price": entry_price,
        "current_price": current_price,
        "profitability": profitability,
        "timestamp": datetime.utcnow().isoformat(),
        "sentiment_score": sentiment_score
    }

    # Step 6: Send to external systems
    send_to_signal_system(signal_data)
    send_to_post_system(post_metadata)

    logging.info(f"✅ Completed processing for {asset}.")


# 8. Entry point for testing
if __name__ == "__main__":
    # Example test call
    example_call = "Buy ETH at $3000"
    process_forum_call(example_call)
