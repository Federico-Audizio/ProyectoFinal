import React, { useEffect, useRef, useState } from "react";

const CameraCapture = () => {
  // Referencia al elemento <video> para asignar el stream de la cámara
  const videoRef = useRef(null);
  // Estado para manejar posibles errores (ej: usuario no da permiso)
  const [error, setError] = useState(null);

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
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
    </div>
  );
};

export default CameraCapture;

