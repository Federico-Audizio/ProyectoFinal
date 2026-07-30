import { useEffect, useRef, useState } from "react";
import { useAudio } from "../hooks/useAudio";
import "./SenaPage.css";

// 🎯 DICCIONARIO LSA64: índice 0-based → nombre
// El backend devuelve clases 1-64, por eso usamos p.class - 1
const LSA_LABELS = [
  "Opaco", "Rojo", "Verde", "Amarillo", "Brillante", "Azul claro", "Bandera", "Rosa",
  "Mujer", "Enemigo", "Hijo", "Hombre", "Lejos", "Cajón", "Nacido", "Aprender",
  "Llamar", "Desnatadora", "Amargo", "Leche dulce", "Leche", "Agua", "Alimento", "Argentina",
  "Uruguay", "País", "Apellido", "Dónde", "Imitar", "Cumpleaños", "Desayuno", "Foto",
  "Hambriento", "Mapa", "Acuñar", "Música", "Barco", "Ninguno", "Nombre", "Paciencia",
  "Perfume", "Sordo", "Trampa", "Arroz", "Parilla", "Dulce", "Chicle", "Espaguetis",
  "Yogur", "Aceptar", "Gracias", "Cerrar", "Aparecer", "Aterrizar", "Atrapar", "Ayuda",
  "Bailar", "Bañarse", "Comprar", "Copiar", "Correr", "Darse cuenta", "Dar", "Encontrar"
];

// ✅ Debe coincidir con SEQUENCE_LENGTH del entrenamiento y del backend
const SEQUENCE_LENGTH = 50;

const SenaPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [prediction, setPrediction] = useState<string>("Sistema listo");
  const [topPredictions, setTopPredictions] = useState<{ class: number; prob: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const frameBufferRef  = useRef<number[][]>([]);
  const isSigningRef    = useRef(false);
  const predictionRef   = useRef("Sistema listo");
  const prevKeypointsRef = useRef<number[] | null>(null);
  const isSendingRef    = useRef(false); // evita envíos solapados

  const { playAudio } = useAudio();

  // ── helpers ────────────────────────────────────────────────
  const updatePrediction = (msg: string) => {
    setPrediction(msg);
    predictionRef.current = msg;
  };

  const updateIsSigning = (val: boolean) => {
    setIsSigning(val);
    isSigningRef.current = val;
  };

  // Extrae keypoints de ambas manos → array de 126 (izq + der)
  const extractKeypoints = (results: any): number[] => {
    let leftHand  = new Array(63).fill(0);
    let rightHand = new Array(63).fill(0);

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks  = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label;
        const flat = landmarks.flatMap((lm: any) => [lm.x, lm.y, lm.z]);

        if (handedness === "Left")  leftHand  = flat;
        else                        rightHand = flat;
      }
    }
    return [...leftHand, ...rightHand]; // 126
  };

  const getMovement = (prev: number[], curr: number[]) =>
    curr.reduce((sum, v, i) => sum + Math.abs(v - prev[i]), 0);

  // ── envío al backend ────────────────────────────────────────
  const sendToBackend = async (sequence: number[][]) => {
    if (isSendingRef.current) return; // evitar llamadas simultáneas
    isSendingRef.current = true;

    try {
      const res = await fetch("http://localhost:5000/predict-lsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence }),
      });

      if (!res.ok) {
        console.error("HTTP error:", res.status);
        updatePrediction("Error de conexión con el servidor");
        return;
      }

      const data = await res.json();

      if (data.error) {
        console.error("Backend error:", data.error);
        updatePrediction("Error: " + data.error);
        return;
      }

      if (data.top5 && data.top5.length > 0) {
        setTopPredictions(data.top5);

        const best     = data.top5[0];
        // ✅ backend devuelve clases 1-64 → convertir a índice 0-based
        const bestName = LSA_LABELS[best.class - 1] ?? `Clase ${best.class}`;
        // ✅ prob ya viene como porcentaje (0-100) del backend
        const bestProb = best.prob.toFixed(1);

        updatePrediction(`Seña detectada: ${bestName} (${bestProb}%)`);
        playAudio(bestName);

        console.log("Top 5:");
        data.top5.forEach((p: any) => {
          console.log(`  ${LSA_LABELS[p.class - 1]}: ${p.prob.toFixed(1)}%`);
        });
      } else {
        updatePrediction("No se reconoció la seña, intentá de nuevo.");
      }
    } catch (err) {
      console.error("Error enviando al backend:", err);
      updatePrediction("Error de red");
    } finally {
      // Reiniciar estado tras 3 segundos
      setTimeout(() => {
        updatePrediction("Sistema listo");
        setFrameCount(0);
        updateIsSigning(false);
        frameBufferRef.current   = [];
        prevKeypointsRef.current = null;
        isSendingRef.current     = false;
      }, 3000);
    }
  };

  // ── efecto principal ────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;

    let camera: any = null;
    let active = true;

    const init = async () => {
      try {
        // Pedir permiso de cámara
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());

        // Cargar scripts MediaPipe
        const scripts = [
          { src: "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",               id: "mp-hands"   },
          { src: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js", id: "mp-camera"  },
          { src: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",id: "mp-drawing" },
        ];

        for (const s of scripts) {
          if (!document.getElementById(s.id)) {
            await new Promise<void>((res, rej) => {
              const el = document.createElement("script");
              el.id = s.id; el.src = s.src;
              el.onload = () => res(); el.onerror = rej;
              document.body.appendChild(el);
            });
          }
        }

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

          const ctx = canvasRef.current.getContext("2d")!;
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.multiHandLandmarks?.length > 0) {
            const keypoints = extractKeypoints(results);
            const prev = prevKeypointsRef.current;

            if (prev) {
              const movement  = getMovement(prev, keypoints);
              const canCapture = !predictionRef.current.includes("Seña detectada");

              if (movement > 0.02 && canCapture) {
                if (!isSigningRef.current) {
                  isSigningRef.current = true;
                  setIsSigning(true);
                  frameBufferRef.current = [];
                }

                // Sliding window de SEQUENCE_LENGTH frames
                frameBufferRef.current.push(keypoints);
                if (frameBufferRef.current.length > SEQUENCE_LENGTH) {
                  frameBufferRef.current.shift();
                }

                setFrameCount(frameBufferRef.current.length);

                // Enviar cuando el buffer está lleno
                if (frameBufferRef.current.length === SEQUENCE_LENGTH && !isSendingRef.current) {
                  sendToBackend([...frameBufferRef.current]);
                }
              }
            }

            prevKeypointsRef.current = keypoints;

            // Dibujar landmarks
            for (const lm of results.multiHandLandmarks) {
              // @ts-ignore
              window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, { color: "#00FF00" });
              // @ts-ignore
              window.drawLandmarks(ctx, lm, { color: "#FF0000", radius: 2 });
            }
          }
        });

        // @ts-ignore
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (active && videoRef.current) await hands.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });

        await camera.start();
        updatePrediction("Sistema listo");

      } catch (err: any) {
        console.error("Error crítico:", err);
        setError(err.message || "Error desconocido");
      }
    };

    init();

    return () => {
      active = false;
      if (camera) camera.stop();
    };
  }, [hasStarted]);

  // ── render ──────────────────────────────────────────────────
  return (
    <div className="sena-tracking-container">

      {/* ÁREA DE CÁMARA */}
      <div className="sena-camera-area">
        <div className="sena-video-wrapper">

          {!hasStarted ? (
            <div className="sena-placeholder-overlay">
              <button className="btn-activate-camera" onClick={() => setHasStarted(true)}>
                <span className="icon">📷</span>
                Activar Cámara y Voz
              </button>
            </div>
          ) : (
            <>
              <div className={`sign-indicator ${isSigning ? "active" : ""}`} />

              <video ref={videoRef} autoPlay playsInline muted className="sena-video-element" />
              <canvas ref={canvasRef} width="640" height="480" className="sena-canvas-element" />

              <div className="sena-tech-hud">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
                <div className="scan-line" />
              </div>

              {isSigning && (
                <div className="frame-counter">
                  <div className="frame-text">
                    Capturando seña {frameCount}/{SEQUENCE_LENGTH}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(frameCount / SEQUENCE_LENGTH) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* PANEL INFERIOR */}
      <div className="sena-bottom-panel">
        {error && (
          <div className="sena-error-message"><b>Error:</b> {error}</div>
        )}

        <div className="sena-results-area">
          <h2 className="sena-title">Lenguaje de Señas (LSA-64)</h2>

          <div className={`sena-prediction-display ${prediction.includes("Seña detectada") ? "success" : "waiting"}`}>
            {prediction}
          </div>

          {/* Top 5 predicciones */}
          {topPredictions.length > 0 && (
            <div className="top5-container">
              {topPredictions.map((p, i) => {
                // ✅ clase 1-based → índice 0-based
                const name = LSA_LABELS[p.class - 1] ?? `Clase ${p.class}`;
                // ✅ prob ya es porcentaje
                const prob = p.prob.toFixed(1);
                return (
                  <div key={i} className="top5-item">
                    <div className="top5-label">
                      <span>{name}</span>
                      <span>{prob}%</span>
                    </div>
                    <div className="top5-bar">
                      <div className="top5-fill" style={{ width: `${prob}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SenaPage;
