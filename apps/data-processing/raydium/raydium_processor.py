''' Fetch and process liquidity data from Raydium API. '''

import requests
import json

API_URL = "https://api.raydium.io/v2/ammV3/ammPools"
OUTPUT_FILE = "liquidity_data.json"

def fetch_pools():
    """Fetch pool data from Raydium API."""
    response = requests.get(API_URL, timeout=10)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

def extract_liquidity(data, sample_size=10):
    """Extract liquidity (TVL in USD) from the pool data."""
    pools = data.get("data", [])[:sample_size]  # Limit to sample_size pools
    extracted = [
        {
            "id": pool.get("id"),
            "mintA": pool.get("mintA"),
            "mintB": pool.get("mintB"),
            "tvl": pool.get("tvl", 0),
            "price": pool.get("price", 0)
        }
        for pool in pools
    ]
    return extracted

def save_to_json(data, filename):
    """Save extracted data to a JSON file."""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    pool_data = fetch_pools()
    if pool_data:
        processed_data = extract_liquidity(pool_data)
        save_to_json(processed_data, OUTPUT_FILE)
