import { useEffect, useRef, useState } from "react";
import { useAudio } from "../hooks/useAudio";

import "./SenaPage.css";

// 🎯 DICCIONARIO LSA64: Mapea el número de predicción (0-63) a su palabra
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

const SenaPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [prediction, setPrediction] = useState<string>("Sistema listo");
  const [error, setError] = useState<string | null>(null);
  const frameBufferRef = useRef<number[][]>([]);
  const { playAudio, preloadAudio } = useAudio();

  //let frameCount = 0;

  // Para detectar si la persona está haciendo una seña o no, y contar los frames
  const [hasStarted, setHasStarted] = useState(false); // Controla el botón inicial
  const [isSigning, setIsSigning] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const isSigningRef = useRef(false); // <--- NUEVA
  const predictionRef = useRef("Sistema listo"); // <--- NUEVA
  const prevKeypointsRef = useRef<number[] | null>(null);
  const [topPredictions, setTopPredictions] = useState<any[]>([]);

  // Función auxiliar para actualizar ambos al mismo tiempo
  const updatePrediction = (msg: string) => {
    setPrediction(msg);
    predictionRef.current = msg;
  };

  const getMovement = (prev: number[], curr: number[]) => {
    let total = 0;
    for (let i = 0; i < curr.length; i++) {
      total += Math.abs(curr[i] - prev[i]);
    }
    return total;
  };

  // Extrae los keypoints y asegura que siempre devuelva un array de 126 elementos
  const extractKeypoints = (results: any): number[] => {
    let leftHand = new Array(63).fill(0);
    let rightHand = new Array(63).fill(0);

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label;

        const flatLandmarks = landmarks.flatMap((lm: any) => [lm.x, lm.y, lm.z]);

        if (handedness === 'Left') {
          leftHand = flatLandmarks;
        } else if (handedness === 'Right') {
          rightHand = flatLandmarks;
        }
      }
    }

    return [...leftHand, ...rightHand];
  };


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
            //const hand = results.multiHandLandmarks[0];
            // Convertir 21 puntos (x, y, z) en un array plano de 63 números
            //const rawkeypoints = hand.flatMap((point: any) => [point.x, point.y, point.z]);
            //const keypoints = normalizeKeypoints(rawkeypoints);

            const keypoints = extractKeypoints(results);
            // 2. Enviar a tu API de Flask
            const prev = prevKeypointsRef.current;

            if (prev) {
              const movement = getMovement(prev, keypoints);

              const canCapture = !predictionRef.current.includes("Seña detectada");

              if (movement > 0.02 && canCapture) {
                // 🟢 EMPEZÓ / SIGUE LA SEÑA
                if (!isSigningRef.current) {
                  isSigningRef.current = true;
                  setIsSigning(true);
                  frameBufferRef.current = []; // Limpiamos para una nueva seña
                  console.log("iniciando captura de seña...");
                }

                 // 🔥 BUFFER CONTINUO (SLIDING WINDOW)
                frameBufferRef.current.push(keypoints);

                if (frameBufferRef.current.length > 30) {
                  frameBufferRef.current.shift(); // elimina el más viejo
                }

                setFrameCount(frameBufferRef.current.length);

                // 🚀 Siempre que haya 30 → predice
                if (frameBufferRef.current.length === 30) {
                  sendToBackend([...frameBufferRef.current]);
                }
              } else {
                // 🔴 MANO QUIETA → reset
                //if (isSigning) {
                  //updateIsSigning(false);
                  //frameBufferRef.current = [];
                //}
              }
            }

            prevKeypointsRef.current = keypoints;

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
    const sendToBackend = async (sequence: number[][]) => {
      try {
        const response = await fetch("http://localhost:5000/predict-lsa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence })
        });
        //if (!response.ok) {
          //throw new Error(`HTTP error! status: ${response.status}`);
        //}

        const data = await response.json();
        
        if (data.prediction !== null && data.prediction !== undefined) {
          // Buscamos el numero (ej: 0 ) en la lista y obtenemos el nombre de la seña
          if (data.top5) {

            const best = data.top5[0];
            const bestName = LSA_LABELS[best.class];
            const bestProb = (best.prob * 100).toFixed(1);

            updatePrediction(`Seña detectada: ${bestName} (${bestProb}%)`);

            playAudio(bestName); // Reproducir el audio de la seña detectada
            
            console.log("Top 5 predicciones:");

            data.top5.forEach((p: any) => {
            const name = LSA_LABELS[p.class];
            const prob = (p.prob * 100).toFixed(1);
            console.log(`${name}: ${prob}%`);
          });
        }

          // 🎯 EL REINICIO:
          // Esperamos un momento para que el usuario vea el resultado y limpiamos
          setTimeout(() => {
            updatePrediction("Sistema listo");
            setFrameCount(0);
            updateIsSigning(false);
            frameBufferRef.current = [];
            prevKeypointsRef.current = null; // Olvidamos el movimiento previo
          }, 3000);

          setTopPredictions(data.top5);

        } else {
          updatePrediction("No se reconoció la seña, intenta de nuevo.");
          setTimeout(() => updatePrediction("Sistema listo"), 2000)
        }
      } catch (err) {
        console.error("Error enviando a backend:", err);
      }
    };

    const normalizeKeypoints = (keypoints: number[]) => {
      const base_x = keypoints[0];
      const base_y = keypoints[1];
      const base_z = keypoints[2];

      return keypoints.map((val, i) => {
        if (i % 3 === 0) return val - base_x; // X
        if (i % 3 === 1) return val - base_y; // Y
        return val - base_z;                 // Z
      });
    };

    // Crea una función auxiliar para actualizar ambos
    const updatePrediction = (msg: string) => {
      setPrediction(msg);
      predictionRef.current = msg;
    };

    const updateIsSigning = (val: boolean) => {
      setIsSigning(val);
      isSigningRef.current = val;
    };

    init();

    return () => {
      active = false;
      if (camera) camera.stop();
    };
  }, [hasStarted]);


  return (
    <div className="sena-tracking-container">

      {/* 🔹 ÁREA DE LA CÁMARA */}
      <div className="sena-camera-area">
        <div className="sena-video-wrapper">
          
          {!hasStarted ? (
            /* BOTÓN INTEGRADO EN EL RECUADRO DE LA CÁMARA */
            <div className="sena-placeholder-overlay">
              <button 
                className="btn-activate-camera"
                onClick={() => setHasStarted(true)}
              >
                <span className="icon">📷</span>
                Activar Cámara y Voz
              </button>
            </div>
          ) : (
            /* ELEMENTOS DE LA CÁMARA (Se activan al pulsar) */
            <>
              <div className={`sign-indicator ${isSigning ? "active" : ""}`} />
              
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="sena-video-element" 
              />
              <canvas 
                ref={canvasRef} 
                width="640" 
                height="480" 
                className="sena-canvas-element" 
              />
              
              <div className="sena-tech-hud">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>

              {isSigning && (
                <div className="frame-counter">
                  <div className="frame-text">
                    Capturando seña {frameCount}/30
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(frameCount / 30) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🔹 PANEL INFERIOR (Siempre visible para mantener la estructura) */}
      <div className="sena-bottom-panel">
        {/* ... (Todo el contenido de resultados y topPredictions igual que antes) */}
        <div className="sena-results-area">
          <h2 className="sena-title">Lenguaje de Señas (LSA-T)</h2>
          <div className={`sena-prediction-display ${prediction.includes('Seña detectada') ? 'success' : 'waiting'}`}>
             {topPredictions.map((p, i) => {
                    const name = LSA_LABELS[p.class];
                    const prob = (p.prob * 100).toFixed(1);
                    return (
                      <div key={i} className="top5-item">
                        <div className="top5-label"><span>{name}</span><span>{prob}%</span></div>
                        <div className="top5-bar"><div className="top5-fill" style={{ width: `${prob}%` }} /></div>
                      </div>
                    );
                  })}
          </div>
        </div>
      </div>
    </div>
  );
};
 /* 3. RENDERIZADO CONDICIONAL
  return (
    <div className="sena-tracking-container">
      
      {!hasStarted ? (
        /* PANTALLA INICIAL DE ACCESIBILIDAD 
        <div className="sena-start-overlay">
          <div className="start-card">
            <h1>Asistente LSA</h1>
            <p>Para comenzar, activa la cámara y el sistema de voz.</p>
            <button 
              className="btn-start-assistant"
              onClick={() => setHasStarted(true)}
            >
              Iniciar Asistente
            </button>
          </div>
        </div>
      ) : (
        /* INTERFAZ DE CÁMARA ACTIVA 
        <>
          <div className="sena-camera-area">
            <div className="sena-video-wrapper">
              <div className={`sign-indicator ${isSigning ? "active" : ""}`} />
              <video ref={videoRef} autoPlay playsInline muted className="sena-video-element" />
              <canvas ref={canvasRef} width="640" height="480" className="sena-canvas-element" />
              
              <div className="sena-tech-hud">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>

              {isSigning && (
                <div className="frame-counter">
                  <div className="frame-text">Capturando seña {frameCount}/30</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(frameCount / 30) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sena-bottom-panel">
            {error && <div className="sena-error-message"><b>Error:</b> {error}</div>}
            <div className="sena-results-area">
              <h2 className="sena-title">Lenguaje de Señas (LSA-T)</h2>
              <div className={`sena-prediction-display ${prediction.includes('Seña detectada') ? 'success' : 'waiting'}`}>
                <div className="top5-container">
                  {topPredictions.map((p, i) => {
                    const name = LSA_LABELS[p.class];
                    const prob = (p.prob * 100).toFixed(1);
                    return (
                      <div key={i} className="top5-item">
                        <div className="top5-label"><span>{name}</span><span>{prob}%</span></div>
                        <div className="top5-bar"><div className="top5-fill" style={{ width: `${prob}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};*/

export default SenaPage;