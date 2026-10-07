from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import os

# torch y ultralytics se importan lazy para no consumir RAM al arrancar
_keras_ok = False
_torch = None
_torch_F = None

def _get_torch():
    global _torch, _torch_F
    if _torch is None:
        import torch
        import torch.nn.functional as F
        _torch = torch
        _torch_F = F
    return _torch, _torch_F
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

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://proyectofinal-78eb4.web.app",
    "https://proyectofinal-78eb4.firebaseapp.com",
]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})
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
yolo_model = None

def get_yolo_model():
    global yolo_model
    if yolo_model is None:
        from ultralytics import YOLO
        yolo_model = YOLO(YOLO_PATH)
    return yolo_model

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

CONF_THRESHOLD = 0.60  # umbral general (alegre)
CONF_THRESHOLD_BY_CLASS = {
    "triste":  0.55,
    "enojado": 0.65,
    "enojada": 0.65,
}

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
        results = get_yolo_model().predict(
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
                    "class": get_yolo_model().names[int(box.cls)],
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

        # Porcentaje real de confianza (sin normalizar); siempre incluir todas las clases
        all_classes = list(get_yolo_model().names.values())
        emotion_distribution = {
            k: round(face_scores.get(k, 0.0) * 100, 1)
            for k in sorted(all_classes, key=lambda c: -face_scores.get(c, 0.0))
        }

        # Aplicar padding y devolver resultado
        x1, y1, x2, y2 = expand_bbox(mx1, my1, mx2, my2, w_img, h_img, pad=0.20)
        main_conf_pct = round(main["raw_conf"] * 100, 1)
        effective_threshold = CONF_THRESHOLD_BY_CLASS.get(main["class"], CONF_THRESHOLD)

        return jsonify({
            "best": {
                "class": main["class"],
                "confidence": main_conf_pct,
                "bbox": [x1, y1, x2, y2],
                "above_threshold": main["raw_conf"] >= effective_threshold,
            },
            "emotion_distribution": emotion_distribution,
            "threshold": round(effective_threshold * 100, 0),
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

SEQUENCE_LENGTH_LSA = 50

modelLSA = None

def get_lsa_model():
    global modelLSA
    if modelLSA is not None:
        return modelLSA
    import torch
    import torch.nn as nn
    class LSTMModel(nn.Module):
        def __init__(self, input_size=252, hidden_size=256, num_layers=3, num_classes=64):
            super().__init__()
            self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size,
                                num_layers=num_layers, batch_first=True, dropout=0.3)
            self.fc1     = nn.Linear(hidden_size, 128)
            self.relu    = nn.ReLU()
            self.dropout = nn.Dropout(0.4)
            self.fc2     = nn.Linear(128, num_classes)
        def forward(self, x):
            out, _ = self.lstm(x)
            out = out[:, -1, :]
            out = self.fc1(out)
            out = self.relu(out)
            out = self.dropout(out)
            return self.fc2(out)
    m = LSTMModel(input_size=252, num_classes=64)
    try:
        m.load_state_dict(torch.load("model/lsa64_model.pth", map_location=torch.device("cpu")))
        m.eval()
    except Exception as e:
        print(f"❌ Error cargando modelo LSA64: {e}")
    modelLSA = m
    return modelLSA

def preprocess_lsa_sequence(raw_sequence_np):
    import torch
    seq_norm = []
    for frame in raw_sequence_np:
        f = frame.reshape(-1, 3)
        f = f - np.mean(f, axis=0)
        f = f / (np.std(f, axis=0) + 1e-8)
        seq_norm.append(f.flatten())
    seq_norm = np.array(seq_norm)
    velocity = np.diff(seq_norm, axis=0)
    velocity = np.vstack([np.zeros((1, 126)), velocity])
    final = np.concatenate([seq_norm, velocity], axis=1)
    return torch.tensor(final, dtype=torch.float32).unsqueeze(0)


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

        import torch
        import torch.nn.functional as F
        with torch.no_grad():
            output = get_lsa_model()(input_tensor)
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
# 🔤 MODELO 4 — ABCDario Multitarea A–Z
# ================================================================
# Input:  (30, 248) — 30 frames × 248 features
# Outputs: letter_output (27 clases), motion_output, face_output
# El frontend captura 30 frames con un botón y los envía como
# JSON con base64.  El backend extrae features frame a frame
# y devuelve la predicción completa en una sola respuesta.
# ================================================================

# Cargar configuración desde metadata.json (fuente de verdad del entrenamiento)
_ABC_METADATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "metadata.json")
try:
    with open(_ABC_METADATA_PATH, "r", encoding="utf-8") as _f:
        _abc_meta = json.load(_f)
    ABCDARIO_CLASSES = _abc_meta["classes"]
    ABCDARIO_SEQ_LEN = int(_abc_meta.get("sequence_length", 30))
    _ABC_TOTAL_FEATS = int(_abc_meta.get("features_per_frame", 248))
    _fc = _abc_meta.get("feature_config", {})
    _MT_FACE_INDICES = {k: int(v) for k, v in _fc.get("face_indices", {
        "left_eye": 33, "right_eye": 263, "nose": 1,
        "mouth_left": 61, "mouth_right": 291, "chin": 152
    }).items()}
    _MT_POSE_INDICES = {k: int(v) for k, v in _fc.get("pose_indices", {
        "left_shoulder": 11, "right_shoulder": 12,
        "left_elbow": 13, "right_elbow": 14
    }).items()}
    print(f"✅ metadata.json cargado — {len(ABCDARIO_CLASSES)} clases: {ABCDARIO_CLASSES}")
except Exception as _meta_err:
    print(f"⚠️  metadata.json no encontrado, usando defaults: {_meta_err}")
    # Orden exacto del metadata.json: Ñ al final (índice 26)
    ABCDARIO_CLASSES = [
        "A","B","C","D","E","F","G","H","I","J","K","L","M",
        "N","O","P","Q","R","S","T","U","V","W","X","Y","Z","Ñ"
    ]
    ABCDARIO_SEQ_LEN = 30
    _ABC_TOTAL_FEATS = 248
    _MT_FACE_INDICES = {"left_eye": 33, "right_eye": 263, "nose": 1,
                        "mouth_left": 61, "mouth_right": 291, "chin": 152}
    _MT_POSE_INDICES = {"left_shoulder": 11, "right_shoulder": 12,
                        "left_elbow": 13, "right_elbow": 14}

_MT_FACE_KEYS = list(_MT_FACE_INDICES.keys())


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

# ── Detectores MediaPipe (IMAGE mode, globales) ─────────────────────────────
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
            min_hand_detection_confidence=0.35,
            min_hand_presence_confidence=0.35,
        )
    )
    _abc_face_det = _mpt_vision.FaceLandmarker.create_from_options(
        _mpt_vision.FaceLandmarkerOptions(
            base_options=_mpt_python.BaseOptions(model_asset_path=_abc_face_path),
            running_mode=_mpt_vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.35,
            min_face_presence_confidence=0.35,
        )
    )
    _abc_pose_det = _mpt_vision.PoseLandmarker.create_from_options(
        _mpt_vision.PoseLandmarkerOptions(
            base_options=_mpt_python.BaseOptions(model_asset_path=_abc_pose_path),
            running_mode=_mpt_vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.35,
            min_pose_presence_confidence=0.35,
        )
    )
    print("✅ Detectores MediaPipe ABCDario listos")
    _abc_mp_ok = True
