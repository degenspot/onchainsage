import unittest
from storage import store_normalized_data
import sys 

# Determine if verbosity is enabled (i.e. if "-v" or "--verbose" is passed).
VERBOSE = any(arg in sys.argv for arg in ['-v', '--verbose'])

# Dummy cursor that does nothing.
class DummyCursor:
    def execute(self, query, values):
        pass
    def close(self):
        pass

# Dummy connection that returns our DummyCursor.
class DummyConnection:
    def cursor(self):
        return DummyCursor()
    def commit(self):
        pass
    def rollback(self):
        pass

class TestStoreNormalizedDataNoSQL(unittest.TestCase):
    def test_sentiment_added_to_tweet_record(self):
        # Sample tweets and expected sentiment scores.
        tweets = [
            "Bitcoin is great",
            "I love programming",
            "This is terrible",
            "I am not happy with this",
            "What a wonderful day",
            "I hate it when this happens",
            "This is the best thing ever",
            "I am so sad",
            "Could be better",
            "Absolutely fantastic!"
        ]
        # Expected sentiment scores from your provided test.
        expected_scores = {
            "Bitcoin is great": 0.6249,
            "I love programming": 0.6369,
            "This is terrible": -0.4767,
            "I am not happy with this": -0.4585,
            "What a wonderful day": 0.5719,
            "I hate it when this happens": -0.5719,
            "This is the best thing ever": 0.6369,
            "I am so sad": -0.6113,
            "Could be better": 0.4404,
            "Absolutely fantastic!": 0.6352
        }
        
        # Simulate tweet records as a list of dictionaries.
        normalized_data = [{"id": i, "text": tweet} for i, tweet in enumerate(tweets, start=1)]
        
        # Use our dummy connection (no real SQL calls are made).
        dummy_conn = DummyConnection()
        
        # Call the storage function for the "tweets" table.
        # It will compute the sentiment score and update each record.
        store_normalized_data(dummy_conn, "tweets", normalized_data)
        
        # Verify that each record now contains the correct sentiment_score.
        for record in normalized_data:
            self.assertIn("sentiment_score", record, f"Record {record['id']} is missing sentiment_score.")
            tweet_text = record["text"]
            computed_score = record["sentiment_score"]
            
            # Check that the computed score is as expected (using 2 decimal places).
            expected_score = expected_scores[tweet_text]
            self.assertAlmostEqual(
                computed_score,
                expected_score,
                places=2,
                msg=f"For tweet '{tweet_text}', expected sentiment score {expected_score} but got {computed_score}."
            )
            # Print message only if the test passes.
            if VERBOSE:
                print(f"Tweet: {tweet_text}\n  Expected Sentiment: {expected_score}\n  Computed Sentiment: {computed_score}\n")


if __name__ == "__main__":
    unittest.main()
