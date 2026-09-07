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
try:
    from google.cloud import vision
    import io
    _vision_ok = True
except ImportError:
    _vision_ok = False
    print("⚠️  google-cloud-vision no instalado — /validate-image deshabilitado")
    print("     Solución: pip install google-cloud-vision")

import threading
import urllib.request

#BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # /proyecto/backend
#PROJECT_DIR = os.path.dirname(BASE_DIR)                # /proyecto
#PUBLIC_DIR = os.path.join(PROJECT_DIR, "public")       # /proyecto/public
#PICTOGRAMS_DIR = os.path.join(PUBLIC_DIR, "pictograms")

# Configuración de Google Vision
if _vision_ok:
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

vision_client = vision.ImageAnnotatorClient() if _vision_ok else None

#PICTOGRAMS_DIR = os.path.join(os.getcwd(), "public", "pictograms")
# -----------------------------
# 🔹 MODELO 1 (Keras .keras)
# -----------------------------

# Cargamos el  modelo de detección de rostros
prototxtPath = "face_detector/deploy.prototxt"
weightsPath = "face_detector/res10_300x300_ssd_iter_140000.caffemodel"
try:
    faceNet = cv2.dnn.readNet(prototxtPath, weightsPath)
    _facenet_ok = True
except Exception as _fe:
    print(f"⚠️  FaceNet (Caffe) no disponible: {_fe}")
    print("     El endpoint /predict (Keras) no estará disponible.")
    print("     Solución: pip install 'opencv-python==4.10.0.84'")
    faceNet = None
    _facenet_ok = False

# Ruta al modelo
MODEL_PATH = "model/modelFER77percent.keras"
try:
    model = keras.models.load_model(MODEL_PATH)
    _keras_model_ok = True
except Exception as _ke:
    print(f"⚠️  Modelo Keras no disponible: {_ke}")
    model = None
    _keras_model_ok = False

emotions = ['angry', 'fear', 'happy', 'neutral', 'sad', 'surprise']

@app.route('/predict', methods=['POST'])
def predict():
    if not _facenet_ok or not _keras_model_ok:
        return jsonify({"error": "Modelo Keras/FaceNet no disponible. Ejecutá: pip install 'opencv-python==4.10.0.84'"}), 503
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

# ================================================================
# 🔹 MODELO 3 — LSA64 (reemplazá el bloque existente en app.py)
# ================================================================
# CAMBIOS RESPECTO AL ORIGINAL:
#   - LSTMModel definida UNA sola vez (sin duplicados)
#   - input_size=252  (posición 126 + velocidad 126, igual al entrenamiento)
#   - SEQUENCE_LENGTH=50 (igual al entrenamiento, no 30)
#   - Velocidad reactivada y normalización igual al Colab
#   - Validación de shape corregida a (50, 126) → luego pasa a (50, 252)
# ================================================================

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

SEQUENCE_LENGTH_LSA = 50   # ← debe coincidir con el entrenamiento

class LSTMModel(nn.Module):
    def __init__(self, input_size=252, hidden_size=256, num_layers=3, num_classes=64):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.3
        )
        self.fc1     = nn.Linear(hidden_size, 128)
        self.relu    = nn.ReLU()
        self.dropout = nn.Dropout(0.4)
        self.fc2     = nn.Linear(128, num_classes)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]          # último timestep
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        return self.fc2(out)


def preprocess_lsa_sequence(raw_sequence_np):
    """
    Recibe:   np.array de shape (50, 126)  — keypoints crudos por frame
    Devuelve: torch.Tensor de shape (1, 50, 252) listo para el modelo

    Pipeline idéntico al entrenamiento (señas64.py):
      1. Normalización por frame (Z-score, reshape a (-1,3))
      2. Velocidad = diff entre frames, con padding de ceros al inicio
      3. Concatenar posición + velocidad → 252 features
    """
    seq_norm = []
    for frame in raw_sequence_np:                  # frame: (126,)
        f = frame.reshape(-1, 3)                   # (42, 3)
        f = f - np.mean(f, axis=0)
        f = f / (np.std(f, axis=0) + 1e-8)
        seq_norm.append(f.flatten())

    seq_norm = np.array(seq_norm)                  # (50, 126)

    velocity = np.diff(seq_norm, axis=0)           # (49, 126)
    velocity = np.vstack([np.zeros((1, 126)), velocity])  # (50, 126)

    final = np.concatenate([seq_norm, velocity], axis=1)  # (50, 252)

    return torch.tensor(final, dtype=torch.float32).unsqueeze(0)  # (1, 50, 252)