except Exception as _abc_mp_err:
    print(f"⚠️  MediaPipe ABCDario no disponible: {_abc_mp_err}")
    _abc_mp_ok = False

_abc_det_lock = threading.Lock()   # IMAGE mode no es thread-safe


def _abc_frame_features(frame_bgr):
    """248 features de un frame BGR usando detectores IMAGE mode globales."""
    import base64 as _b64
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_img    = mp_abc.Image(image_format=mp_abc.ImageFormat.SRGB, data=frame_rgb)

    with _abc_det_lock:
        h_res = _abc_hand_det.detect(mp_img)
        f_res = _abc_face_det.detect(mp_img)
        p_res = _abc_pose_det.detect(mp_img)

    hands = h_res.hand_landmarks
    feats = []

    # Manos (2 × 63 = 126)
    def _norm_hand(lms):
        arr = np.array([[p.x, p.y, p.z] for p in lms], dtype=np.float32)
        c   = arr - arr[0]
        s   = np.max(np.linalg.norm(c, axis=1)) or 1.0
        return (c / s).flatten()

    hand_vecs = [_norm_hand(h) for h in hands[:2]]
    while len(hand_vecs) < 2:
        hand_vecs.append(np.zeros(63, dtype=np.float32))
    feats.extend(hand_vecs)

    # Rostro (6 × 3 = 18)
    if f_res.face_landmarks:
        fl = f_res.face_landmarks[0]
        face_pts = {n: np.array([fl[i].x, fl[i].y, fl[i].z], dtype=np.float32)
                    for n, i in _MT_FACE_INDICES.items()}
        feats.append(np.concatenate([face_pts[k] for k in _MT_FACE_KEYS]).astype(np.float32))
    else:
        face_pts = None
        feats.append(np.zeros(len(_MT_FACE_INDICES) * 3, dtype=np.float32))

    # Pose (4 × 3 = 12)
    if p_res.pose_landmarks:
        pl = p_res.pose_landmarks[0]
        pv = []
        for idx in _MT_POSE_INDICES.values():
            pv.extend([pl[idx].x, pl[idx].y, pl[idx].z] if idx < len(pl) else [0., 0., 0.])
        feats.append(np.asarray(pv, dtype=np.float32))
    else:
        feats.append(np.zeros(len(_MT_POSE_INDICES) * 3, dtype=np.float32))

    # Relaciones (2 × 30 = 60)
    tips = [4, 8, 12, 16, 20]
    for hi in range(2):
        if hi < len(hands) and face_pts is not None:
            rv = []
            for ti in tips:
                tip = np.array([hands[hi][ti].x, hands[hi][ti].y, hands[hi][ti].z], dtype=np.float32)
                for k in _MT_FACE_KEYS:
                    rv.append(float(np.linalg.norm(tip - face_pts[k])))
            feats.append(np.asarray(rv, dtype=np.float32))
        else:
            feats.append(np.zeros(5 * len(_MT_FACE_INDICES), dtype=np.float32))

    # E-features (2 × 16 = 32)
    for hi in range(2):
        if hi < len(hands) and face_pts is not None:
            eye_c = (face_pts["left_eye"] + face_pts["right_eye"]) / 2.0
            ev = []
            for ti in [8, 12, 16, 20]:
                tip = np.array([hands[hi][ti].x, hands[hi][ti].y, hands[hi][ti].z], dtype=np.float32)
                d   = tip - eye_c
                ev.extend([float(d[0]), float(d[1]), float(d[2]), float(np.linalg.norm(d))])
            feats.append(np.asarray(ev, dtype=np.float32))
        else:
            feats.append(np.zeros(16, dtype=np.float32))

    vector = np.concatenate(feats).astype(np.float32)
    assert vector.shape == (_ABC_TOTAL_FEATS,), f"Features: {vector.shape}"
    return vector


