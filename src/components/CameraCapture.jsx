import React, { useRef, useState, useEffect } from "react";
import "./CameraCapture.css";

const CameraCapture = () => {
  // Referencia al elemento <video> para asignar el stream de la cámara
  const videoRef = useRef(null);
  // Estado para manejar posibles errores (ej: usuario no da permiso)
  const [error, setError] = useState(null);
  const [intervalId, setIntervalId] = useState(null);


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
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  // Enviar imagen al backend
  const sendImageToBackend = async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");
    //frame_count = 0
    //frame_skip=10
    try {
      const response = await fetch("http://localhost:5000/predict",{
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
                   throw new Error(`Error del servidor: ${response.statusText}`);
                }

      const data = await response.json();
      console.log("Respuesta backend:", data);
      if (data.emotion) {
        alert(`Emoción detectada: ${data.emotion}`);
      }else if (data.error) {
        alert(`Error del servidor: ${data.error}`);
      }
      //alert(`Emoción detectada: ${data.emotion}`);
    } catch (error) {
      console.error("Error enviando imagen al backend:", error);
    }
  };

  // Capturar frame
  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    //cap = Canvas.video()
    //frame_count = 0
    
    //try{
    //  while (True)
    //    ret, frame = cap.read()
     //       ret, frame = cap.read()

            //Solo enviamos 1 de cada N frames para no saturar la API
            //  if (frame_count % frame_skip == 0)
             //     img_encoded = cv2.imencode('.jpg', frame)
             //     files = {'image': ('frame.jpg', img_encoded.tobytes(), 'image/jpeg')}
    //}
        
    canvas.toBlob((blob) => {
      if (blob) {
        sendImageToBackend(blob);
      }
    }, "image/jpeg");
  };

  // Iniciar captura automática
  const startStreaming = () => {
    if (!intervalId) {
      const id = setInterval(captureImage, 5000); // 1 frame/seg
      setIntervalId(id);
    }
  };

  // Detener captura automática
  const stopStreaming = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
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
      <button onClick={startStreaming} style={{ marginTop: "10px" }}>
        ▶️ Iniciar detección en tiempo real
      </button>
      <button onClick={stopStreaming} style={{ marginTop: "10px", marginLeft: "10px" }}>
        ⏹️ Detener
      </button>
    </div>
  );
};

export default CameraCapture;
