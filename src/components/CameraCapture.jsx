import React, { useRef, useState, useEffect } from "react";
import "./CameraCapture.css";

const CameraCapture = () => {
  // Referencia al elemento <video> para asignar el stream de la cámara
  const videoRef = useRef(null);
  // Estado para manejar posibles errores (ej: usuario no da permiso)
  const [error, setError] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState("");

  // 📌 Habilitar cámara
  useEffect(() => {
    // Función asincrónica para habilitar la cámara
    const enableCamera = async () => {
      try {
        // Solicita acceso a la cámara del dispositivo
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Asigna el stream al elemento de video si está disponible
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        // Manejo de errores si el usuario bloquea la cámara o hay falla
        setError("No se pudo acceder a la cámara");
        console.error("Error al acceder a la cámara:", err);
      }
    };

    enableCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Enviar imagen al backend
  const sendImageToBackend = async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setDetectedEmotion(data.emotion);
    } catch (error) {
      console.error("Error enviando imagen al backend:", error);
    }
  };

  // Capturar frame
  const captureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        sendImageToBackend(blob);
      }
    }, "image/jpeg");
  };

  return (
    <div className="camera-container">
      <div className="video-wrapper">
        {error && <p className="error">{error}</p>}
        <video ref={videoRef} autoPlay playsInline muted />
      </div>

      <div className="emotion-button">
        <button onClick={captureImage}>
          {detectedEmotion || "Detectar emoción"}
        </button>
      </div>

      <div className="pictograms-container">
        {["Pictograma 1", "Pictograma 2", "Pictograma 3", "Pictograma 4"].map(
          (text, idx) => (
            <div
              key={idx}
              className={`pictogram-card ${
                detectedEmotion &&
                text.toLowerCase().includes(detectedEmotion.toLowerCase())
                  ? "active"
                  : ""
              }`}
            >
              {text}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
