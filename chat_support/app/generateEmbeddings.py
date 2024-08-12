from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/generate_embeddings": {"origins": "http://localhost:3000"}})
model = SentenceTransformer('sentence-transformers/LaBSE')

@app.route('/generate_embeddings', methods=['POST'])
def generate_embeddings():
    data = request.json
    texts = data['texts']
    embeddings = model.encode(texts)
    return jsonify({'embeddings': embeddings.tolist()})

if __name__ == '__main__':
    app.run(port=5000)