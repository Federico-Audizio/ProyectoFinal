import React, { useRef, useState, useEffect } from "react";

const emotionLabelEs: Record<string, string> = {
  alegre:  "Alegre",
  triste:  "Triste",
  enojado: "Enojado",
  enojada: "Enojado",
  neutral: "Neutral",
  // por si el modelo devuelve inglés
  happy:   "Alegre",
  sad:     "Triste",
  angry:   "Enojado",
};

interface CameraCaptureProps {
  isStreaming: boolean;
  onEmotionDetected: (emotion: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isStreaming, onEmotionDetected }) => {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [detectedLabel, setDetectedLabel] = useState<string>("");
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [bestDebug, setBestDebug] = useState<{cls: string; conf: number; above: boolean} | null>(null);

  // Iniciar cámara al montar
  useEffect(() => {
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError("No se pudo acceder a la cámara");
        onEmotionDetected("Error: No se pudo acceder a la cámara.");
      }
    };
    enableCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Enviar frame al backend (YOLO)
  const sendImageToBackend = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");
    try {
      const response = await fetch("http://localhost:5000/predict-yolo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const best = data.best;
      setDistribution(data.emotion_distribution ?? {});
      if (best) {
        setBestDebug({ cls: best.class, conf: best.confidence, above: best.above_threshold });
      }
      if (best && best.above_threshold) {
        const cls = best.class.toLowerCase();
        setDetectedLabel(emotionLabelEs[cls] ?? best.class);
        onEmotionDetected(best.class);
      } else {
        setDetectedLabel("");
        onEmotionDetected("neutral");
      }
    } catch {
      setDetectedLabel("");
      setDistribution({});
      onEmotionDetected("Error en conexión");
    }
  };

  // Capturar frame del video
  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => { if (blob) sendImageToBackend(blob); }, "image/jpeg");
  };

  // Arrancar / parar intervalo de captura
  useEffect(() => {
    if (isStreaming && !intervalId) {
      const id = setInterval(captureImage, 2000);
      setIntervalId(id);
      onEmotionDetected("Detectando...");
    } else if (!isStreaming && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setDetectedLabel("");
      onEmotionDetected("Detección detenida.");
    }
  }, [isStreaming, intervalId, onEmotionDetected]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", borderRadius: "8px", display: "block" }}
      />

      {/* Badge de emoción en la parte superior */}
      {detectedLabel && (
        <div style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%) scaleX(-1)",
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          padding: "4px 18px",
          borderRadius: "20px",
          fontSize: "18px",
          fontWeight: 700,
          pointerEvents: "none",
          backdropFilter: "blur(4px)",
          whiteSpace: "nowrap",
        }}>
          {detectedLabel}
        </div>
      )}

      {/* Panel de porcentajes (esquina inferior derecha, contra-espejo) */}
      {Object.keys(distribution).length > 0 && (
        <div style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          transform: "scaleX(-1)",
          background: "rgba(0,0,0,0.60)",
          color: "#fff",
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "13px",
          lineHeight: "1.7",
          pointerEvents: "none",
          backdropFilter: "blur(4px)",
          minWidth: "130px",
        }}>
          {bestDebug && (
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", marginBottom: "4px", paddingBottom: "4px", fontSize: "11px", color: bestDebug.above ? "#6eff6e" : "#ff8080" }}>
              best: {bestDebug.cls} {bestDebug.conf.toFixed(1)}% {bestDebug.above ? "✓" : "✗"}
            </div>
          )}
          {Object.entries(distribution).map(([cls, pct]) => (
            <div key={cls} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <span>{emotionLabelEs[cls.toLowerCase()] ?? cls}</span>
              <span style={{ fontWeight: 700, color: pct >= 60 ? "#6eff6e" : pct >= 55 ? "#ffe76e" : "#fff" }}>
                {pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;