import { useEffect, useRef, useState } from "react";
//import { Hands } from "@mediapipe/hands";
//import { Camera } from "@mediapipe/camera_utils";

const SenaPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prediction, setPrediction] = useState<string>("Esperando...");

  useEffect(() => {
    if (!videoRef.current) return;

    const loadScript = (src: string) => {
      return new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const init = async () => {
      // 🔥 cargar en ORDEN
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

      // @ts-ignore
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (results.multiHandLandmarks) {
          console.log("Mano detectada");
        } else {
          console.log("No hay mano");
        }
      });

      // @ts-ignore
      hands.onResults((results) => {
        if (results.multiHandLandmarks) {
          console.log("Mano detectada");
        } else {
          console.log("No hay mano");
        }
      });
    };

    init();
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Detector de Señas</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ border: "2px solid black", borderRadius: "10px" }}
      />

      <h3>{prediction}</h3>
    </div>
  );
};

export default SenaPage;