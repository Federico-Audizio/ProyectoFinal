import React, { useRef, useState, useEffect } from "react";

const emotionLabelEs: Record<string, string> = {
  happy:   "Feliz",
  sad:     "Triste",
  angry:   "Enojado",
  neutral: "Neutral",
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

  // Enviar frame al backend
  const sendImageToBackend = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.emotion) {
        const normalized = data.emotion.toLowerCase();
        setDetectedLabel(emotionLabelEs[normalized] ?? data.emotion);
        onEmotionDetected(data.emotion);
      } else {
        setDetectedLabel("");
        onEmotionDetected(`Error: ${data.error}`);
      }
    } catch {
      setDetectedLabel("");
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
    </div>
  );
};

export default CameraCapture;