# Cargar modelo
modelLSA = LSTMModel(input_size=252, num_classes=64)
try:
    modelLSA.load_state_dict(
        torch.load("model/lsa64_model.pth", map_location=torch.device("cpu"))
    )
    modelLSA.eval()
    print("✅ Modelo LSA64 cargado")
except Exception as e:
    print(f"❌ Error cargando modelo LSA64: {e}")


# ── RUTA ──────────────────────────────────────────────────────
@app.route('/predict-lsa', methods=['POST'])
def predict_lsa():
    try:
        data = request.json
        full_sequence = data.get("sequence", [])

        # Validar longitud: el frontend debe enviar 50 frames × 126 keypoints
        if not full_sequence or len(full_sequence) != SEQUENCE_LENGTH_LSA:
            return jsonify({
                "error": f"Secuencia incompleta. Se esperaban {SEQUENCE_LENGTH_LSA} frames, llegaron {len(full_sequence)}"
            }), 400

        sequence_np = np.array(full_sequence, dtype=np.float32)

        if sequence_np.shape != (SEQUENCE_LENGTH_LSA, 126):
            return jsonify({
                "error": f"Shape incorrecto. Esperado ({SEQUENCE_LENGTH_LSA}, 126), llegó {sequence_np.shape}"
            }), 400

        if np.isnan(sequence_np).any():
            return jsonify({"error": "La secuencia contiene NaN"}), 400

        # Preprocesar igual que en el entrenamiento
        input_tensor = preprocess_lsa_sequence(sequence_np)  # (1, 50, 252)

        with torch.no_grad():
            output = modelLSA(input_tensor)
            probs  = F.softmax(output, dim=1).squeeze().numpy()

        top5_idx = probs.argsort()[-5:][::-1]
        top5 = [
            {"class": int(i) + 1, "prob": round(float(probs[i]) * 100, 2)}
            for i in top5_idx
        ]

        return jsonify({
            "prediction": top5[0]["class"],   # clase 1-indexada (como el dataset)
            "confidence": top5[0]["prob"],
            "top5": top5
        })

    except Exception as e:
        print(f"❌ Error en /predict-lsa: {e}")
        return jsonify({"error": str(e)}), 500
    

##############################################
# Google Vision API para seguridad de imágenes
##############################################
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
    if not _vision_ok or vision_client is None:
        return jsonify({"error": "google-cloud-vision no instalado. Ejecutá: pip install google-cloud-vision"}), 503

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



# @app.route('/predict-lsa', methods=['POST'])
#def predict_lsa():
#    try:
#        data = request.json
#        full_sequence = data.get("sequence", [])

#        if not full_sequence or len(full_sequence) != 30:
#            return jsonify({"error": "Secuencia incompleta o no recibida"}), 400

        # 1. Convertir a Array de NumPy (50, 126)
#        sequence_np = np.array(full_sequence)

#        if sequence_np.shape != (30, 126):
#            return jsonify({"error": f"Formato incorrecto. Se esperaba (30,126) y llegó {sequence_np.shape}"}), 400
        
#        if np.isnan(sequence_np).any():
#            return jsonify({"error": "NaN en la secuencia"}), 400
        
#        mean = sequence_np.mean(axis=1, keepdims=True)
#        std = sequence_np.std(axis=1, keepdims=True)
#        std[std == 0] = 1
#        sequence_np = (sequence_np - mean) / std
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
#        input_tensor = torch.tensor(sequence_np, dtype=torch.float32).unsqueeze(0)
 
#        with torch.no_grad():
#            output = modelLSA(input_tensor)

#            probs = F.softmax(output, dim=1).squeeze().numpy()  # convertir a probabilidades    

            # obtener top 5
#            top5_idx = probs.argsort()[-5:][::-1]

#            top5 = [
#                {"class": int(i), "prob": float(probs[i])}
#                for i in top5_idx
#            ]

#            predicted_class = int(top5[0]["class"])

#        return jsonify({
#            "prediction": predicted_class,
#            "top5": top5
#        })

 #   except Exception as e:
#        return jsonify({"error": str(e)}), 500
    
