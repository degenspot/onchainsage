''' 
Script for ingesting crypto tweets from X API.
'''

import json
import time
import random 
import os
from typing import Tuple
import requests
import pandas as pd


BEARER_TOKEN = os.environ.get("BEARER_TOKEN")

ENDPOINT_URL = "https://api.x.com/2/tweets/search/recent"

query_parameters = {"query": '("crypto news" OR "crypto" OR tokens) lang:en -is:retweet',
    "tweet.fields": "id,text,author_id,created_at",
    "user.fields": "id,name,username,created_at,description,location,verified",
    "expansions": "author_id",
    "max_results": 10,
}

def request_headers(token: str) -> dict:
    '''   Returns a dictionary summarizing the bearer token authentication details.'''

    return {"Authorization": f"Bearer {token}"}

headers = request_headers(BEARER_TOKEN)


def connect_to_endpoint(header: dict, parameters: dict, max_retries: int = 5) -> json:
    """
    Connects to the endpoint and requests data.
    Returns a json with Twitter data if a 200 status code is yielded.
    Programme stops if there is a problem with the request and sleeps
    if there is a temporary problem accessing the endpoint.
    """
    attempt = 0
    while attempt < max_retries:
        response = requests.get(url=ENDPOINT_URL, headers=header, params=parameters, timeout=10)
        response_status_code = response.status_code
        
        if response_status_code == 200:
            return response.json()
        
        elif response_status_code == 429:
            retry_after = int(response.headers.get("Retry-After", random.randint(5,60)))
            print(f"Rate limited. Retrying in {retry_after} seconds...")
            time.sleep(retry_after)

        elif 400 <= response_status_code < 500:
            raise requests.exceptions.HTTPError(
                f"Cannot get data, the program will stop!\nHTTP {response_status_code}: {response.text}"
                )
        else:
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            print(f"Temporary issue, retrying in {wait_time:.2f} seconds...\nHTTP {response_status_code}: {response.text}")
            time.sleep(wait_time)
        attempt += 1

    raise requests.exceptions.RetryError("Max retries exceeded. Unable to get data. ")


def process_x_data(json_response: json,
                   query_tag: str,
                   tweets_df: pd.DataFrame,
                   users_df: pd.DataFrame
                   ) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Adds new tweet/user information to the table of 
    tweets/users and saves dataframes as pickle files,
    if data is available.
    """

    if "data" in json_response.keys():
        new = pd.DataFrame(json_response["data"])
        tweets_df = pd.concat([tweets_df, new])
        tweets_df.to_pickle("tweets_" + query_tag + ".pkl")

        if "users" in json_response["includes"].keys():
            new = pd.DataFrame(json_response["includes"]["users"])
            users_df = pd.concat([users_df, new])
            users_df.drop_duplicates("id", inplace=True)
            users_df.to_pickle("users_" + query_tag + ".pkl")
    return tweets_df, users_df 


j_response = connect_to_endpoint(header=headers, parameters=query_parameters)
tweets_data = pd.DataFrame()
users_data = pd.DataFrame()

tag = "crypto"

tweets_data, users_data = process_x_data(
        j_response, tag, tweets_data, users_data
    )
