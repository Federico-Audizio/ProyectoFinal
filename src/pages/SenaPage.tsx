import { useEffect, useRef, useState } from "react";

const SenaPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prediction, setPrediction] = useState<string>("Revisando sistema...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let camera: any = null;
    let active = true;

    const log = (msg: string) => console.log(`[CameraLog] ${msg}`);

    const init = async () => {
      try {
        log("1. Verificando acceso a hardware...");
        // Esto fuerza al navegador a pedir permiso INMEDIATAMENTE
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        log("Permiso concedido. Stream obtenido.");
        
        // Detenemos este stream temporal para que MediaPipe pueda tomar el control después
        stream.getTracks().forEach(track => track.stop());

        log("2. Cargando scripts de MediaPipe...");
        const scripts = [
          { src: "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js", id: "mp-hands" },
          { src: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js", id: "mp-camera" },
          { src: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js", id: "mp-drawing" }
        ];

        for (const s of scripts) {
          if (!document.getElementById(s.id)) {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.id = s.id;
              script.src = s.src;
              script.onload = resolve;
              script.onerror = reject;
              document.body.appendChild(script);
            });
          }
        }
        log("Scripts cargados correctamente.");

        if (!active || !videoRef.current || !canvasRef.current) return;

        // @ts-ignore
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (!canvasRef.current || !active) return;
          const canvasCtx = canvasRef.current.getContext("2d")!;
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // 1. Extraer keypoints de la primera mano detectada
            const hand = results.multiHandLandmarks[0];
            
            // Convertir 21 puntos (x, y, z) en un array plano de 63 números
            const keypoints = hand.flatMap((point: any) => [point.x, point.y, point.z]);

            // 2. Enviar a tu API de Flask
            sendToBackend(keypoints);

            // 3. Dibujar (como ya lo hacías)
            for (const landmarks of results.multiHandLandmarks) {
              // @ts-ignore
              window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: "#00FF00" });
              // @ts-ignore
              window.drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", radius: 2 });
            }
          }
        });

        log("3. Iniciando Camera Utils...");
        // @ts-ignore
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (active && videoRef.current) await hands.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });

        await camera.start();
        log("Cámara iniciada con éxito.");
        setPrediction("Sistema listo");

      } catch (err: any) {
        console.error("ERROR CRÍTICO:", err);
        setError(err.message || "Error desconocido");
        setPrediction("Error al iniciar");
      }
    };

    // Función para enviar los datos
    const sendToBackend = async (keypoints: number[]) => {
      try {
        const response = await fetch("http://localhost:5000/predict-lsa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keypoints })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.prediction !== null && data.prediction !== undefined) {
          setPrediction(`Seña detectada: ${data.prediction}`);
        } else {
          setPrediction(`Capturando... (${data.frames}/30)`);
        }
      } catch (err) {
        console.error("Error enviando a backend:", err);
      }
    };

    init();

    return () => {
      active = false;
      if (camera) camera.stop();
    };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Prueba de Cámara LSA-T</h2>
      
      {error && (
        <div style={{ color: "red", background: "#fee", padding: "10px", marginBottom: "10px" }}>
          <b>Error:</b> {error}
          <br />
          <small>Revisa si estás en HTTPS o Localhost</small>
        </div>
      )}

      <div style={{ position: "relative", width: "640px", height: "480px", margin: "auto", background: "#000" }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }} />
        <canvas ref={canvasRef} width="640" height="480" style={{ position: "absolute", top: 0, left: 0, transform: "scaleX(-1)" }} />
      </div>
      
      <h3>{prediction}</h3>
    </div>
  );
};

export default SenaPage;