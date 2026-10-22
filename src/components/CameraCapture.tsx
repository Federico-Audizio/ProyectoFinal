import React, { useRef, useState, useEffect } from "react";

const emotionLabelEs: Record<string, string> = {
  alegre:  "Alegre",
  triste:  "Triste",
  enojado: "Enojado",
  enojada: "Enojado",
  neutral: "Neutral",
  happy:   "Alegre",
  sad:     "Triste",
  angry:   "Enojado",
};

interface CameraCaptureProps {
  isStreaming: boolean;
  onEmotionDetected: (emotion: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isStreaming, onEmotionDetected }) => {
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef   = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedLabel, setDetectedLabel] = useState<string>("");

  const sendImageToBackend = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/predict-yolo`, {
        method: "POST",
        body: formData,
      });
      if (!activeRef.current) return; // respuesta tardía, ya se detuvo
      const data = await response.json();
      const best = data.best;
      if (best && best.above_threshold) {
        const cls = best.class.toLowerCase();
        setDetectedLabel(emotionLabelEs[cls] ?? best.class);
        onEmotionDetected(best.class);
      } else {
        setDetectedLabel("");
        onEmotionDetected("neutral");
      }
    } catch {
      if (!activeRef.current) return;
      setDetectedLabel("");
      onEmotionDetected("Error en conexión");
    }
  };

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

  const stopAll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setDetectedLabel("");
  };

  // La cámara solo arranca/para junto con isStreaming
  useEffect(() => {
    if (isStreaming) {
      activeRef.current = true;
      setError(null);
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          intervalRef.current = setInterval(captureImage, 2000);
          onEmotionDetected("Detectando...");
        })
        .catch(() => {
          setError("No se pudo acceder a la cámara");
          onEmotionDetected("Error: No se pudo acceder a la cámara.");
        });
    } else {
      activeRef.current = false;
      stopAll();
      onEmotionDetected("Detección detenida.");
    }

    return () => {
      activeRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", borderRadius: "8px", display: "block" }}
      />

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
