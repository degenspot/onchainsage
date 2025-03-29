import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

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