import unittest
from sentiment import analyze_sentiments

class TestSentimentAnalysis(unittest.TestCase):
    def test_analyze_sentiments(self):
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
        scores = analyze_sentiments(tweets)
        for tweet, expected_score in expected_scores.items():
            self.assertAlmostEqual(scores[tweet], expected_score, places=4)

if __name__ == "__main__":
    unittest.main()
