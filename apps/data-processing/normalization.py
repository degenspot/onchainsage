import pandas as pd
from typing import List

def min_max_normalize(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
    """
    Apply min-max normalization to specified columns of a DataFrame.
    
    Parameters:
    df (pd.DataFrame): DataFrame containing the data to normalize.
    columns (list): List of column names to normalize.
    
    Returns:
    pd.DataFrame: DataFrame with normalized columns.
    """
    df_normalized = df.copy()
    for column in columns:
        min_val = df[column].min()
        max_val = df[column].max()
        df_normalized[column] = (df[column] - min_val) / (max_val - min_val)
    return df_normalized

# Example usage:
if __name__ == "__main__":
    # Sample data
    data = {
        'liquidity': [100, 200, 300, 400, 500],
        'volume': [10, 20, 30, 40, 50]
    }
    df = pd.DataFrame(data)
    
    # Normalize the data
    columns_to_normalize = ['liquidity', 'volume']
    normalized_df = min_max_normalize(df, columns_to_normalize)
    
    print(normalized_df)