from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from keras.models import load_model
import os
import keras

app = Flask(__name__)
CORS(app)  # 🔥 Habilita CORS para todas las rutas

# Cargamos el  modelo de detección de rostros
prototxtPath = r"face_detector\deploy.prototxt"
weightsPath = r"face_detector\res10_300x300_ssd_iter_140000.caffemodel"
faceNet = cv2.dnn.readNet(prototxtPath, weightsPath)

# Ruta al modelo
MODEL_PATH = r"C:\Users\Lenovo\OneDrive\Desktop\ProyectoFinal\backend\model\modelFER77percent.keras"
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
        (h, w) = image.shape[:2]
        
        blob = cv2.dnn.blobFromImage(image, 1.0, (224, 224), (104.0, 177.0, 123.0))
        faceNet.setInput(blob)
        detections = faceNet.forward()

        if detections.shape[2] == 0:
            return jsonify({'emotion': 'No se detectó rostro'})
        # Preprocesamiento: escala de grises, resize y normalización
        #gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        i = np.argmax(detections[0, 0, :, 2])
        confidence = detections[0, 0, i, 2]

        if confidence < 0.5:
            return jsonify({'emotion': 'Confianza insuficiente para detectar rostro'})
        

        # Coordenadas del rostro
        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        (Xi, Yi, Xf, Yf) = box.astype("int")
        face = image[Yi:Yf, Xi:Xf]

        face_gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        face_resized = cv2.resize(face_gray, (48, 48))

        face_array = np.expand_dims(face_resized, axis=-1)  # (48,48,1)
        face_expanded = np.expand_dims(face_array, axis=0)  # (1,48,48,1)
        #face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        #faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)        #resized = cv2.resize(gray, (48, 48))
        #if len(faces) == 0:
         #   return jsonify({'emotion': 'No se detectó rostro'})
        
        #x, y, w, h = faces[0]
        #face = gray[y:y+h, x:x+w]

        #resized = cv2.resize(face, (48, 48))
        #normalized = resized / 255.0
        #reshaped = normalized.reshape(1, 48, 48, 1)
        #print("Shape de la entrada al modelo:", reshaped.shape)

        # --- Predicción ---
        prediction = model.predict(face_expanded)
        emotion_index = np.argmax(prediction)
        result = emotions[emotion_index]
        confidence_emotion = float(np.max(prediction) * 100)
        

        #for (x, y, w, h) in faces:
         #   face = gray[y:y+h, x:x+w]
          #  resized = cv2.resize(face, (48, 48))
           # normalized = resized / 255.0
            #reshaped = normalized.reshape(1, 48, 48, 1)

        # Predicción
        #prediction = model.predict(reshaped)
        #print("Predicciones crudas:", prediction)

        #emotion_index = np.argmax(prediction)
        #emotions = ['anger','fear','happiness','neutral','sadness','surprise']
        #result = emotions[emotion_index]

        return jsonify({'emotion': result,
            'confidence': confidence_emotion,
            'raw_prediction': prediction.tolist()})

    except Exception as e:
        print("❌ Error procesando la imagen", e)
        return jsonify({'emotion': f"error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

