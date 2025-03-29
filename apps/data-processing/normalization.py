import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

def min_max_normalize(connection, table, columns):
    """
    Apply min-max normalization to specified columns in a PostgreSQL table
    and return the normalized data.

    Parameters:
    connection (psycopg2.connection): PostgreSQL connection object.
    table (str): Name of the table containing the data to normalize.
    columns (list): List of column names to normalize.

    Returns:
    list of dict: Normalized data as a list of dictionaries.
    """
    normalized_data = []
    try:
        cursor = connection.cursor()
        for column in columns:
            logging.info(f"Normalizing column: {column}")
            
            # Fetch min and max values for the column
            cursor.execute(f"SELECT MIN({column}), MAX({column}) FROM {table}")
            min_val, max_val = cursor.fetchone()
            
            if min_val == max_val:
                logging.warning(f"Column {column} has constant values. Skipping normalization.")
                continue

            # Fetch all rows and normalize the column
            cursor.execute(f"SELECT id, {column} FROM {table}")
            rows = cursor.fetchall()
            for row in rows:
                record_id, value = row
                normalized_value = (value - min_val) / (max_val - min_val)
                normalized_data.append({
                    "id": record_id,
                    column: normalized_value
                })
        
        logging.info("Normalization completed successfully.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
    finally:
        cursor.close()
    
    return normalized_data

def store_normalized_data(connection, table, normalized_data):
    """
    Store normalized data into the specified table.

    Parameters:
    connection (psycopg2.connection): PostgreSQL connection object.
    table (str): Name of the table to store the normalized data.
    normalized_data (list of dict): Normalized data to insert.
    """
    try:
        cursor = connection.cursor()
        for record in normalized_data:
            columns = ', '.join(record.keys())
            values = ', '.join(['%s'] * len(record))
            query = f"INSERT INTO {table} ({columns}) VALUES ({values})"
            cursor.execute(query, tuple(record.values()))
        
        connection.commit()
        logging.info(f"Inserted {len(normalized_data)} records into {table}.")
    except Exception as e:
        logging.error(f"An error occurred while inserting data: {e}")
        connection.rollback()
    finally:
        cursor.close()

if __name__ == "__main__":
    # Database connection parameters
    conn_params = {
        'dbname': 'your_database',
        'user': 'your_username',
        'password': 'your_password',
        'host': 'your_host',
        'port': 'your_port'
    }

    try:
        # Establish connection to PostgreSQL
        conn = psycopg2.connect(**conn_params)

        # Normalize the data
        table_name = 'your_table'
        columns_to_normalize = ['liquidity', 'volume']
        normalized_data = min_max_normalize(conn, table_name, columns_to_normalize)

        # Store the normalized data
        store_table = 'onchain_metrics'
        store_normalized_data(conn, store_table, normalized_data)
    except Exception as e:
        logging.error(f"Failed to process the data: {e}")
    finally:
        # Close the connection
        if conn:
            conn.close()