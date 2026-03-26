from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import keras
import torch
import torch.nn as nn
import os

app = Flask(__name__)

# Configuración de CORS corregida para evitar bloqueos en el navegador
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Directorios de archivos (ajusta según tu estructura)
PICTOGRAMS_DIR = r"ProyectoFinal\public\pictograms"

# ---------------------------------------------------------
# 1. MODELO DE EMOCIONES (FER2013)
# ---------------------------------------------------------
prototxtPath = r"face_detector\deploy.prototxt"
weightsPath = r"face_detector\res10_300x300_ssd_iter_140000.caffemodel"
faceNet = cv2.dnn.readNet(prototxtPath, weightsPath)

MODEL_FER_PATH = r"model\modelFER77percent.keras"
try:
    model_emotion = keras.models.load_model(MODEL_FER_PATH)
    print("✅ Modelo de Emociones cargado")
except Exception as e:
    print(f"❌ Error cargando modelo de emociones: {e}")

emotions_labels = ['angry', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# ---------------------------------------------------------
# 2. MODELO LSA64 (Sign Language)
# ---------------------------------------------------------
class LSTMModel(nn.Module):
    def __init__(self, input_size=63, hidden_size=128, num_classes=15):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.fc(out)

modelLSA = LSTMModel()
LSA_MODEL_PATH = r"backend\model\lsa64_model.pth" # Asegúrate que esta ruta sea correcta

try:
    if os.path.exists(LSA_MODEL_PATH):
        modelLSA.load_state_dict(torch.load(LSA_MODEL_PATH, map_location=torch.device("cpu")))
        modelLSA.eval()
        print("✅ Modelo LSA64 cargado")
    else:
        print(f"⚠️ No se encontró el archivo del modelo en: {LSA_MODEL_PATH}")
except Exception as e:
    print(f"❌ Error cargando modelo LSA64: {e}")

sequence = [] # Buffer para acumular los 30 frames

# ---------------------------------------------------------
# RUTAS DE LA API
# ---------------------------------------------------------

@app.route('/predict-emotion', methods=['POST'])
def predict_emotion():
    # ... (Tu lógica existente para procesar la imagen de emociones)
    return jsonify({"status": "lógica de emociones ejecutada"})

@app.route('/predict-lsa', methods=['POST'])
def predict_lsa():
    global sequence
    try:
        data = request.json
        keypoints = data.get("keypoints")

        if not keypoints:
            return jsonify({"error": "No se recibieron keypoints"}), 400

        # Acumular frames
        sequence.append(keypoints)
        
        # Mantener solo los últimos 30 frames para la predicción
        if len(sequence) > 30:
            sequence = sequence[-30:]

        if len(sequence) == 30:
            input_data = np.array(sequence)
            # Convertir a tensor (Batch size=1, Time steps=30, Features=63)
            input_tensor = torch.tensor(input_data, dtype=torch.float32).unsqueeze(0)

            with torch.no_grad():
                output = modelLSA(input_tensor)
                pred = torch.argmax(output, dim=1).item()
            
            return jsonify({
                "prediction": int(pred), 
                "status": "done",
                "message": f"Seña detectada: {pred}"
            })

        return jsonify({
            "prediction": None, 
            "status": "accumulating", 
            "frames": len(sequence)
        })

    except Exception as e:
        print(f"Error en predict_lsa: {e}")
        return jsonify({"error": str(e)}), 500

# ÚNICA llamada a app.run al final del archivo
if __name__ == '__main__':
    print("🚀 Servidor Flask iniciado en http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)