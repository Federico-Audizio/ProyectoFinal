import React, { useRef, useState, useEffect } from "react";

interface CameraCaptureProps {
  isStreaming: boolean;
  onEmotionDetected: (emotion: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isStreaming, onEmotionDetected }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  let currentStream: MediaStream | null = null;

  // 📌 Habilitar y detener cámara
  useEffect(() => {
    const enableCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        setError("No se pudo acceder a la cámara");
        console.error("Error al acceder a la cámara:", err);
        onEmotionDetected("Error: No se pudo acceder a la cámara.");
      }
    };

    enableCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId, onEmotionDetected]);

  // 📌 Enviar imagen al backend
  const sendImageToBackend = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Respuesta backend:", data);

      if (data.emotion) {
        onEmotionDetected(data.emotion);
      } else if (data.error) {
        onEmotionDetected(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error enviando imagen al backend:", error);
      onEmotionDetected("Error en conexión");
    }
  };

  // 📌 Capturar frame
  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) sendImageToBackend(blob);
    }, "image/jpeg");
  };

  // 📌 Streaming automático
  useEffect(() => {
    if (isStreaming && !intervalId) {
      const id = setInterval(captureImage, 2000);
      setIntervalId(id);
      onEmotionDetected("Detectando...");
    } else if (!isStreaming && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      onEmotionDetected("Detección detenida.");
    }
  }, [isStreaming, intervalId, onEmotionDetected]);

  return (
    <div className="camera-container">
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      <video ref={videoRef} autoPlay playsInline></video>
    </div>
  );
};

export default CameraCapture;
