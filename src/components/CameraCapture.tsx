import React, { useRef, useState, useEffect } from "react";
// Define un mapeo de emociones a un array de rutas de pictogramas

//  1. Interfaz para almacenar los resultados de la detección
interface DetectionResult {
  emotion: string;
  box: [number, number, number, number];
  image_size: [number, number];
}

interface CameraCaptureProps {
  isStreaming: boolean;
  onEmotionDetected: (emotion: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isStreaming, onEmotionDetected }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [pictograms, setPictograms] = useState<string[]>([]);


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
  }, []);

  // 🎯 4. Lógica para dibujar el recuadro en el canvas
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajustar el tamaño del canvas al del video una vez que el video se cargue
    const handleResize = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    };

    video.addEventListener('loadedmetadata', handleResize);

    window.addEventListener('resize', handleResize);
    handleResize(); // Llamada inicial

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detectionResult && detectionResult.box) {
      // Dimensiones originales de la imagen enviada al backend
      const [originalW, originalH] = detectionResult.image_size;

      // Dimensiones actuales del elemento de video en la pantalla
      const displayW = video.videoWidth;
      const displayH = video.videoHeight;
      
      // Calcular la escala para ajustar las coordenadas
      const scaleX = displayW / originalW;
      const scaleY = displayH / originalH;

      const [Xi, Yi, Xf, Yf] = detectionResult.box;

      // Aplicar la escala
      const scaledX = Xi * scaleX;
      const scaledY = Yi * scaleY;
      const scaledWidth = (Xf - Xi) * scaleX;
      const scaledHeight = (Yf - Yi) * scaleY;
      
      // Dibujar el recuadro
      ctx.strokeStyle = "#00FF00"; // Color verde
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Escribir la emoción
      ctx.fillStyle = "#00FF00";
      ctx.font = "18px Arial";
      ctx.fillText(detectionResult.emotion, scaledX, scaledY > 10 ? scaledY - 5 : 18);
    }
    
    return () => {
        video.removeEventListener('loadedmetadata', handleResize);
        window.removeEventListener('resize', handleResize);
    }

  }, [detectionResult]); // Se ejecuta cada vez que cambia el resultado
  
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

      if (data.box && data.emotion) {
        setDetectionResult(data);
        onEmotionDetected(data.emotion);
      } else {
        setDetectionResult(null);
        onEmotionDetected(`Error: ${data.error}`);
      }
    } catch (error) {
      setDetectionResult(null);
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
    if(!ctx) return;
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
      //setEmotion("Detectando...");
      onEmotionDetected("Detectando...");
    } else if (!isStreaming && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      //setEmotion("Detección detenida.");
      onEmotionDetected("Detección detenida.");
    }
  }, [isStreaming, intervalId, onEmotionDetected]);

  return (
    
      <div className="camera-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        style={{ width: "100%", borderRadius: "8px"}}>
      </video>

      <canvas 
        ref={canvasRef}
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0,
        }}
      ></canvas>
      

    </div>
  );
};

export default CameraCapture;