import React, { useRef, useState, useEffect } from "react";

interface DetectionResult {
  emotion: string;
  box: [number, number, number, number];
  image_size: [number, number];
}

interface CameraCaptureProps {
  isStreaming: boolean;
  selectedModel: "keras" | "yolo";
  onEmotionDetected: (emotion: string) => void;
  onDistributionUpdate: (dist: Record<string, number>) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isStreaming,
  selectedModel,
  onEmotionDetected,
  onDistributionUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  // Ref para evitar stale closure en el interval
  const modelRef = useRef(selectedModel);
  useEffect(() => { modelRef.current = selectedModel; }, [selectedModel]);

  let currentStream: MediaStream | null = null;

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
  }, []);

  // Dibujar bounding box en el canvas
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };
    video.addEventListener("loadedmetadata", handleResize);
    window.addEventListener("resize", handleResize);
    handleResize();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detectionResult?.box) {
      const [originalW, originalH] = detectionResult.image_size;
      const displayW = video.videoWidth;
      const displayH = video.videoHeight;
      const scaleX = displayW / originalW;
      const scaleY = displayH / originalH;

      const [Xi, Yi, Xf, Yf] = detectionResult.box;
      const sx = Xi * scaleX;
      const sy = Yi * scaleY;
      const sw = (Xf - Xi) * scaleX;
      const sh = (Yf - Yi) * scaleY;

      // Caja
      ctx.strokeStyle = modelRef.current === "yolo" ? "#FFD700" : "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, sw, sh);

      // Fondo del label
      const label = detectionResult.emotion;
      ctx.font = "bold 16px Arial";
      const textW = ctx.measureText(label).width;
      const labelY = sy > 24 ? sy - 6 : sy + sh + 18;
      ctx.fillStyle = modelRef.current === "yolo" ? "rgba(255,215,0,0.75)" : "rgba(0,200,0,0.75)";
      ctx.fillRect(sx - 2, labelY - 16, textW + 8, 20);

      // Texto
      ctx.fillStyle = "#000";
      ctx.fillText(label, sx + 2, labelY);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [detectionResult]);

  const sendImageToBackend = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    const model = modelRef.current;
    const endpoint = model === "yolo"
      ? "http://localhost:5000/predict-yolo"
      : "http://localhost:5000/predict";

    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const data = await response.json();

      if (model === "yolo") {
        onDistributionUpdate(data.emotion_distribution ?? {});
        if (data.best) {
          const label = `${data.best.class} ${data.best.confidence}%`;
          setDetectionResult({
            emotion: label,
            box: data.best.bbox,
            image_size: data.image_size ?? [640, 480],
          });
          onEmotionDetected(data.best.class);
        } else {
          setDetectionResult(null);
          onEmotionDetected("Esperando detección...");
        }
      } else {
        onDistributionUpdate({});
        if (data.box && data.emotion) {
          setDetectionResult(data);
          onEmotionDetected(data.emotion);
        } else {
          setDetectionResult(null);
          onEmotionDetected(`Error: ${data.error}`);
        }
      }
    } catch (err) {
      setDetectionResult(null);
      console.error("Error enviando imagen al backend:", err);
      onEmotionDetected("Error en conexión");
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (blob) sendImageToBackend(blob); }, "image/jpeg");
  };

  useEffect(() => {
    if (isStreaming && !intervalId) {
      const id = setInterval(captureImage, 2000);
      setIntervalId(id);
      onEmotionDetected("Detectando...");
    } else if (!isStreaming && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      onEmotionDetected("Detección detenida.");
      setDetectionResult(null);
      onDistributionUpdate({});
    }
  }, [isStreaming, intervalId, onEmotionDetected]);

  return (
    <div className="camera-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: "8px" }} />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
};

export default CameraCapture;