# ================================================================
# 🔤 MODELO 4 — ABCDario Multimodal (manos + rostro + pose)
# ================================================================
# Arquitectura idéntica al notebook de entrenamiento:
#   - Secuencia: 30 frames × 214 features
#   - Normalización: centro/ancho de hombros (pose landmarks 11-12)
#   - Clases: A B C D E F G
# ================================================================

ABCDARIO_CLASSES  = list("ABCDEFGHIJKLMNÑOPQRSTUVWXYZ")   # 17 clases según el modelo entrenado
ABCDARIO_SEQ_LEN  = 30

# Índices de landmarks — DEBEN coincidir con el notebook
ABCDARIO_FACE_INDICES = [
    1, 33, 133, 159, 145, 263, 362, 386, 374,
    70, 63, 105, 300, 293, 334, 61, 291, 13, 14, 78, 308
]
ABCDARIO_POSE_INDICES = [0, 11, 12, 13, 14, 15, 16]

# Conteos de features por modalidad (para verificación)
_ABC_HAND_FEATS  = 2 * 21 * 3   # 126
_ABC_FACE_FEATS  = len(ABCDARIO_FACE_INDICES) * 3   # 63
_ABC_POSE_FEATS  = len(ABCDARIO_POSE_INDICES) * 3   # 21
_ABC_PRES_FEATS  = 4
_ABC_TOTAL_FEATS = _ABC_HAND_FEATS + _ABC_FACE_FEATS + _ABC_POSE_FEATS + _ABC_PRES_FEATS  # 214

# Buffer deslizante + lock
_abc_buffer       = []
_abc_step_counter = 0
_abc_lock         = threading.Lock()
ABCDARIO_STEP     = 1       # predice en cada frame nuevo (ventana deslizante de 30, máxima fluidez)

# ── Descarga de modelos MediaPipe ──────────────────────────────────────────
_MP_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mediapipe_models")
os.makedirs(_MP_MODELS_DIR, exist_ok=True)

def _mp_download(url, filename):
    path = os.path.join(_MP_MODELS_DIR, filename)
    if not os.path.exists(path):
        print(f"⬇️  Descargando {filename} ...")
        urllib.request.urlretrieve(url, path)
        print(f"✅ {filename} descargado")
    return path

# ── Cargar detectores MediaPipe Tasks (IMAGE mode) ─────────────────────────
try:
    import mediapipe as mp_abc
    from mediapipe.tasks import python as _mpt_python
    from mediapipe.tasks.python import vision as _mpt_vision

    _abc_hand_path = _mp_download(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        "hand_landmarker.task"
    )
    _abc_face_path = _mp_download(
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        "face_landmarker.task"
    )
    _abc_pose_path = _mp_download(
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        "pose_landmarker_lite.task"
    )

    _abc_hand_det = _mpt_vision.HandLandmarker.create_from_options(
        _mpt_vision.HandLandmarkerOptions(
            base_options=_mpt_python.BaseOptions(model_asset_path=_abc_hand_path),
            running_mode=_mpt_vision.RunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
        )
    )
    _abc_face_det = _mpt_vision.FaceLandmarker.create_from_options(
        _mpt_vision.FaceLandmarkerOptions(
            base_options=_mpt_python.BaseOptions(model_asset_path=_abc_face_path),
            running_mode=_mpt_vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
        )
    )
    _abc_pose_det = _mpt_vision.PoseLandmarker.create_from_options(
        _mpt_vision.PoseLandmarkerOptions(
            base_options=_mpt_python.BaseOptions(model_asset_path=_abc_pose_path),
            running_mode=_mpt_vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
        )
    )
    print("✅ Detectores MediaPipe ABCDario listos")
    _abc_mp_ok = True
except Exception as _abc_mp_err:
    print(f"⚠️  MediaPipe ABCDario no disponible: {_abc_mp_err}")
    print("     Solución: pip install mediapipe>=0.10.0")
    _abc_mp_ok = False


def _abc_get_pose_ref(pose_lms):
    """Centro y escala a partir de los hombros (igual que el notebook)."""
    if pose_lms is None or len(pose_lms) < 13:
        return np.array([0.5, 0.5, 0.0], dtype=np.float32), 1.0
    left  = np.array([pose_lms[11].x, pose_lms[11].y, pose_lms[11].z], dtype=np.float32)
    right = np.array([pose_lms[12].x, pose_lms[12].y, pose_lms[12].z], dtype=np.float32)
    center = (left + right) / 2.0
    scale  = np.linalg.norm(left[:2] - right[:2])
    return center, float(scale) if scale > 1e-4 else 1.0


