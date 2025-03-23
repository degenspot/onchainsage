"""TensorFlow Sentiment Analysis with LSTM"""

import re
from tqdm import tqdm
import pickle
import numpy as np
import pandas as pd
import emoji
from ntscraper import Nitter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import tensorflow as tf
from tensorflow.keras.layers import Embedding, LSTM, Dense, Input, Bidirectional
from tensorflow.keras.layers import TextVectorization
from tensorflow.keras.models import Model
from tensorflow.keras.initializers import Constant
from transformers import pipeline


# ============================
# 🔹 0. Scraping Tweet Data with Nitter
# ============================

# Initialize Nitter 
# The number of returned tweets varies according to recent availability
scraper = Nitter()
crypto_tweets = scraper.get_tweets("crypto", mode='hashtag', number =1200)

# Extract relevant tweet data
data = {
    'link': [],
    'text': [],
    'user': [],
    'likes': [],
    'retweets': [],
    'comments': []
}
for tweet in crypto_tweets['tweets']:
    data['link'].append(tweet['link'])
    data['text'].append(tweet['text'])
    data['user'].append(tweet['user']['name'])
    data['likes'].append(tweet['stats']['likes'])
    data['retweets'].append(tweet['stats']['retweets'])
    data['comments'].append(tweet['stats']['comments'])

# Save to dataframe
web3_df = pd.DataFrame(data)
web3_df.to_csv('web3_tweets_1210.csv', index=False)



# ============================
# 🔹 1. Load & Preprocess Data
# ============================

# Load data from directory
web3_df = pd.read_csv("web3_tweets_1210.csv")

# Assign only text column to new dataframe
web3_df = web3_df[['text']]

# Clean text column by removing URLs, mentions, hashtags, and emojis.
web3_df.loc[:, 'cleaned_text'] = web3_df['text'].apply(lambda x: re.sub(r'http\S+|www\S+|https\S+', '', x, flags=re.MULTILINE))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r'@\w+', '', x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r'#', '', x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].str.lower()
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: emoji.demojize(x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r':[a-z_]+:', '', x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: ' '.join(x.split()))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r'^RT\s+', '', x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r'(.)\1+', r'\1\1', x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r'\d+', '', x))
web3_df.loc[:, 'cleaned_text'] = web3_df['cleaned_text'].apply(lambda x: re.sub(r'[^\w\s]', '', x))

# Removing stop-words from corpus to reduce noise and tokenize the text, converting to lowercase.
stop_words = set(stopwords.words('english'))
corpus= []
for tweet in tqdm(web3_df['cleaned_text']):
    words = [word.lower() for word in word_tokenize(tweet) if ((word.isalpha() == 1) and word not in stop_words)]
    corpus.append(words)

# Convert list of lists into strings, and assign sentiment labels. Setting seq length to 512.
corpus_strings = [" ".join(tweet[:512]) for tweet in corpus]


"""Using DistilBert based on Stanford Sentiment Tree-bank from HF to assign sentiment labels
on the corpus strings. The labels are then converted to binary (1: Positive, 0: Negative)
"""
# Load model from Hugging Face
sentiment_pipeline = pipeline("sentiment-analysis", 
                              model="distilbert-base-uncased-finetuned-sst-2-english")    

#Get Sentiment Labels
sentiment_results = sentiment_pipeline(corpus_strings, truncation=True)

# Convert "POSITIVE" -> 1, "NEGATIVE" -> 0
sentiment_labels = np.array([1 if result["label"] == "POSITIVE" else 0 for result in sentiment_results])

# Create a dataframe with the text, sentiment label, sentiment score, and binary label and save.
sentiment_df = pd.DataFrame({
    "text": corpus_strings,
    "sentiment_label": [result["label"] for result in sentiment_results],  # "POSITIVE" or "NEGATIVE"
    "sentiment_score": [result["score"] for result in sentiment_results],  # Confidence score
    "binary_label": sentiment_labels  # 1 (POSITIVE) or 0 (NEGATIVE)
})
sentiment_df.to_csv("sentiment_dataset.csv", index=False)



