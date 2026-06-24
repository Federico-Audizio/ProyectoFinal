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

// Color por emoción para las barras
const emotionBarColor = (emotion: string): string => {
  const e = emotion.toLowerCase();
  if (e.includes("happy") || e.includes("alegr") || e.includes("feli")) return "#28a745";
  if (e.includes("sad") || e.includes("trist")) return "#007FFF";
  if (e.includes("angry") || e.includes("enoj") || e.includes("furios")) return "#CC0000";
  if (e.includes("fear") || e.includes("miedo")) return "#6f42c1";
  if (e.includes("surpris") || e.includes("sorpr")) return "#fd7e14";
  return "#6c757d";
};

const CameraPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<"keras" | "yolo">("keras");
  const [isStreaming, setIsStreaming] = useState(false);
  const [emotion, setEmotion] = useState("Esperando detección...");
  const [currentPictograms, setCurrentPictograms] = useState<
    { src: string; label: string; color: string }[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [emotionDistribution, setEmotionDistribution] = useState<Record<string, number>>({});

  const handleEmotionDetected = (detectedEmotion: string) => {
    setEmotion(detectedEmotion);
    const normalizedKey = emotionMap[detectedEmotion.toLowerCase()] || "neutral";
    const pictogramPaths = emotionPictogramMap[normalizedKey] || [];
    setCurrentPictograms(pictogramPaths);
    setSelectedIndex(null);
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
          <CameraCapture
            isStreaming={isStreaming}
            selectedModel={selectedModel}
            onEmotionDetected={handleEmotionDetected}
            onDistributionUpdate={setEmotionDistribution}
          />

          {/* Selector de modelo — badge discreto esquina superior derecha */}
          <div className="camera-model-badge">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as "keras" | "yolo")}
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
                    className={`camera-pictogram-item${selectedIndex === index ? " selected" : ""}`}
                    style={{ borderColor: p.color, "--picto-color": p.color } as React.CSSProperties}
                    onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
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

        {/* 2. Distribución de emociones (solo YOLO) */}
        {selectedModel === "yolo" && Object.keys(emotionDistribution).length > 0 && (
          <div className="emotion-distribution-panel">
            {Object.entries(emotionDistribution).map(([em, pct]) => (
              <div key={em} className="emotion-bar-row">
                <span className="emotion-bar-label">{em}</span>
                <div className="emotion-bar-track">
                  <div
                    className="emotion-bar-fill"
                    style={{ width: `${pct}%`, background: emotionBarColor(em) }}
                  />
                </div>
                <span className="emotion-bar-pct">{pct}%</span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Caja Emoción */}
        <div className="emotion-box-footer">
          <span>Emoción: {emotion}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
