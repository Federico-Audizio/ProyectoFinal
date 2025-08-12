from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from keras.models import load_model
import os

app = Flask(__name__)
CORS(app)  # 🔥 Habilita CORS para todas las rutas

# Ruta al modelo
MODEL_PATH = os.path.join("model", "modelFEC50epocas.h5")
model = load_model(MODEL_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files['image']
        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Preprocesamiento: escala de grises, resize y normalización
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (48, 48))
        normalized = resized / 255.0
        reshaped = normalized.reshape(1, 48, 48, 1)

        # Predicción
        prediction = model.predict(reshaped)
        emotion_index = np.argmax(prediction)
        emotions = ['Enojo', 'Disgusto', 'Miedo', 'Feliz', 'Triste', 'Sorpresa', 'Neutral']
        result = emotions[emotion_index]

        return jsonify({'emotion': result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
