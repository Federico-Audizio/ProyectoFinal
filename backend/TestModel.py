import cv2
import numpy as np
import keras

# Carga el modelo (asegúrate de que la ruta sea correcta)
MODEL_PATH = r"C:\Users\Cristian\source\repos\ProyectoFinal\backend\model\modelFER77percent.keras"
model = keras.models.load_model(MODEL_PATH)

# Carga la imagen de prueba
image_path = "happy_face.jpg"
image = cv2.imread(image_path)

if image is None:
    print(f"Error: No se pudo cargar la imagen en la ruta: {image_path}")
else:
    # Preprocesamiento (EXACTAMENTE IGUAL QUE EN FLASK)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    if len(faces) == 0:
        print("No se detectó ningún rostro en la imagen de prueba.")
    else:
        (x, y, w, h) = faces[0]
        face = gray[y:y+h, x:x+w]

        # --- APLICA AQUÍ EL MISMO PREPROCESAMIENTO QUE ESTÁS PROBANDO EN FLASK ---
        resized = cv2.resize(face, (48, 48))
        
        # Opción 1: Normalización a [0, 1]
        normalized = resized.astype('float32') / 255.0

        # Opción 2: Normalización a [-1, 1]
        #normalized = (resized.astype('float32') - 127.5) / 127.5
        
        reshaped = normalized.reshape(1, 48, 48, 1)
        # -------------------------------------------------------------------

        # Realizar la predicción
        prediction = model.predict(reshaped)
        
        # Imprimir resultados
        emotions = ['anger', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']
        emotion_index = np.argmax(prediction)
        result = emotions[emotion_index]

        print("--- RESULTADOS DEL TEST ---")
        print(f"Predicciones crudas: {prediction}")
        print(f"Emoción detectada: {result} (Índice: {emotion_index})")