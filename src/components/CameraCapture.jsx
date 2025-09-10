import React, { useRef, useState, useEffect } from "react";
import "./CameraCapture.css";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [model, setModel] = useState("keras"); // 👈 Estado para elegir modelo
  const [result, setResult] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState(null);


  // 📌 Habilitar cámara
  useEffect(() => {
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
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

  // 📌 Enviar imagen al backend
  const sendImageToBackend = async (blob) => {
  const formData = new FormData();
  formData.append("image", blob, "capture.jpg");

  try {
    const response = await fetch("http://localhost:5000/predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Respuesta backend:", data);

    if (data.emotion) {
      setDetectedEmotion(data.emotion); // 👈 actualizamos la emoción
    } else if (data.error) {
      setDetectedEmotion(`Error: ${data.error}`);
    }
    if (data.box && data.image_size) {
      const [x1, y1, x2, y2] = data.box;
      //const [origW, origH] = data.image_size;

      const canvas = document.getElementById("overlay");
      const ctx = canvas.getContext("2d");
      

      // ajustar tamaño del canvas al video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // dibujar rectángulo
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // mostrar emoción y confianza arriba del recuadro
      ctx.fillStyle = "red";
      ctx.font = "20px Arial";
      ctx.fillText(`${data.emotion} (${data.confidence.toFixed(1)}%)`, x1, y1 - 10);
    }// Ajustar tamaño del canvas al del video
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;

  // Calcular factor de escala
  const scaleX = canvas.width / origW;
  const scaleY = canvas.height / origH;

  // Escalar coordenadas
  const adjX1 = x1 * scaleX;
  const adjY1 = y1 * scaleY;
  const adjX2 = x2 * scaleX;
  const adjY2 = y2 * scaleY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "lime";
  ctx.lineWidth = 3;
  ctx.strokeRect(adjX1, adjY1, adjX2 - adjX1, adjY2 - adjY1);

  ctx.fillStyle = "red";
  ctx.font = "20px Arial";
  ctx.fillText(`${data.emotion} (${data.confidence.toFixed(1)}%)`, adjX1, adjY1 - 10);

  } catch (error) {
    console.error("Error enviando imagen al backend:", error);
    setDetectedEmotion("Error en conexión");
  }
};


  // 📌 Capturar un frame del video
  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) sendImageToBackend(blob);
    }, "image/jpeg");
  };

  // 📌 Iniciar captura automática
  const startStreaming = () => {
    if (!intervalId) {
      const id = setInterval(captureImage, 2000); // cada 2 segundos
      setIntervalId(id);
    }
  };

  // 📌 Detener captura automática
  const stopStreaming = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Detector de Emociones</h3>

      {/* Selector de modelo */}
      <div style={{ marginBottom: "10px" }}>
        <label>Modelo: </label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="keras">Keras (rostro recortado)</option>
          <option value="yolo">YOLO (tiempo real)</option>
        </select>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Cámara */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", maxWidth: "600px", borderRadius: "10px" }}
      />
      <canvas
        id="overlay"
        style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        maxWidth: "600px",
        borderRadius: "10px",
        pointerEvents: "none" // para que no bloquee clicks
        }}
      ></canvas>
      <div 
          style={{
            marginTop: "15px",
            fontSize: "26px",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "10px 20px",
            borderRadius: "12px",
            display: "inline-block"
          }}
        >
          {detectedEmotion ? `😀 Emoción: ${detectedEmotion}` : "Esperando detección..."}
      </div>

      {/* Botones de control */}
      <br />
      <button onClick={startStreaming} style={{ marginTop: "10px" }}>
        ▶️ Iniciar detección
      </button>
      <button
        onClick={stopStreaming}
        style={{ marginTop: "10px", marginLeft: "10px" }}
      >
        ⏹️ Detener
      </button>

      {/* Resultado */}
      {result && (
        <div style={{ marginTop: "20px" }}>
          <h4>Resultado:</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
