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