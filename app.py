import os
import io
import librosa
import torch
from flask import Flask, request, jsonify, send_from_directory
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2Processor
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
load_dotenv()  # Load environment variables from .env file
import gridfs
from bson import ObjectId
import fs
import base64
from gridfs import GridOut
from bson import ObjectId


app = Flask(__name__, static_folder='views')
CORS(app)  # Enable CORS
# Load the model and processor

model_name = "facebook/wav2vec2-large-960h"
model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
processor = Wav2Vec2Processor.from_pretrained(model_name)

db_url = os.getenv("DB_URL")
client = MongoClient(db_url)  # Make sure DB_URL is set in your .env file
db = client.get_database('test') 
fs = gridfs.GridFS(db) 
collections = db.list_collection_names() 
print("Collections:", collections)
@app.route('/')
def home():
    return "Flask API is up and running!"

def classify_audio_clip(clip):
    inputs = processor(clip, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
    probabilities = torch.nn.functional.softmax(logits, dim=-1)
    print("Probabilities:", probabilities)  # Debugging output
    probability = probabilities[0].max().item()  # Get max probability from the first instance
    print("Max Probability:", probability)  # Debugging output
    return probability
def load_audio(file_data):
    file_data.seek(0)  # Ensure the file pointer is at the start
    audio, sr = librosa.load(file_data, sr=16000)  # Load from binary data
    return audio


@app.route('/upload', methods=['POST'])
def process_audio_from_mongodb():
    """Process audio fetched from MongoDB using its `fileId`."""
    data = request.get_json()
    file_id = data.get("fileId")
    print("file recived to fkask", file_id)
    if not file_id:
        return jsonify({"error": "No fileId provided"}), 400

    try:
        # Fetch the file from MongoDB
        grid_out = fs.get(ObjectId(file_id))
        if not grid_out:
            print(f"No file found for ObjectId: {file_id}")
            return jsonify({"error": "File not found"}), 404
        file_data = grid_out.read()
        print("File data read successfully.")
        # Load the audio and classify it
        if isinstance(file_data, str):
            file_data = base64.b64decode(file_data)
        audio_clip = load_audio(file_data)
        print("Audio shape:", audio_clip.shape) 
        result = classify_audio_clip(audio_clip)
        print(f"Classification result: {result}") 
        # Return the classification result
        return jsonify({ "result": result})

    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({"error": "Error processing file"}), 500

@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    try:
        file = fs.find_one({"filename": filename})
        if not file:
            return jsonify({"error": "File not found"}), 404
        return app.response_class(
            file.read(),
            mimetype=file.content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Error serving file {filename}: {e}")
        return jsonify({"error": "Error serving file"}), 500

if __name__ == "__main__":
    app.run(port=5000)