def _abc_decode_b64_frame(data_url: str) -> np.ndarray:
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    import base64 as _b64
    raw  = _b64.b64decode(data_url)
    arr  = np.frombuffer(raw, np.uint8)
    bgr  = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Frame JPEG inválido")
    return bgr


# ── Modelo ──────────────────────────────────────────────────────────────────
try:
    _ABCDARIO_MODEL_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "model", "ABCDario_multitask_AZ.keras"
    )
    print(f"📂 Cargando modelo ABCDario: {_ABCDARIO_MODEL_PATH}")
    abcdario_model = keras.models.load_model(_ABCDARIO_MODEL_PATH, compile=False)
    abcdario_model.predict(np.zeros((1, ABCDARIO_SEQ_LEN, _ABC_TOTAL_FEATS), dtype=np.float32), verbose=0)
    print(f"✅ Modelo ABCDario cargado — outputs: {abcdario_model.output_names}")
    _abc_model_ok = True
except Exception as _abc_model_err:
    print(f"⚠️  Modelo ABCDario no disponible: {_abc_model_err}")
    _abc_model_ok = False


# ── Endpoint rápido: sólo detecta si hay manos en 1 frame ────────────────────
@app.route('/check-hands', methods=['POST'])
def check_hands():
    if not _abc_mp_ok:
        return jsonify({"has_hands": False})
    payload  = request.get_json(silent=True) or {}
    encoded  = payload.get("frame", "")
    if not encoded:
        return jsonify({"has_hands": False})
    bgr  = _abc_decode_b64_frame(encoded)
    feat = _abc_frame_features(bgr)
    return jsonify({"has_hands": bool(np.any(feat[:63] != 0))})


# ── Endpoint ─────────────────────────────────────────────────────────────────
@app.route('/predict-abcdario', methods=['POST'])
def predict_abcdario():
    if not _abc_model_ok:
        return jsonify({"error": "Modelo ABCDario_multitask_AZ.keras no cargado en backend/model/"}), 503
    if not _abc_mp_ok:
        return jsonify({"error": "MediaPipe no disponible"}), 503

    payload = request.get_json(silent=True) or {}
    frames  = payload.get("frames", [])

    if len(frames) != ABCDARIO_SEQ_LEN:
        return jsonify({"error": f"Se requieren {ABCDARIO_SEQ_LEN} frames, llegaron {len(frames)}"}), 400

    try:
        sequence   = []
        hand_count = 0
        for encoded in frames:
            bgr  = _abc_decode_b64_frame(encoded)
            feat = _abc_frame_features(bgr)
            if np.any(feat[:63] != 0):   # primera mano presente
                hand_count += 1
            sequence.append(feat)

        # Si menos de la mitad de frames tienen manos → no hay seña
        if hand_count < ABCDARIO_SEQ_LEN // 2:
            return jsonify({"status": "no_hands", "hand_frames": hand_count})

        seq_np = np.stack(sequence, axis=0)       # (30, 248)
        X      = np.expand_dims(seq_np, axis=0)   # (1, 30, 248)

        letter_p, motion_p, face_p = abcdario_model.predict(X, verbose=0)
        letter_probs = letter_p[0]
        top_i = np.argsort(letter_probs)[-5:][::-1]
        top5  = [
            {"class": ABCDARIO_CLASSES[int(i)], "prob": round(float(letter_probs[int(i)]) * 100, 2)}
            for i in top_i
        ]

        return jsonify({
            "status":     "ready",
            "prediction": top5[0]["class"],
            "confidence": top5[0]["prob"],
            "top5":       top5,
            "motion":     bool(float(motion_p[0][0]) >= 0.5),
            "face":       bool(float(face_p[0][0]) >= 0.5),
        })

    except Exception as e:
        print(f"❌ Error ABCDario: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)