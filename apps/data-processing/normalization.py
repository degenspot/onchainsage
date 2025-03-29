import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

def min_max_normalize(connection, table, columns):
    """
    Apply min-max normalization to specified columns in a PostgreSQL table.

    Parameters:
    connection (psycopg2.connection): PostgreSQL connection object.
    table (str): Name of the table containing the data to normalize.
    columns (list): List of column names to normalize.
    """
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

            # Update the column with normalized values
            cursor.execute(f"""
            UPDATE {table}
            SET {column} = ({column} - %s) / (%s - %s)
            """, (min_val, max_val, min_val))
        
        connection.commit()
        logging.info("Normalization completed successfully.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        connection.rollback()
    finally:
        cursor.close()

# Example usage:
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
        min_max_normalize(conn, table_name, columns_to_normalize)
    except Exception as e:
        logging.error(f"Failed to connect to the database: {e}")
    finally:
        # Close the connection
        if conn:
            conn.close()