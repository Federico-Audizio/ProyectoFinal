from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import keras
from keras.models import load_model
import os
from ultralytics import YOLO  # ✅ Importamos YOLO
import torch
import torch.nn.functional as F


#BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # /proyecto/backend
#PROJECT_DIR = os.path.dirname(BASE_DIR)                # /proyecto
#PUBLIC_DIR = os.path.join(PROJECT_DIR, "public")       # /proyecto/public
#PICTOGRAMS_DIR = os.path.join(PUBLIC_DIR, "pictograms")

app = Flask(__name__)
CORS(app)  # 🔥 Habilita CORS para todas las rutas
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
PICTOGRAMS_DIR = "ProyectoFinal/public/pictograms"
#PICTOGRAMS_DIR = os.path.join(os.getcwd(), "public", "pictograms")
# -----------------------------
# 🔹 MODELO 1 (Keras .keras)
# -----------------------------

# Cargamos el  modelo de detección de rostros
prototxtPath = "face_detector/deploy.prototxt"
weightsPath = "face_detector/res10_300x300_ssd_iter_140000.caffemodel"
faceNet = cv2.dnn.readNet(prototxtPath, weightsPath)

# Ruta al modelo
MODEL_PATH = "model/modelFER77percent.keras"
model = keras.models.load_model(MODEL_PATH)

emotions = ['angry', 'fear', 'happy', 'neutral', 'sad', 'surprise']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files.get('image')
        if file is None:
            return jsonify({"error": "No se recibió ninguna imagen"}), 400

        # Decodificar imagen
        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if image is None:
            return jsonify({"error": "No se pudo decodificar la imagen"}), 400

        (h, w) = image.shape[:2]

        # ✅ Usar 300x300 para el modelo res10 SSD
        blob = cv2.dnn.blobFromImage(image, 1.0, (300, 300), (104.0, 177.0, 123.0))
        faceNet.setInput(blob)
        detections = faceNet.forward()

        # Buscar la detección con mayor confianza
        best_conf = 0.0
        best_box = None
        if detections is None or detections.shape[2] == 0:
            return jsonify({'emotion': 'No se detectó rostro', 'confidence': 0.0})

        for i in range(0, detections.shape[2]):
            conf = float(detections[0, 0, i, 2])
            if conf > best_conf:
                best_conf = conf
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                best_box = box.astype("int")

        if best_box is None or best_conf < 0.5:
            return jsonify({'emotion': 'No se detectó rostro (confianza insuficiente)', 'confidence': float(best_conf * 100)})
        # 👉 Agregá este print para debug
        print("Confianza:", best_conf, "Caja:", best_box, "Tamaño img:", (w, h))
        # --- Ahora sí asignar y clampeare las coordenadas ---
        Xi, Yi, Xf, Yf = best_box

        # Clamp dentro de la imagen
        Xi = max(0, Xi)
        Yi = max(0, Yi)
        Xf = min(w - 1, Xf)
        Yf = min(h - 1, Yf)

        # 🔧 Ordenar coordenadas para evitar Xi > Xf o Yi > Yf
        Xi, Xf = sorted([Xi, Xf])
        Yi, Yf = sorted([Yi, Yf])

        # Asegurar que las coordenadas estén en el orden correcto
        if Xi >= Xf or Yi >= Yf:
            return jsonify({'emotion': 'Caja inválida', 'confidence': float(best_conf * 100)})

        # Recortar la cara y validar tamaño
        face = image[Yi:Yf, Xi:Xf]
        if face.size == 0 or face.shape[0] < 10 or face.shape[1] < 10:
            return jsonify({'emotion': 'Rostro demasiado pequeño', 'confidence': float(best_conf * 100)})

        # Preprocesamiento (como tenías antes)
        face_gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        face_resized = cv2.resize(face_gray, (48, 48))
        face_array = np.expand_dims(face_resized, axis=-1)  # (48,48,1)
        face_expanded = np.expand_dims(face_array, axis=0)  # (1,48,48,1)

        # Predicción
        prediction = model.predict(face_expanded)
        emotion_index = int(np.argmax(prediction))
        result = emotions[emotion_index]
        confidence_emotion = float(np.max(prediction) * 100)

        return jsonify({
            'emotion': result,
            'confidence': float(best_conf * 100),
            'raw_prediction': prediction.tolist(),
            'box': [int(Xi), int(Yi), int(Xf), int(Yf)],
            'image_size': [w, h]
        })

    except Exception as e:
        print("❌ Error procesando la imagen", e)
        return jsonify({'emotion': f"error: {str(e)}"}), 500

# -----------------------------
# 🔹 MODELO 2 (YOLO best.pt)
# -----------------------------
YOLO_PATH = "model/best.pt"
yolo_model = YOLO(YOLO_PATH)