# ============================
# 🔹 2. Text Vectorization
# ============================

# Define TextVectorization Layer
vocab_size = 10000
max_length = 50  

vectorizer = TextVectorization(max_tokens=vocab_size, 
                               output_mode=int, 
                               output_sequence_length=max_length)

# Fit vectorizer on training data
vectorizer.adapt(corpus_strings)  

# Convert corpus to numerical vectors
X = vectorizer(tf.constant(corpus_strings))
y = tf.constant(sentiment_labels, dtype=tf.int32)

# Split percentages for train, validation, and test sets -> 70% - 13% - 17%.
train_split = int(0.70 *  len(corpus_strings))
val_split = int(0.83 * len(corpus_strings)) 

# Split into train, validation, and test sets
X_train, X_val, X_test = X[:train_split], X[train_split:val_split], X[val_split:]
y_train, y_val, y_test = y[:train_split], y[train_split:val_split], y[val_split:]

# Conversion to TensorFlow dataset with batch size 16.
train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train)).batch(16).prefetch(tf.data.AUTOTUNE)
val_dataset = tf.data.Dataset.from_tensor_slices((X_val, y_val)).batch(16).prefetch(tf.data.AUTOTUNE)
test_dataset = tf.data.Dataset.from_tensor_slices((X_test, y_test)).batch(16).prefetch(tf.data.AUTOTUNE)



# ============================
# 🔹 3. Load Pretrained GloVe Embeddings
# ============================
EMBEDDING_DIM = 100
GLOVE_PATH = "glove.6B.100d.txt"  # Make sure you have this file

# Load GloVe embeddings
embeddings_index = {}
with open(GLOVE_PATH, encoding="utf-8") as f:
    for line in f:
        values = line.split()
        word = values[0]
        vectors = np.asarray(values[1:], dtype="float32")
        embeddings_index[word] = vectors

# Create embedding matrix / Map vectorized tokens to GloVe embeddings.
vocab = vectorizer.get_vocabulary() # Words in the vocabulary
embedding_matrix = np.zeros((vocab_size, EMBEDDING_DIM)) #Initialize embedding matrix.

for i, word in enumerate(vocab):
    if word in embeddings_index:
        embedding_matrix[i] = embeddings_index[word]

# print("Embedding matrix shape:", embedding_matrix.shape)
# Embedding matrix shape: (10000, 100)



# ============================
# 🔹 4. Initialize LSTM Model
# ============================

input_layer = Input(shape=(max_length,))

embedding_layer = Embedding(
    input_dim = vocab_size,
    output_dim = EMBEDDING_DIM,
    embeddings_initializer = tf.keras.initializers.Constant(embedding_matrix),
    trainable=False 
)(input_layer)

lstm_layer = Bidirectional(LSTM(64, return_sequences=False))(embedding_layer)
output_layer = Dense(1, activation="sigmoid")(lstm_layer) # Binary classification

model = Model(inputs=input_layer, outputs=output_layer)
model.compile(loss="binary_crossentropy", optimizer="adam", metrics=["accuracy"])

model.summary()

# ============================
# 🔹 5. Train Model
# ============================

# Training the Bi-directional LSTM model
model.fit(train_dataset, validation_data = val_dataset, epochs = 10)

# ============================
# 🔹 6. Evaluate Model
# ============================
# Model Evaluation on test dataset
test_loss, test_acc = model.evaluate(test_dataset)
print(f"Test Accuracy: {test_acc:.4f}")
print(f"Length of Test Dataset: {len(X_test)}")


# ============================
# 🔹 7. Save Model & Vectorizer
# ============================

# Save trained model
model.save("sentiment_lstm_model.h5")

# Save TextVectorization layer separately
with open("text_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("\n✅ Model and vectorizer saved successfully! 🎉")
