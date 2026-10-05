import React, { useState, useEffect, useRef } from "react";
import CameraCapture from "../components/CameraCapture";
import "./CameraPage.css";
import { useAudio } from "../hooks/useAudio";

// Define un mapeo de emociones a un array de rutas de pictogramas (claves = nombres YOLO en español)
const emotionPictogramMap: { [key: string]: { src: string; label: string; color: string }[] } = {
  neutral: [],
  alegre: [
    { src: "/public/pictograms/happy/amor.webp",        label: "Amor",         color: "#28a745" },
    { src: "/public/pictograms/happy/deporte.webp",     label: "Deporte",      color: "#28a745" },
    { src: "/public/pictograms/happy/orgulloso.webp",   label: "Orgulloso",    color: "#28a745" },
    { src: "/public/pictograms/happy/emocionado.webp",  label: "Emocionado",   color: "#28a745" },
    { src: "/public/pictograms/happy/me-gusta-eso.webp",label: "Me gusta eso", color: "#28a745" },
    { src: "/public/pictograms/happy/música.webp",      label: "Música",       color: "#28a745" },
  ],
  triste: [
    { src: "/public/pictograms/sad/dolor.webp",                label: "Dolor",           color: "#007FFF" },
    { src: "/public/pictograms/sad/incómodo.png",              label: "Incómodo",        color: "#007FFF" },
    { src: "/public/pictograms/sad/me molesta el ruido.png",   label: "Molesta el ruido",color: "#007FFF" },
    { src: "/public/pictograms/sad/miedo.png",                 label: "Miedo",           color: "#007FFF" },
    { src: "/public/pictograms/sad/dolor de pierna.png",       label: "Dolor de pierna", color: "#007FFF" },
    { src: "/public/pictograms/sad/solo.png",                  label: "Solo",            color: "#007FFF" },
  ],
  enojado: [
    { src: "/public/pictograms/angry/aburrimiento.png",    label: "Aburrimiento",    color: "#CC0000" },
    { src: "/public/pictograms/angry/agobiado.png",        label: "Agobiado",        color: "#CC0000" },
    { src: "/public/pictograms/angry/déjame solo.png",     label: "Déjame solo",     color: "#CC0000" },
    { src: "/public/pictograms/angry/furioso.png",         label: "Furioso",         color: "#CC0000" },
    { src: "/public/pictograms/angry/no me gusta eso.png", label: "No me gusta eso", color: "#CC0000" },
    { src: "/public/pictograms/angry/ansioso.png",         label: "Ansioso",         color: "#CC0000" },
  ],
};

// Normaliza la clase YOLO a la clave del mapa de pictogramas
const emotionMap: Record<string, string> = {
  "alegre":  "alegre",
  "happy":   "alegre",
  "triste":  "triste",
  "sad":     "triste",
  "enojado":  "enojado",
  "enojada":  "enojado",
  "angry":    "enojado",
  "neutral": "neutral",
  "detección detenida.":   "neutral",
  "esperando detección...": "neutral",
};

// Emociones que pueden confirmarse (excluye estados transitorios)
const MEANINGFUL_EMOTIONS = new Set(["alegre", "triste", "enojado"]);
const CONFIRM_THRESHOLD_DEFAULT = 2;
const CONFIRM_THRESHOLD_BY_EMOTION: Record<string, number> = {
  triste:  1,
  enojado: 1,
  enojada: 1,
};

const emotionLabelMap: Record<string, string> = {
  alegre:  "Alegre",
  triste:  "Triste",
  enojado: "Enojado",
};

const CameraPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState("keras");
  const [isStreaming, setIsStreaming] = useState(false);
  const [emotion, setEmotion] = useState("Esperando detección...");
  const [currentPictograms, setCurrentPictograms] = useState<
    { src: string; label: string; color: string }[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confirmedEmotion, setConfirmedEmotion] = useState<string | null>(null);
  const { playAudio } = useAudio();

  // Refs para evitar closures viejos dentro del callback
  const pendingEmotionRef = useRef<string | null>(null);
  const pendingCountRef   = useRef(0);

  // 📌 Manejador de emociones: acumula detecciones y confirma al llegar al umbral
  const handleEmotionDetected = (detectedEmotion: string) => {
    setEmotion(detectedEmotion);
    const normalizedKey = emotionMap[detectedEmotion.toLowerCase()] || "neutral";
    console.log(`[emo] raw="${detectedEmotion}" key="${normalizedKey}" meaningful=${MEANINGFUL_EMOTIONS.has(normalizedKey)}`);

    // Estados transitorios (neutral, error, detectando) no afectan lo confirmado
    if (!MEANINGFUL_EMOTIONS.has(normalizedKey)) return;

    const threshold = CONFIRM_THRESHOLD_BY_EMOTION[normalizedKey] ?? CONFIRM_THRESHOLD_DEFAULT;

    if (pendingEmotionRef.current !== normalizedKey) {
      pendingEmotionRef.current = normalizedKey;
      pendingCountRef.current = 0;
    }
    pendingCountRef.current += 1;

    if (pendingCountRef.current >= threshold) {
      setConfirmedEmotion(normalizedKey);
      setCurrentPictograms(emotionPictogramMap[normalizedKey] || []);
      setSelectedIndex(null);
      pendingCountRef.current = 0;
    }
  };

  // Expone función de debug en window
  useEffect(() => {
    (window as any).forzarEmocion = (emocion: string) => {
      console.log("Forzando emoción:", emocion);
      handleEmotionDetected(emocion);
    };
  }, []);

  // Función para alternar entre Iniciar y Detener
  const toggleStreaming = () => {
    if (isStreaming) {
      setEmotion("Detección detenida.");
      setCurrentPictograms([]);
      setConfirmedEmotion(null);
      pendingEmotionRef.current = null;
      pendingCountRef.current = 0;
      setSelectedIndex(null);
    }
    setIsStreaming(!isStreaming);
  };


  return (
    <div className="camera-page">
      {/* ---- Panel Izquierdo ---- */}
      <div className="left-panel">
        <div className="camera-wrapper">
          <CameraCapture isStreaming={isStreaming} onEmotionDetected={handleEmotionDetected} />

          {/* Selector de modelo — oculto, se usa solo YOLO */}
          <div className="camera-model-badge" style={{ display: "none" }}>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
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
                    onClick={() => {
                      playAudio(p.label);
                      setSelectedIndex(selectedIndex === index ? null : index);
                    }}
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

        {/* 2. Caja resultado: emoción confirmada en español, o pictograma seleccionado con imagen+texto */}
        <div
          className="emotion-box-footer"
          style={{ cursor: selectedIndex !== null ? "pointer" : "default" }}
          onClick={() => {
            if (selectedIndex !== null && currentPictograms[selectedIndex]) {
              playAudio(currentPictograms[selectedIndex].label);
            }
          }}
        >
          {selectedIndex !== null && currentPictograms[selectedIndex] ? (
            <>
              <img
                src={currentPictograms[selectedIndex].src}
                alt={currentPictograms[selectedIndex].label}
                className="emotion-selected-img"
              />
              <span className="emotion-selected-label">{currentPictograms[selectedIndex].label}</span>
            </>
          ) : (
            <span className="emotion-display-text">
              {confirmedEmotion
                ? emotionLabelMap[confirmedEmotion]
                : "Esperando..."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
