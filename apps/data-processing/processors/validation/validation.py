"""Validation functions for tweet data."""

import re
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

CRYPTO_KEYWORDS = ["bitcoin", "ethereum", "solana", "nft", "crypto", "blockchain", "web3", "btc", "eth"]


def validate_tweets(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate tweets by:
      - Ensuring the 'text' column exists and is not empty.
      - Checking that the text contains at least one crypto keyword.
    
    Logs any invalid records.
    
    Parameters:
        df (pd.DataFrame): DataFrame containing tweet data.
    
    Returns:
        pd.DataFrame: DataFrame of valid tweets.
    """
    # Check that the 'text' column exists.
    if "text" not in df.columns:
        logger.error("DataFrame missing the 'text' column.")
        return pd.DataFrame()
    
    # Filter out tweets with missing or empty 'text' field.
    valid_text_mask = df['text'].notnull() & (df['text'].str.strip() != "")
    df_valid = df[valid_text_mask].copy()
    invalid_text = df[~valid_text_mask]
    if not invalid_text.empty:
        for idx, row in invalid_text.iterrows():
            logger.warning("Tweet at index %s has missing or empty text: %s", idx, row.to_dict())
    
    # Build a regex pattern to search for any of the crypto keywords (case-insensitive).
    pattern = re.compile("|".join(CRYPTO_KEYWORDS), re.IGNORECASE)
    keyword_mask = df_valid['text'].apply(lambda text: bool(pattern.search(text)))
    
    valid_crypto_tweets = df_valid[keyword_mask].copy()
    invalid_crypto = df_valid[~keyword_mask]
    if not invalid_crypto.empty:
        for idx, row in invalid_crypto.iterrows():
            logger.warning("Tweet at index %s does not contain any crypto keywords: %s", idx, row['text'])
    
    return valid_crypto_tweets
