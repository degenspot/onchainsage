"""Raydium Liquidity Pool Data Ingestion Script"""


import os
import json
import requests
import psycopg2

from dotenv import load_dotenv


load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_PASSWORD = os.getenv("DB_PASSWORD")    

# PostgreSQL Database Connection
DB_PARAMS = {
    "dbname": DB_NAME,
    "user": DB_USER,
    "password": DB_PASSWORD,
    "host": DB_HOST,
    "port": DB_PORT
}

# Raydium API Endpoint for Pools
RAYDIUM_POOLS_API = "https://api.raydium.io/v2/ammV3/ammPools"


session = requests.Session()
session.headers.update({"Connection": "close"})


def fetch_raydium_pools():
    '''Function to fetch liquidity pool data'''
    try:
        with session.get(RAYDIUM_POOLS_API, stream= True, timeout=30) as response:
            response.raise_for_status()
            data_chunks = []
            for chunk in response.iter_content(chunk_size=8192):
                data_chunks.append(chunk)
            full_data = b"".join(data_chunks)  # Get the main liquidity pools
            return json.loads(full_data).get("data", [])
    except requests.exceptions.RequestException as e:
        print("Error fetching Raydium data:", e)
        return []


def store_market_data(pool_data):
    '''# Function to store data in PostgreSQL'''
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()

        # Create Table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS raydium_liquidity (
                id SERIAL PRIMARY KEY,
                pool_id TEXT UNIQUE,
                mintA TEXT,
                mintB TEXT,
                liquidity FLOAT,
                price FLOAT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        for pool in pool_data:
            pool_id = pool["id"]
            mintA = pool["mintA"]
            mintB = pool["mintB"]
            liquidity = pool.get("tvl", 0)
            price = pool.get("price", 0)

            # Insert data, ignore if duplicate
            cur.execute("""
                INSERT INTO raydium_liquidity (pool_id, mintA, mintB, liquidity, price)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (pool_id) DO UPDATE
                SET liquidity = EXCLUDED.liquidity, price = EXCLUDED.price, timestamp = CURRENT_TIMESTAMP;
            """, (pool_id, mintA, mintB, liquidity, price))

        conn.commit()
        cur.close()
        conn.close()
        print("✅ Market data stored successfully.")

    except psycopg2.Error as e:
        print("❌ Database error:", e)

if __name__ == "__main__":
    pools = fetch_raydium_pools()
    if pools:
        store_market_data(pools)
 
