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
from google.cloud import vision
import io


#BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # /proyecto/backend
#PROJECT_DIR = os.path.dirname(BASE_DIR)                # /proyecto
#PUBLIC_DIR = os.path.join(PROJECT_DIR, "public")       # /proyecto/public
#PICTOGRAMS_DIR = os.path.join(PUBLIC_DIR, "pictograms")

# Configuración de Google Vision
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = \
    "../src/hooks/google-vision.json"


def check_image_safety(image_bytes):

    image = vision.Image(content=image_bytes)

    response = vision_client.safe_search_detection(
        image=image
    )

    safe = response.safe_search_annotation

    return {
        "adult": safe.adult.name,
        "violence": safe.violence.name,
        "medical": safe.medical.name,
        "racy": safe.racy.name,
        "spoof": safe.spoof.name
    }

app = Flask(__name__)
CORS(app)  # 🔥 Habilita CORS para todas las rutas
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
PICTOGRAMS_DIR = "ProyectoFinal/public/pictograms"

vision_client = vision.ImageAnnotatorClient()

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

# CLAHE creado una sola vez (mismo config que Roboflow: Adaptive Equalization)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

def expand_bbox(x1, y1, x2, y2, img_w, img_h, pad=0.20):
    """Expande el bbox un % hacia afuera para cubrir frente y mentón."""
    bw = x2 - x1
    bh = y2 - y1
    x1 = max(0,     x1 - bw * pad)
    y1 = max(0,     y1 - bh * pad * 1.5)  # más arriba (frente)
    x2 = min(img_w, x2 + bw * pad)
    y2 = min(img_h, y2 + bh * pad * 0.5)  # menos abajo (mentón ya entra)
    return x1, y1, x2, y2

def preprocess_for_yolo(image_bgr: np.ndarray) -> np.ndarray:
    """
    Replica el pipeline de Roboflow usado en entrenamiento:
      1. Escala de grises
      2. CLAHE (Auto-Adjust Contrast: Adaptive Equalization)
      3. Vuelve a 3 canales (YOLO internamente espera 3 canales)
    El resize a 320x320 lo hace YOLO con imgsz=320.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    equalized = clahe.apply(gray)
    return cv2.cvtColor(equalized, cv2.COLOR_GRAY2BGR)

CONF_THRESHOLD = 0.35  # umbral mínimo para reportar una emoción

@app.route('/predict-yolo', methods=['POST'])
def predict_yolo():
    try:
        file = request.files.get('image')
        if file is None:
            return jsonify({"error": "No se recibió ninguna imagen"}), 400

        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if image is None:
            return jsonify({"error": "No se pudo decodificar la imagen"}), 400

        h_img, w_img = image.shape[:2]
        image_processed = preprocess_for_yolo(image)

        # Una sola pasada con conf muy bajo y NMS por clase:
        # YOLO devuelve una caja por emoción para cada cara → usamos eso como distribución
        results = yolo_model.predict(
            image_processed,
            conf=0.001,          # casi sin filtro para capturar todos los scores
            iou=0.45,            # NMS por clase (agnostic_nms=False por defecto)
            imgsz=320,
            verbose=False,
        )

        all_boxes = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                all_boxes.append({
                    "class": yolo_model.names[int(box.cls)],
                    "raw_conf": float(box.conf),
                    "bbox_raw": [x1, y1, x2, y2],
                })

        if not all_boxes:
            return jsonify({"best": None, "emotion_distribution": {}, "threshold": CONF_THRESHOLD * 100})

        # La detección principal es la de mayor confianza
        main = max(all_boxes, key=lambda d: d["raw_conf"])
        mx1, my1, mx2, my2 = main["bbox_raw"]

        # Agrupar todas las cajas que se solapan con la cara principal (misma cara, distinta emoción)
        def iou(a, b):
            ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
            ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
            inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
            ua = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - inter
            return inter / ua if ua > 0 else 0

        face_scores = {}
        for d in all_boxes:
            if iou(main["bbox_raw"], d["bbox_raw"]) > 0.2:
                cls = d["class"]
                # Quedarse con el score más alto si la misma clase aparece varias veces
                if cls not in face_scores or d["raw_conf"] > face_scores[cls]:
                    face_scores[cls] = d["raw_conf"]

        # Normalizar como porcentaje relativo
        total = sum(face_scores.values())
        emotion_distribution = {
            k: round(v / total * 100, 1)
            for k, v in sorted(face_scores.items(), key=lambda x: -x[1])
        }

        # Aplicar padding y devolver resultado
        x1, y1, x2, y2 = expand_bbox(mx1, my1, mx2, my2, w_img, h_img, pad=0.20)
        main_conf_pct = round(main["raw_conf"] * 100, 1)

        return jsonify({
            "best": {
                "class": main["class"],
                "confidence": main_conf_pct,
                "bbox": [x1, y1, x2, y2],
                "above_threshold": main["raw_conf"] >= CONF_THRESHOLD,
            },
            "emotion_distribution": emotion_distribution,  # % relativo de cada emoción
            "threshold": round(CONF_THRESHOLD * 100, 0),   # umbral actual en %
        })

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
        # x shape: (batch, seq_len, input_size) -> (1, 30, 126)
        out, _ = self.lstm(x)
        
        # Tomamos solo la salida del último timestep
        out = out[:, -1, :]
        
        # Pasamos por las capas densas
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

# Google Vision API para seguridad de imágenes
def check_image_safety(image_bytes):

    image = vision.Image(content=image_bytes)

    response = vision_client.safe_search_detection(
        image=image
    )

    safe = response.safe_search_annotation

    return {
        "adult": safe.adult.name,
        "violence": safe.violence.name,
        "medical": safe.medical.name,
        "racy": safe.racy.name,
        "spoof": safe.spoof.name
    }

@app.route('/validate-image', methods=['POST'])
def validate_image():

    try:

        file = request.files.get('image')

        if file is None:
            return jsonify({
                "error": "No se recibió imagen"
            }), 400

        image_bytes = file.read()

        result = check_image_safety(image_bytes)

        print("===== SAFE SEARCH =====")
        print(result)
        print("=======================")

        blocked_levels = [
            "LIKELY",
            "VERY_LIKELY"
        ]

        is_safe = (
            result["adult"] not in blocked_levels and
            result["violence"] not in blocked_levels and
            result["racy"] not in blocked_levels
        )

        return jsonify({
            "safe": is_safe,
            "details": result
        })

    except Exception as e:
        print("ERROR SAFESEARCH:", e)

        return jsonify({
            "error": str(e)
        }), 500



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