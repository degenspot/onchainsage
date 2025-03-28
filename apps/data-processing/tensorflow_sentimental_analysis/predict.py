import pickle
from tensorflow.keras.models import load_model


# Load Model
model = load_model("sentiment_lstm_model.h5")

# Load Vectorizer
with open("text_vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

# Function to predict sentiment on new text
def predict_sentiment(text):
    '''func to predict sentiment on new text'''
    text_seq = vectorizer([text]).numpy()  # Convert text to sequence
    prediction = model.predict(text_seq)[0][0]  # Get probability score
    label = "POSITIVE" if prediction > 0.5 else "NEGATIVE"
    return label, prediction

# Example
NEW_TEXT = "Markets are highly volatile and uncertain today."
sentiment, score = predict_sentiment(NEW_TEXT)

print(f"Text: {NEW_TEXT}")
print(f"Predicted Sentiment: {sentiment} (Score: {score:.4f})")