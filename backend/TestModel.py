import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

# --- Carga de Modelos ---
print("✔️ Cargando modelos...")
# Carga el modelo de clasificación de emociones
emotion_model_path = "model\modelFER77percent.keras" # Asegúrate que la ruta sea correcta
emotion_model = load_model(emotion_model_path)

# Carga el modelo de detección de rostros (el mismo que en Flask)
prototxtPath = r"face_detector/deploy.prototxt"
weightsPath = r"face_detector/res10_300x300_ssd_iter_140000.caffemodel"
faceNet = cv2.dnn.readNet(prototxtPath, weightsPath)
print("✅ Modelos cargados.")

# --- Carga de la Imagen de Prueba ---
image_path = "happy_face.jpg" # Cambia esto por la imagen que quieras probar
image = cv2.imread(image_path)

if image is None:
    print(f"Error: No se pudo cargar la imagen en la ruta: {image_path}")
else:
    # --- Lógica de Detección y Predicción (IDÉNTICA A FLASK) ---
    
    # 1. Detección de rostros con el modelo DNN
    (h, w) = image.shape[:2]
    blob = cv2.dnn.blobFromImage(image, 1.0, (224, 224), (104.0, 177.0, 123.0))
    
    faceNet.setInput(blob)
    detections = faceNet.forward()

    # Comprobar si se detectó algún rostro
    if detections.shape[2] == 0:
        print("No se detectó ningún rostro en la imagen de prueba.")
    else:
        # Asumimos que queremos analizar el rostro con la mayor confianza
        i = np.argmax(detections[0, 0, :, 2])
        confidence = detections[0, 0, i, 2]
        
        if confidence > 0.5: # Umbral de confianza
            print(f"Rostro detectado con una confianza de {confidence*100:.2f}%")
            # 2. Extraer las coordenadas del rostro
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (Xi, Yi, Xf, Yf) = box.astype("int")

            # 3. Preprocesar el rostro para el modelo de emociones
            # Se extrae el rostro, se convierte a escala de grises y se redimensiona
            face = image[Yi:Yf, Xi:Xf]
            face_gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
            face_resized = cv2.resize(face_gray, (48, 48))
            
            # Convertir a array y expandir dimensiones para que coincida con la entrada del modelo
            face_array = img_to_array(face_resized)
            face_expanded = np.expand_dims(face_array, axis=0)
            
            # NOTA: No se normaliza a /255.0 porque el script original de Flask no lo hacía.
            # Se usa la imagen tal como la procesa `img_to_array`.

            # 4. Realizar la predicción
            prediction = emotion_model.predict(face_expanded)
            
            # --- Imprimir Resultados ---
            emotions = ['angry', 'fear', 'happy', 'neutral', 'sad', 'surprise']
            emotion_index = np.argmax(prediction)
            result = emotions[emotion_index]
            confidence_emotion = np.max(prediction) * 100

            print("\n--- RESULTADOS DEL TEST ---")
            print(f"Predicciones crudas: {prediction[0]}")
            print(f"Emoción detectada: {result} (Índice: {emotion_index})")
            print(f"Confianza: {confidence_emotion:.2f}%")

            # Opcional: Mostrar la imagen con el resultado
            label = f"{result}: {confidence_emotion:.2f}%"
            cv2.rectangle(image, (Xi, Yi), (Xf, Yf), (0, 255, 0), 2)
            cv2.putText(image, label, (Xi, Yi - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow("Resultado", image)
            cv2.waitKey(0)
            cv2.destroyAllWindows()
        else:
            print(f"No se detectaron rostros con suficiente confianza (Confianza máxima: {confidence*100:.2f}%)")