@app.route('/predict-yolo', methods=['POST'])
def predict_yolo():
    try:
        file = request.files.get('image')
        if file is None:
            return jsonify({"error": "No se recibió ninguna imagen"}), 400

        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        results = yolo_model.predict(image, conf=0.5)

        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "class": yolo_model.names[int(box.cls)],
                    "confidence": float(box.conf),
                    "bbox": box.xyxy[0].tolist()
                })

        return jsonify({"detections": detections})

    except Exception as e:
        print("❌ Error YOLO", e)
        return jsonify({"error": str(e)}), 500


# -----------------------------
# 🔹 MODELO 3 (LSA64)
# -----------------------------

# cargar modelo
#modelLSA = LSTMModel()
#modelLSA.load_state_dict(torch.load("lsa64_model.pth", map_location=torch.device('cpu')))
#modelLSA.eval()
import torch.nn as nn

# --- MODELO LSA64 (LSTM) ---
class LSTMModel(nn.Module):
    def __init__(self, input_size=126, hidden_size=256, num_layers=3, num_classes=64): # Ajustá num_classes si es 20 o 64
        super().__init__()
        # Capa LSTM con 3 capas y dropout
        self.lstm = nn.LSTM(
            input_size=input_size, 
            hidden_size=hidden_size, 
            num_layers=num_layers, 
            batch_first=True,
            dropout=0.3
        )
        # Capas densas de salida
        self.fc1 = nn.Linear(hidden_size, 128)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.4)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)

        return out

# 2. Función de preprocesamiento dentro de predict_lsa
#def preprocess_sequence(seq):
 #   seq = np.array(seq) # (50, 126)
    
    # Calcular velocidad (diff) como en Colab
  #  velocity = np.diff(seq, axis=0)
   # velocity = np.vstack([np.zeros((1, 126)), velocity])
    
    # Concatenar posición + velocidad = 252
    #full_seq = np.concatenate([seq, velocity], axis=1)
    
    # Normalización estadística (Z-score)
    #full_seq = (full_seq - np.mean(full_seq)) / (np.std(full_seq) + 1e-8)
    
    #return torch.tensor(full_seq, dtype=torch.float32).unsqueeze(0)

modelLSA = LSTMModel()
try:
    modelLSA.load_state_dict(torch.load("model/lsa64_model.pth", map_location=torch.device("cpu")))
    modelLSA.eval()
    print("✅ Modelo LSA64 cargado")
except Exception as e:
    print(f"❌ Error cargando modelo LSA64: {e}")

sequence = []

@app.route('/predict-lsa', methods=['POST'])
def predict_lsa():
    try:
        data = request.json
        full_sequence = data.get("sequence", [])

        if not full_sequence or len(full_sequence) != 30:
            return jsonify({"error": "Secuencia incompleta o no recibida"}), 400

        # 1. Convertir a Array de NumPy (50, 126)
        sequence_np = np.array(full_sequence)

        if sequence_np.shape != (30, 126):
            return jsonify({"error": f"Formato incorrecto. Se esperaba (30,126) y llegó {sequence_np.shape}"}), 400
        
        if np.isnan(sequence_np).any():
            return jsonify({"error": "NaN en la secuencia"}), 400
        
        mean = sequence_np.mean(axis=1, keepdims=True)
        std = sequence_np.std(axis=1, keepdims=True)
        std[std == 0] = 1
        sequence_np = (sequence_np - mean) / std
        # 2. Calcular Velocidad (Igual que en Colab)
        # Calculamos la diferencia entre frames
        #velocity = np.diff(sequence_np, axis=0)
        # Agregamos un frame de ceros al inicio para mantener el tamaño 50
        #velocity = np.vstack([np.zeros((1, 126)), velocity])

        # 3. Concatenar Posición + Velocidad (126 + 126 = 252)
        #final_input = np.concatenate([sequence_np, velocity], axis=1)

        # 4. Normalización Estadística (Z-Score)
        # Esto es lo que evita que el modelo de siempre la misma probabilidad
        #final_input = (final_input - np.mean(final_input)) / (np.std(final_input) + 1e-8)

        # 5. Convertir a Tensor y Predecir
        input_tensor = torch.tensor(sequence_np, dtype=torch.float32).unsqueeze(0)
 
        with torch.no_grad():
            output = modelLSA(input_tensor)

            probs = F.softmax(output, dim=1).squeeze().numpy()  # convertir a probabilidades    

            # obtener top 5
            top5_idx = probs.argsort()[-5:][::-1]
            top5 = [
                {"class": int(i), "prob": float(probs[i])}
                for i in top5_idx
            ]

            predicted_class = int(top5[0]["class"])

        return jsonify({
            "prediction": predicted_class,
            "top5": top5
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)