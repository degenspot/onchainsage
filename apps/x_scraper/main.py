from ntscraper import Nitter
import pandas as pd

def scrape_tweets(terms, num_tweets=10):
    '''func to scrape tweets'''
    scraper = Nitter()
    crypto_tweets = scraper.get_tweets(terms, mode='term', number=num_tweets)

    data = {
        'link': [tweet['link'] for tweet in crypto_tweets['tweets']],
        'text': [tweet['text'] for tweet in crypto_tweets['tweets']],
        'user': [tweet['user']['name'] for tweet in crypto_tweets['tweets']],
        'likes': [tweet['stats']['likes'] for tweet in crypto_tweets['tweets']],
        'retweets': [tweet['stats']['retweets'] for tweet in crypto_tweets['tweets']],
        'comments': [tweet['stats']['comments'] for tweet in crypto_tweets['tweets']]
    }

    return pd.DataFrame(data)


def save_to_csv(df, filename="x_scraper.csv"):
    '''save file in csv'''
    df.to_csv(filename, index=False)


if __name__ == "__main__":
    terms = ["crypto"]
    df = scrape_tweets(terms)
    save_to_csv(df)