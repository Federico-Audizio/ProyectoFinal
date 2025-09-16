import React, { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import "./CameraPage.css"; // 🔥 Estilos externos

// Define un mapeo de emociones a un array de rutas de pictogramas
const emotionPictogramMap: { [key: string]: string[] } = {
  "neutral": ["/backend/pictogramas/neutral_pic.png"],
  "happy": [
    "/backend/pictogramas/happy_pic_1.png",
    "/backend/pictogramas/happy_pic_2.png",
    "/backend/pictogramas/happy_pic_3.png",
    "/backend/pictogramas/happy_pic_4.png",
  ],
  "sad": ["/backend/pictogramas/sad_pic.png"],
};

const CameraPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState("keras");
  const [isStreaming, setIsStreaming] = useState(false);
  const [emotion, setEmotion] = useState("Esperando detección...");
  const [currentPictograms, setCurrentPictograms] = useState<string[] | null>(null);

  // 📌 Nuevo manejador de emociones para actualizar el estado
  const handleEmotionDetected = (detectedEmotion: string) => {
    setEmotion(detectedEmotion);
    // Busca el array de pictogramas en el mapeo y lo guarda en el estado
    setCurrentPictograms(emotionPictogramMap[detectedEmotion.toLowerCase()] || null);
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
          {currentPictograms && currentPictograms.length > 0 ? (
            currentPictograms.map((pictogramPath, index) => (
              <img 
                key={index}
                src={pictogramPath}
                alt={`Pictograma de ${emotion}`}
                className="pictogram"              />
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
