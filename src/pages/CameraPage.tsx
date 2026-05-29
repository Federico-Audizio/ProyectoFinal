import React, { useState, useEffect } from "react";
import CameraCapture from "../components/CameraCapture";
import "./CameraPage.css"; // 🔥 Estilos externos

// Define un mapeo de emociones a un array de rutas de pictogramas
const emotionPictogramMap: { [key: string]: { src: string; label: string; color: string }[] } = {
  neutral: [],
  happy: [
    { src: "/public/pictograms/happy/amor.webp",        label: "Amor",         color: "#28a745" },
    { src: "/public/pictograms/happy/deporte.webp",     label: "Deporte",      color: "#28a745" },
    { src: "/public/pictograms/happy/orgulloso.webp",   label: "Orgulloso",    color: "#28a745" },
    { src: "/public/pictograms/happy/emocionado.webp",  label: "Emocionado",   color: "#28a745" },
    { src: "/public/pictograms/happy/me-gusta-eso.webp",label: "Me gusta eso", color: "#28a745" },
    { src: "/public/pictograms/happy/música.webp",      label: "Música",       color: "#28a745" },
  ],
  sad: [
    { src: "/public/pictograms/sad/dolor.webp",                label: "Dolor",           color: "#007FFF" },
    { src: "/public/pictograms/sad/incómodo.png",              label: "Incómodo",        color: "#007FFF" },
    { src: "/public/pictograms/sad/me molesta el ruido.png",   label: "Molesta el ruido",color: "#007FFF" },
    { src: "/public/pictograms/sad/miedo.png",                 label: "Miedo",           color: "#007FFF" },
    { src: "/public/pictograms/sad/dolor de pierna.png",       label: "Dolor de pierna", color: "#007FFF" },
    { src: "/public/pictograms/sad/solo.png",                  label: "Solo",            color: "#007FFF" },
  ],
  angry: [
    { src: "/public/pictograms/angry/aburrimiento.png",    label: "Aburrimiento",    color: "#CC0000" },
    { src: "/public/pictograms/angry/agobiado.png",        label: "Agobiado",        color: "#CC0000" },
    { src: "/public/pictograms/angry/déjame solo.png",     label: "Déjame solo",     color: "#CC0000" },
    { src: "/public/pictograms/angry/furioso.png",         label: "Furioso",         color: "#CC0000" },
    { src: "/public/pictograms/angry/no me gusta eso.png", label: "No me gusta eso", color: "#CC0000" },
    { src: "/public/pictograms/angry/ansioso.png",         label: "Ansioso",         color: "#CC0000" },
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

  // 👇 2. AGREGA ESTO: Expone la función a la ventana global del navegador
  useEffect(() => {
    (window as any).forzarEmocion = (emocion: string) => {
      console.log("Forzando emoción:", emocion);
      handleEmotionDetected(emocion);
    };
  }, []);

  // Función para alternar entre Iniciar y Detener
  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
    if (isStreaming) {
        setEmotion("Detección detenida.");
        setCurrentPictograms([]);
    }
  };


  return (
    <div className="camera-page">
      {/* ---- Panel Izquierdo ---- */}
      <div className="left-panel">
        <div className="camera-wrapper">
          <CameraCapture isStreaming={isStreaming} onEmotionDetected={handleEmotionDetected} />

          {/* Selector de modelo — badge discreto esquina superior derecha */}
          <div className="camera-model-badge">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="keras">Keras</option>
              <option value="yolo">YOLO</option>
            </select>
          </div>

          {/* Botón play/stop — overlay centrado abajo */}
          <button
            className={`camera-toggle-btn ${isStreaming ? "stop" : "start"}`}
            onClick={toggleStreaming}
          >
            {isStreaming ? (
              <><div className="icon-square">■</div> Detener</>
            ) : (
              <><div className="icon-play">▶</div> Iniciar</>
            )}
          </button>
        </div>
      </div>

      {/* ---- Panel Derecho ---- */}
      <div className="right-panel">
        {/* 1. Grid: Ocupa todo el espacio superior */}
        <div className="pictogram-grid-container">
            <div className="camera-pictogram-grid"> 
            {currentPictograms.length > 0 ? (
                currentPictograms.map((p, index) => (
                <div
                    key={index}
                    className="camera-pictogram-item"
                    style={{ borderColor: p.color }}
                >
                    <img src={p.src} alt={p.label} className="camera-pictogram" loading="lazy"/>
                    <p>{p.label}</p>
                </div>
                ))
            ) : (
                <div className="placeholder">
                 <p>Esperando...</p>
                </div>
            )}
            </div>
        </div>

        {/* 2. Caja Emoción: Alineada abajo (misma altura que controles) */}
        <div className="emotion-box-footer">
          <span>Emoción: {emotion}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
