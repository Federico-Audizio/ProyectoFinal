import React, { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import "./CameraPage.css"; // 🔥 Estilos externos

// Define un mapeo de emociones a un array de rutas de pictogramas
const emotionPictogramMap: { [key: string]: { src: string; label: string }[] } = {
  neutral: [],
  happy: [
    { src: "/pictograms/happy/amor.webp", label: "Amor" },
    { src: "/pictograms/happy/deporte.webp", label: "Deporte" },
    { src: "/pictograms/happy/orgulloso.webp", label: "Orgulloso" },
    { src: "/pictograms/happy/emocionado.webp", label: "Emocionado" },
    { src: "/pictograms/happy/me-gusta-eso.webp", label: "Me gusta eso" },
    { src: "/pictograms/happy/música.webp", label: "Música" },
  ],
  sad: [
    { src: "/pictograms/sad/dolor.webp", label: "Dolor" },
    { src: "/pictograms/sad/incómodo.png", label: "Incómodo" },
    { src: "/pictograms/sad/me molesta el ruido.png", label: "Molesta el ruido" },
    { src: "/pictograms/sad/miedo.png", label: "Miedo" },
    { src: "/pictograms/sad/dolor de pierna.png", label: "Dolor de pierna" },
    { src: "/pictograms/sad/solo.png", label: "Solo" },
  ],
  angry: [
    { src: "/pictograms/angry/aburrimiento.png", label: "Aburrimiento" },
    { src: "/pictograms/angry/agobiado.png", label: "Agobiado" },
    { src: "/pictograms/angry/déjame solo.png", label: "Déjame solo" },
    { src: "/pictograms/angry/furioso.png", label: "Furioso" },
    { src: "/pictograms/angry/no me gusta eso.png", label: "No me gusta eso" },
    { src: "/pictograms/angry/ansioso.png", label: "Ansioso" },
  ],
};

// Mapeo para normalizar la salida del modelo a la clave de nuestro mapa
const emotionMap: Record<string, string> = {
  "happy": "happy",
  "alegria": "happy", // Si el modelo devuelve "alegria"
  "angry": "angry",
  "enojo": "angry",   // Si el modelo devuelve "enojo"
  "sad": "sad",
  "tristeza": "sad",  // Si el modelo devuelve "tristeza"
  "neutral": "neutral",
  "detección detenida.": "neutral", 
  "esperando detección...": "neutral",
};

const CameraPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState("keras");
  const [isStreaming, setIsStreaming] = useState(false);
  const [emotion, setEmotion] = useState("Esperando detección...");
   const [currentPictograms, setCurrentPictograms] = useState<
    { src: string; label: string }[]
  >([]);

  // 📌 Manejador de emociones: se ejecuta cuando CameraCapture detecta una emoción
  const handleEmotionDetected = (detectedEmotion: string) => {
    setEmotion(detectedEmotion);
    
    // Normaliza la emoción (ej: "alegria" -> "happy")
    const normalizedKey = emotionMap[detectedEmotion.toLowerCase()] || "neutral";

    // Busca las rutas en el mapa y actualiza el estado
    // Si no encuentra la clave, usa "neutral" por defecto
    const pictogramPaths = emotionPictogramMap[normalizedKey] || [];
    
    setCurrentPictograms(pictogramPaths);
  };


  return (
    <div className="camera-page">
      {/* ---- Panel Izquierdo ---- */}
      <div className="left-panel">
          <CameraCapture isStreaming={isStreaming} onEmotionDetected={handleEmotionDetected} />        <div className="controls">
          <button className="start-btn" onClick={() => setIsStreaming(true)}>
            ▶️ Iniciar detección
          </button>
          <button className="stop-btn" onClick={() => setIsStreaming(false)}>
            ⏹️ Detener
          </button>
          <select
            className="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="keras">Modelo Keras</option>
            <option value="yolo">Modelo YOLO</option>
          </select>
        </div>
      </div>

      {/* ---- Panel Derecho ---- */}
      <div className="right-panel">
        <div className="pictogram-grid">
          {/* 📌 Renderizado dinámico de los pictogramas */}
          {currentPictograms.length > 0 ? (
            currentPictograms.map((p, index) => (
              <div key={index} className="pictogram-item">
                <img src={p.src} alt={p.label} className="pictogram" loading="lazy"/>
                <p>{p.label}</p>
              </div>
            ))
          ) : (
            <div className="placeholder">
              <p>Esperando detección de emoción...</p>
            </div>
          )}
        </div>

        <div className="emotion-box">
          <span>Emoción: {emotion}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
