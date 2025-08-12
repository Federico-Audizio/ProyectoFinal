import React, { useRef, useState, useEffect } from "react";

const CameraCapture = () => {
  // Referencia al elemento <video> para asignar el stream de la cámara
  const videoRef = useRef(null);
  // Estado para manejar posibles errores (ej: usuario no da permiso)
  const [error, setError] = useState(null);

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

    // Cleanup: cuando el componente se desmonta, detiene la cámara
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 📌 Función para enviar imagen al backend
  const sendImageToBackend = async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      alert(`Emoción detectada: ${data.emotion}`);
    } catch (error) {
      console.error("Error enviando imagen al backend:", error);
    }
  };

  // 📌 Capturar un frame del video
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
    <div style={{ textAlign: "center" }}>
      <h3>Captura en tiempo real</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", maxWidth: "500px", borderRadius: "10px" }}
      />
      <br />
      <button onClick={captureImage} style={{ marginTop: "10px" }}>
        Capturar y detectar emoción
      </button>
    </div>
  );
};

export default CameraCapture;