def _abc_norm(pts, center, scale):
    if pts is None or len(pts) == 0:
        return np.zeros((0, 3), dtype=np.float32)
    return ((pts - center) / scale).astype(np.float32)


def _abc_extract_features(frame_bgr):
    """Extrae 214 features de un frame BGR. Idéntico al notebook."""
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_img = mp_abc.Image(image_format=mp_abc.ImageFormat.SRGB, data=frame_rgb)

    h_res = _abc_hand_det.detect(mp_img)
    f_res = _abc_face_det.detect(mp_img)
    p_res = _abc_pose_det.detect(mp_img)

    pose_lms        = p_res.pose_landmarks[0] if p_res.pose_landmarks else None
    center, scale   = _abc_get_pose_ref(pose_lms)

    # ── Manos ──────────────────────────────────────────────────────
    hand_feats = np.zeros((2, 21, 3), dtype=np.float32)
    hand_pres  = [0.0, 0.0]
    if h_res.hand_landmarks:
        for idx, hand in enumerate(h_res.hand_landmarks[:2]):
            pts  = np.array([[p.x, p.y, p.z] for p in hand], dtype=np.float32)
            pts  = _abc_norm(pts, center, scale)
            side = "Right"
            if h_res.handedness and idx < len(h_res.handedness):
                side = h_res.handedness[idx][0].category_name
            slot = 0 if side.lower() == "left" else 1
            hand_feats[slot] = pts
            hand_pres[slot]  = 1.0

    # ── Rostro ─────────────────────────────────────────────────────
    face_feats = np.zeros((len(ABCDARIO_FACE_INDICES), 3), dtype=np.float32)
    face_pres  = 0.0
    if f_res.face_landmarks:
        face = f_res.face_landmarks[0]
        pts  = np.array([[face[j].x, face[j].y, face[j].z]
                          for j in ABCDARIO_FACE_INDICES], dtype=np.float32)
        face_feats = _abc_norm(pts, center, scale)
        face_pres  = 1.0

    # ── Pose ───────────────────────────────────────────────────────
    pose_feats = np.zeros((len(ABCDARIO_POSE_INDICES), 3), dtype=np.float32)
    pose_pres  = 0.0
    if pose_lms:
        pts  = np.array([[pose_lms[j].x, pose_lms[j].y, pose_lms[j].z]
                          for j in ABCDARIO_POSE_INDICES], dtype=np.float32)
        pose_feats = _abc_norm(pts, center, scale)
        pose_pres  = 1.0

    vector = np.concatenate([
        hand_feats.reshape(-1),
        face_feats.reshape(-1),
        pose_feats.reshape(-1),
        np.array([hand_pres[0], hand_pres[1], face_pres, pose_pres], dtype=np.float32)
    ])
    assert len(vector) == _ABC_TOTAL_FEATS, f"Features: {len(vector)} ≠ {_ABC_TOTAL_FEATS}"
    has_hands = bool(h_res.hand_landmarks)
    return vector, has_hands


# ── Cargar modelo Keras ─────────────────────────────────────────────────────
# El modelo fue guardado con Keras 3 (Colab) que incluye 'quantization_config'
# en Dense. El venv puede tener una versión diferente, así que reconstruimos
# la arquitectura idéntica al notebook y cargamos solo los pesos del ZIP.
import zipfile, tempfile

