import React, { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import "./CameraPage.css"; // 🔥 Estilos externos

const CameraPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState("keras");
  const [isStreaming, setIsStreaming] = useState(false);
  const [emotion, setEmotion] = useState("Esperando detección...");

  return (
    <div className="camera-page">
      {/* ---- Panel Izquierdo ---- */}
      <div className="left-panel">
        <CameraCapture isStreaming={isStreaming} onEmotionDetected={setEmotion} />
        <div className="controls">
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
          <div className={`pictogram ${emotion.toLowerCase() === "alegría" ? "active" : ""}`}>😀</div>
          <div className={`pictogram ${emotion.toLowerCase() === "tristeza" ? "active" : ""}`}>😢</div>
          <div className={`pictogram ${emotion.toLowerCase() === "enojo" ? "active" : ""}`}>😡</div>
          <div className={`pictogram ${emotion.toLowerCase() === "sorpresa" ? "active" : ""}`}>😮</div>
        </div>

        <div className="emotion-box">
          <span>Emoción: {emotion}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
