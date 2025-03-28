import unittest
import pandas as pd
import json
import os
from signal_aggregator import SignalAggregator

class TestSignalAggregator(unittest.TestCase):
    """Test cases for the SignalAggregator class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.aggregator = SignalAggregator()
        
        # Create test output directory
        os.makedirs('test_output', exist_ok=True)
        
    def tearDown(self):
        """Clean up after tests."""
        # Remove test output files
        if os.path.exists('test_output/test_signals.json'):
            os.remove('test_output/test_signals.json')
            
    def test_normalize_sentiment_data(self):
        """Test sentiment data normalization."""
        # Test with empty DataFrame
        empty_df = pd.DataFrame()
        result = self.aggregator.normalize_sentiment_data(empty_df)
        self.assertTrue(result.empty)
        
        # Test with sentiment_score already present
        df_with_score = pd.DataFrame({
            'sentiment_score': [0.2, 0.8, 1.5, -0.3]  # Some out of range
        })
        result = self.aggregator.normalize_sentiment_data(df_with_score)
        self.assertEqual(result['sentiment_score'].min(), 0.0)
        self.assertEqual(result['sentiment_score'].max(), 1.0)
        
        # Test with text data
        df_with_text = pd.DataFrame({
            'text': [
                "Very bullish on this!",
                "Bearish outlook, expecting a crash",
                "Neutral sentiment here",
                None  # Test with None
            ],
            'likes': [100, 50, 10, 0],
            'retweets': [40, 20, 5, 0],
            'comments': [20, 10, 2, 0]
        })
        result = self.aggregator.normalize_sentiment_data(df_with_text)
        self.assertIn('sentiment_score', result.columns)
        self.assertTrue(all(0 <= score <= 1 for score in result['sentiment_score']))
        
    def test_normalize_market_metrics(self):
        """Test market metrics normalization."""
        # Test with empty metrics
        empty_metrics = {}
        result = self.aggregator.normalize_market_metrics(empty_metrics)
        self.assertEqual(result['liquidity'], 0.5)
        self.assertEqual(result['volume'], 0.5)
        self.assertEqual(result['price_action'], 0.5)
        
        # Test with complete metrics
        full_metrics = {
            'liquidity': 500000,
            'volume': 30000000,
            'average_volume': 20000000,
            'price_change_pct': 5.0
        }
        result = self.aggregator.normalize_market_metrics(full_metrics)
        self.assertTrue(0 <= result['liquidity'] <= 1)
        self.assertTrue(0 <= result['volume'] <= 1)
        self.assertTrue(0 <= result['price_action'] <= 1)
        
        # Test with negative price change
        bearish_metrics = {
            'liquidity': 500000,
            'volume': 30000000,
            'average_volume': 20000000,
            'price_change_pct': -5.0
        }
        result = self.aggregator.normalize_market_metrics(bearish_metrics)
        self.assertTrue(result['price_action'] < 0.5)
        
    def test_calculate_aggregate_score(self):
        """Test aggregate score calculation."""
        sentiment = 0.8
        metrics = {
            'liquidity': 0.7,
            'volume': 0.6,
            'price_action': 0.9
        }
        
        # Test with default weights
        score = self.aggregator.calculate_aggregate_score(sentiment, metrics)
        self.assertTrue(0 <= score <= 1)
        
        # Test with custom weights
        self.aggregator.config['sentiment_weight'] = 0.6
        self.aggregator.config['liquidity_weight'] = 0.1
        self.aggregator.config['volume_weight'] = 0.1
        self.aggregator.config['price_action_weight'] = 0.2
        
        custom_score = self.aggregator.calculate_aggregate_score(sentiment, metrics)
        self.assertTrue(0 <= custom_score <= 1)
        
        # Reset weights
        self.aggregator = SignalAggregator()
        
    def test_determine_confidence(self):
        """Test confidence determination."""
        # Test high confidence
        high_score = 0.85
        aligned_sentiment = 0.8
        aligned_metrics = {'price_action': 0.7}
        confidence = self.aggregator.determine_confidence(high_score, aligned_sentiment, aligned_metrics)
        self.assertEqual(confidence, "high")
        
        # Test low confidence (contradictory signals)
        contradictory_sentiment = 0.8
        contradictory_metrics = {'price_action': 0.1}
        confidence = self.aggregator.determine_confidence(high_score, contradictory_sentiment, contradictory_metrics)
        self.assertEqual(confidence, "low")
        
        # Test medium confidence
        medium_score = 0.55
        medium_sentiment = 0.6
        medium_metrics = {'price_action': 0.5}
        confidence = self.aggregator.determine_confidence(medium_score, medium_sentiment, medium_metrics)
        self.assertEqual(confidence, "medium")
        
    def test_categorize_signal(self):
        """Test signal categorization."""
        # Test strong buy
        strong_buy_score = 0.85
        strong_buy_sentiment = 0.9
        strong_buy_metrics = {'price_action': 0.8}
        category = self.aggregator.categorize_signal(strong_buy_score, strong_buy_sentiment, strong_buy_metrics)
        self.assertEqual(category, "strong_buy")
        
        # Test buy
        buy_score = 0.7
        buy_sentiment = 0.6
        buy_metrics = {'price_action': 0.6}
        category = self.aggregator.categorize_signal(buy_score, buy_sentiment, buy_metrics)
        self.assertEqual(category, "buy")
        
        # Test strong sell
        strong_sell_score = 0.15
        strong_sell_sentiment = 0.2
        strong_sell_metrics = {'price_action': 0.2}
        category = self.aggregator.categorize_signal(strong_sell_score, strong_sell_sentiment, strong_sell_metrics)
        self.assertEqual(category, "strong_sell")
        
        # Test neutral
        neutral_score = 0.5
        neutral_sentiment = 0.5
        neutral_metrics = {'price_action': 0.5}
        category = self.aggregator.categorize_signal(neutral_score, neutral_sentiment, neutral_metrics)
        self.assertEqual(category, "neutral")
        
    def test_generate_signal(self):
        """Test signal generation for a single asset."""
        asset_id = "BTC"
        sentiment_data = pd.DataFrame({
            'text': ["Bullish on BTC", "Bitcoin to the moon!"],
            'likes': [100, 200],
            'retweets': [50, 100],
            'comments': [20, 40]
        })
        metrics_data = {
            'liquidity': 800000,
            'volume': 25000000,
            'average_volume': 20000000,
            'price_change_pct': 3.5
        }
        
        signal = self.aggregator.generate_signal(asset_id, sentiment_data, metrics_data)
        
        # Check signal structure
        self.assertEqual(signal['asset_id'], asset_id)
        self.assertIn('timestamp', signal)
        self.assertIn('category', signal['signal'])
        self.assertIn('confidence', signal['signal'])
        self.assertIn('score', signal['signal'])
        self.assertIn('sentiment', signal['components'])
        self.assertIn('metrics', signal['components'])
        
    def test_generate_signals_batch(self):
        """Test batch signal generation."""
        data = {
            'BTC': {
                'sentiment': pd.DataFrame({
                    'text': ["Bullish on BTC", "Bitcoin to the moon!"],
                    'likes': [100, 200],
                    'retweets': [50, 100],
                    'comments': [20, 40]
                }),
                'metrics': {
                    'liquidity': 800000,
                    'volume': 25000000,
                    'average_volume': 20000000,
                    'price_change_pct': 3.5
                }
            },
            'ETH': {
                'sentiment': pd.DataFrame({
                    'text': ["Bearish on ETH", "Ethereum might drop"],
                    'likes': [80, 120],
                    'retweets': [30, 60],
                    'comments': [15, 25]
                }),
                'metrics': {
                    'liquidity': 600000,
                    'volume': 15000000,
                    'average_volume': 18000000,
                    'price_change_pct': -2.0
                }
            }
        }
        
        signals = self.aggregator.generate_signals_batch(data)
        
        # Check we have signals for both assets
        self.assertEqual(len(signals), 2)
        asset_ids = [signal['asset_id'] for signal in signals]
        self.assertIn('BTC', asset_ids)
        self.assertIn('ETH', asset_ids)
        
    def test_save_signals_to_json(self):
        """Test saving signals to JSON."""
        signals = [
            {
                'asset_id': 'BTC',
                'timestamp': '2025-03-28T14:30:00',
                'signal': {
                    'category': 'buy',
                    'confidence': 'high',
                    'score': 0.75
                }
            },
            {
                'asset_id': 'ETH',
                'timestamp': '2025-03-28T14:30:00',
                'signal': {
                    'category': 'sell',
                    'confidence': 'medium',
                    'score': 0.35
                }
            }
        ]
        
        output_path = 'test_output/test_signals.json'
        self.aggregator.save_signals_to_json(signals, output_path)
        
        # Check file exists
        self.assertTrue(os.path.exists(output_path))
        
        # Check content
        with open(output_path, 'r') as f:
            loaded_signals = json.load(f)
            
        self.assertEqual(len(loaded_signals), 2)
        self.assertEqual(loaded_signals[0]['asset_id'], 'BTC')
        self.assertEqual(loaded_signals[1]['asset_id'], 'ETH')
        
    def test_sample_inputs(self):
        """Test with 10 sample inputs as required by acceptance criteria."""
        # Create 10 sample inputs with varying characteristics
        samples = []
        
        # 1. Strong bullish signal
        samples.append({
            'asset_id': 'BTC_1',
            'sentiment': pd.DataFrame({
                'text': ["Extremely bullish!", "To the moon!", "Best investment ever"],
                'likes': [500, 300, 200],
                'retweets': [200, 150, 100],
                'comments': [100, 80, 50]
            }),
            'metrics': {
                'liquidity': 900000,
                'volume': 30000000,
                'average_volume': 20000000,
                'price_change_pct': 8.5
            }
        })
        
        # 2. Moderate bullish signal
        samples.append({
            'asset_id': 'ETH_1',
            'sentiment': pd.DataFrame({
                'text': ["Looking good", "Positive outlook", "Might go up"],
                'likes': [150, 120, 100],
                'retweets': [70, 60, 50],
                'comments': [40, 30, 25]
            }),
            'metrics': {
                'liquidity': 700000,
                'volume': 22000000,
                'average_volume': 20000000,
                'price_change_pct': 3.2
            }
        })
        
        # 3. Neutral signal
        samples.append({
            'asset_id': 'SOL_1',
            'sentiment': pd.DataFrame({
                'text': ["Not sure", "Could go either way", "Waiting for more data"],
                'likes': [80, 70, 60],
                'retweets': [40, 35, 30],
                'comments': [20, 18, 15]
            }),
            'metrics': {
                'liquidity': 500000,
                'volume': 18000000,
                'average_volume': 18000000,
                'price_change_pct': 0.5
            }
        })
        
        # 4. Moderate bearish signal
        samples.append({
            'asset_id': 'ADA_1',
            'sentiment': pd.DataFrame({
                'text': ["Not looking good", "Might drop soon", "Bearish for now"],
                'likes': [120, 100, 90],
                'retweets': [60, 50, 45],
                'comments': [30, 25, 22]
            }),
            'metrics': {
                'liquidity  [60, 50, 45],
                'comments': [30, 25, 22]
            }),
            'metrics': {
                'liquidity': 400000,
                'volume': 15000000,
                'average_volume': 18000000,
                'price_change_pct': -2.8
            }
        })
        
        # 5. Strong bearish signal
        samples.append({
            'asset_id': 'DOT_1',
            'sentiment': pd.DataFrame({
                'text': ["Terrible outlook", "Selling everything", "Crash incoming"],
                'likes': [200, 180, 160],
                'retweets': [100, 90, 80],
                'comments': [50, 45, 40]
            }),
            'metrics': {
                'liquidity': 300000,
                'volume': 25000000,
                'average_volume': 15000000,
                'price_change_pct': -7.5
            }
        })
        
        # 6. Mixed signals (positive sentiment, negative price)
        samples.append({
            'asset_id': 'LINK_1',
            'sentiment': pd.DataFrame({
                'text': ["Very bullish long term", "Great fundamentals", "Buy the dip"],
                'likes': [250, 220, 200],
                'retweets': [120, 110, 100],
                'comments': [60, 55, 50]
            }),
            'metrics': {
                'liquidity': 600000,
                'volume': 20000000,
                'average_volume': 18000000,
                'price_change_pct': -4.2
            }
        })
        
        # 7. Mixed signals (negative sentiment, positive price)
        samples.append({
            'asset_id': 'XRP_1',
            'sentiment': pd.DataFrame({
                'text': ["Bearish outlook", "Not convinced", "Might dump soon"],
                'likes': [150, 130, 120],
                'retweets': [75, 65, 60],
                'comments': [40, 35, 30]
            }),
            'metrics': {
                'liquidity': 550000,
                'volume': 19000000,
                'average_volume': 17000000,
                'price_change_pct': 5.8
            }
        })
        
        # 8. High liquidity, low sentiment
        samples.append({
            'asset_id': 'AVAX_1',
            'sentiment': pd.DataFrame({
                'text': ["Not impressed", "Overvalued", "Better alternatives"],
                'likes': [100, 90, 80],
                'retweets': [50, 45, 40],
                'comments': [25, 22, 20]
            }),
            'metrics': {
                'liquidity': 850000,
                'volume': 16000000,
                'average_volume': 15000000,
                'price_change_pct': -1.5
            }
        })
        
        # 9. Low liquidity, high sentiment
        samples.append({
            'asset_id': 'MATIC_1',
            'sentiment': pd.DataFrame({
                'text': ["Hidden gem", "Massive potential", "Going to explode"],
                'likes': [180, 160, 140],
                'retweets': [90, 80, 70],
                'comments': [45, 40, 35]
            }),
            'metrics': {
                'liquidity': 250000,
                'volume': 12000000,
                'average_volume': 10000000,
                'price_change_pct': 2.3
            }
        })
        
        # 10. Extreme volatility
        samples.append({
            'asset_id': 'DOGE_1',
            'sentiment': pd.DataFrame({
                'text': ["To the moon!", "Crash and burn", "Wild ride"],
                'likes': [300, 280, 260],
                'retweets': [150, 140, 130],
                'comments': [75, 70, 65]
            }),
            'metrics': {
                'liquidity': 700000,
                'volume': 35000000,
                'average_volume': 15000000,
                'price_change_pct': 15.0
            }
        })
        
        # Process all samples
        results = []
        for sample in samples:
            asset_id = sample['asset_id']
            sentiment = sample['sentiment']
            metrics = sample['metrics']
            
            signal = self.aggregator.generate_signal(asset_id, sentiment, metrics)
            results.append(signal)
            
        # Verify all samples produced valid signals
        self.assertEqual(len(results), 10)
        
        # Check that each signal has the required fields
        for signal in results:
            self.assertIn('asset_id', signal)
            self.assertIn('timestamp', signal)
            self.assertIn('signal', signal)
            self.assertIn('category', signal['signal'])
            self.assertIn('confidence', signal['signal'])
            self.assertIn('score', signal['signal'])
            
        # Save the results for inspection
        self.aggregator.save_signals_to_json(results, 'test_output/sample_signals.json')
        

if __name__ == '__main__':
    unittest.main()