def _load_abcdario_model(model_path):
    """
    Carga el modelo ABCDario desde el formato .keras de Keras 3.
    Evita la incompatibilidad de versiones reconstruyendo la arquitectura
    y leyendo los pesos directamente del H5 interno (layers/{name}/vars/).
    """
    import h5py

    try:
        import tensorflow as _tf
        _k = _tf.keras
    except Exception:
        import keras as _k

    # Arquitectura idéntica al notebook
    m = _k.Sequential([
        _k.Input(shape=(ABCDARIO_SEQ_LEN, _ABC_TOTAL_FEATS)),
        _k.layers.LSTM(128, return_sequences=True),
        _k.layers.Dropout(0.30),
        _k.layers.LSTM(64),
        _k.layers.Dropout(0.30),
        _k.layers.Dense(64, activation="relu"),
        _k.layers.Dropout(0.20),
        _k.layers.Dense(len(ABCDARIO_CLASSES), activation="softmax"),
    ])

    # Extraer model.weights.h5 del ZIP .keras
    with zipfile.ZipFile(model_path, "r") as zf:
        with zf.open("model.weights.h5") as src:
            data = src.read()

    with tempfile.NamedTemporaryFile(suffix=".h5", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        # Leer pesos en formato Keras 3 (layers/{name}/vars/{i})
        with h5py.File(tmp_path, "r") as f:
            layers_grp = f["layers"]
            for layer in m.layers:
                name = layer.name
                if name not in layers_grp:
                    continue
                g = layers_grp[name]
                # LSTM: pesos bajo cell/vars/
                if "cell" in g and "vars" in g["cell"]:
                    vg = g["cell"]["vars"]
                    layer.set_weights([vg[str(i)][:] for i in range(len(vg))])
                # Dense y otros: pesos bajo vars/
                elif "vars" in g and len(g["vars"]) > 0:
                    vg = g["vars"]
                    layer.set_weights([vg[str(i)][:] for i in range(len(vg))])
    finally:
        os.unlink(tmp_path)

    return m

try:
    _ABCDARIO_MODEL_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "model", "modelo_alfabeto_multimodal_lstm.keras"
    )
    print(f"📂 Cargando modelo ABCDario desde: {_ABCDARIO_MODEL_PATH}")
    abcdario_model = _load_abcdario_model(_ABCDARIO_MODEL_PATH)
    # Warm-up
    abcdario_model.predict(
        np.zeros((1, ABCDARIO_SEQ_LEN, _ABC_TOTAL_FEATS), dtype=np.float32), verbose=0
    )
    print("✅ Modelo ABCDario cargado")
    _abc_model_ok = True
except Exception as _abc_model_err:
    print(f"⚠️  Modelo ABCDario no disponible: {_abc_model_err}")
    _abc_model_ok = False


# ── Endpoints ───────────────────────────────────────────────────────────────
@app.route('/predict-abcdario', methods=['POST'])
def predict_abcdario():
    global _abc_buffer, _abc_step_counter

    if not _abc_model_ok:
        return jsonify({"error": "Modelo ABCDario no cargado. Copiá modelo_alfabeto_multimodal_lstm.keras a backend/model/"}), 503
    if not _abc_mp_ok:
        return jsonify({"error": "MediaPipe no disponible. Ejecutá: pip install mediapipe>=0.10.0"}), 503

    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Sin imagen"}), 400

    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({"error": "No se pudo decodificar la imagen"}), 400

    try:
        features, has_hands = _abc_extract_features(frame)
    except Exception as e:
        return jsonify({"error": f"Extracción fallida: {str(e)}"}), 500

    # Sin manos → informa al frontend, que decide cuándo limpiar
    if not has_hands:
        return jsonify({"status": "no_hands"})

    with _abc_lock:
        _abc_buffer.append(features)
        if len(_abc_buffer) > ABCDARIO_SEQ_LEN:
            _abc_buffer.pop(0)
        count = len(_abc_buffer)
        _abc_step_counter += 1

        # Predicción cuando hay 30 frames Y pasaron al menos STEP frames nuevos
        if count < ABCDARIO_SEQ_LEN or _abc_step_counter < ABCDARIO_STEP:
            return jsonify({"status": "buffering", "count": count, "total": ABCDARIO_SEQ_LEN})

        _abc_step_counter = 0
        sequence = np.array(_abc_buffer, dtype=np.float32)   # (30, 214)

    X     = np.expand_dims(sequence, axis=0)                 # (1, 30, 214)
    preds = abcdario_model.predict(X, verbose=0)[0]          # (7,)

    top_i = np.argsort(preds)[-5:][::-1]
    top5  = [
        {"class": ABCDARIO_CLASSES[i], "prob": round(float(preds[i]) * 100, 2)}
        for i in top_i
    ]

    return jsonify({
        "status":     "ready",
        "prediction": top5[0]["class"],
        "confidence": top5[0]["prob"],
        "top5":       top5,
    })


@app.route('/abcdario-reset', methods=['POST'])
def abcdario_reset():
    global _abc_buffer, _abc_step_counter
    with _abc_lock:
        _abc_buffer.clear()
        _abc_step_counter = 0
    return jsonify({"status": "reset"})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)