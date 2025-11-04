import React, { useEffect } from "react";

const EyeTrackingPage: React.FC = () => {
  useEffect(() => {
    const loadEyeGestures = async () => {
      try {
        console.log("🔹 Cargando EyeGestures...");

        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) return resolve();
            const s = document.createElement("script");
            s.src = src;
            s.async = false;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Error cargando script ${src}`));
            document.body.appendChild(s);
          });

        const loadCSS = (href: string) =>
          new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`link[href="${href}"]`);
            if (existing) return resolve();
            const l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = href;
            l.onload = () => resolve();
            l.onerror = () => reject(new Error(`Error cargando CSS ${href}`));
            document.head.appendChild(l);
          });

        // ✅ Cargamos tus archivos locales
        await loadCSS("/eyegestures.css");
        await loadScript("/eyegestures.js");

        // Esperamos que la clase esté disponible
        const checkReady = () =>
          new Promise<void>((resolve, reject) => {
            let tries = 0;
            const interval = setInterval(() => {
              if ((window as any).EyeGestures) {
                clearInterval(interval);
                resolve();
              } else if (tries++ > 10) {
                clearInterval(interval);
                reject(new Error("❌ EyeGestures no se encontró en window"));
              }
            }, 300);
          });

        await checkReady();

        const EG = (window as any).EyeGestures;
        console.log("✅ EyeGestures detectado:", EG);

        const onPoint = (point: number[], calibration: boolean) => {
          const [x, y] = point;
          const cursor = document.getElementById("cursor") as HTMLElement | null;
          if (!cursor) return;

          // Si los valores son mayores a 1, asumimos que son píxeles reales
          const px = x > 1 ? x : x * window.innerWidth;
          const py = y > 1 ? y : y * window.innerHeight;

          cursor.style.left = `${px}px`;
          cursor.style.top = `${py}px`;
          cursor.style.display = "block";

          // Cambia color según calibración
          cursor.style.backgroundColor = calibration
            ? "rgba(0, 255, 0, 0.8)" // verde mientras calibra
            : "rgba(0, 150, 255, 0.8)"; // azul normal
        };
        // ✅ Inicia automáticamente
        const gestures = new EG("video", onPoint);
        gestures.start();

        // 🔹 Forzar a mostrar el puntero azul creado por la librería
        const cursorScript = document.getElementById("cursor");
        if (cursorScript) cursorScript.style.display = "block";

        (window as any)._eyeGesturesInstance = gestures;

        console.log("🚀 EyeGestures iniciado automáticamente");

      } catch (error) {
        console.error("❌ Error al iniciar EyeGestures:", error);
      }
    };

    loadEyeGestures();

    return () => {
      console.log("🧹 Limpiando EyeGestures...");
      try {
        const inst = (window as any)._eyeGesturesInstance;
        if (inst && typeof inst.stop === "function") inst.stop();
      } catch (e) {
        console.warn("Error deteniendo EyeGestures instance", e);
      }

      const video = document.getElementById("video") as HTMLVideoElement | null;
      if (video && video.srcObject) {
        try {
          const s = video.srcObject as MediaStream;
          s.getTracks().forEach((t) => t.stop());
        } catch (e) {
          console.warn("Error deteniendo tracks de video", e);
        }
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#111",
        overflow: "hidden",
      }}
    >
      <video
        id="video"
        width="640"
        height="480"
        autoPlay
        style={{ display: "none" }}
      ></video>

      <div id="status" style={{ display: "none" }}>
        Initializing...
      </div>
      <div id="error" style={{ display: "none", color: "red" }}></div>

      {/* Cursor visual */}
      <div
        id="cursor"
        style={{
          position: "absolute",
          width: "20px",
          height: "20px",
          backgroundColor: "rgba(0, 150, 255, 0.8)",
          borderRadius: "50%",
          pointerEvents: "none",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          transition: "left 0.05s linear, top 0.05s linear",
        }}
      ></div>
    </div>
  );
};

export default EyeTrackingPage;
