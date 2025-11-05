<<<<<<< HEAD
import React, { useState } from "react";
// 🚨 Importa los estilos de la nueva página. Necesitarás crear este archivo.
import "./EyeTrackingPage.css"; 
import FiEye from "../components/Icons/FiEye"; 
import FiCheckCircle from "../components/Icons/FiCheckCircle";

// 🎯 1. Interfaz para definir la estructura de cada pictograma
interface Pictogram {
  id: number;
  name: string;
  imagePath: string;
  isFolder?: boolean;
  content?: Pictogram[];
}

// 🎯 2. LISTA DE PICTOGRAMAS (Simulando los de tu imagen EyeGesturesLite)
// Asume que las imágenes están en /public/pictograms/general/
const PICTOGRAM_LIST = [
  { id: 1, label:"Casa", name: "Casa", imagePath: "/public/pictograms/Casa.png", isFolder: true, content: [
      { id: 101, label:"Dormir", name: "Dormir", imagePath: "/public/pictograms/Casa/dormir.png" },
      { id: 102, label:"Cocina", name: "Cocina", imagePath: "/public/pictograms/Casa/cocina.png" },
      { id: 103, label:"Baño", name: "Baño", imagePath: "/public/pictograms/Casa/baño.png" },
      { id: 104, label:"Jardín", name: "Jardín", imagePath: "/public/pictograms/Casa/jardín.png" },
    ]
  },
  { id: 2, label:"Verbos", name: "Verbos", imagePath: "/public/pictograms/Verbos.png", isFolder: true, content: [
      { id: 201, label:"Escribir", name: "Escribir", imagePath: "/public/pictograms/Verbos/escribir.png" },
      { id: 202, label:"Pensar", name: "Pensar", imagePath: "/public/pictograms/Verbos/pensar.png" },
      { id: 203, label:"Pasear", name: "Pasear", imagePath: "/public/pictograms/Verbos/pasear.png" },
      { id: 204, label:"Romper", name: "Romper", imagePath: "/public/pictograms/Verbos/romper.png" },
    ]
  },
  { id: 3, label:"Alegre", name: "Alegre", imagePath: "/public/pictograms/Estado/alegre.png" },
];

// 🎯 3. COMPONENTE PRINCIPAL
const EyeTrackingPage: React.FC = () => {
  // Estado para simular qué pictograma está siendo "mirado" (hovered)
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  // Estado para guardar el pictograma seleccionado de forma definitiva
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Pictogram[] | null>(null);
  // 📌 NOTA: Esta sería la función que recibiría la entrada del modelo de seguimiento ocular
  const handleGazeSelection = (id: number) => {
      setHoveredId(id);
      // Aquí podrías implementar un contador: si 'hoveredId' es el mismo por X tiempo, llamas a setSelectedId(id)
  }
  const pictogramsToShow = currentFolder || PICTOGRAM_LIST;
  // Simulación de una acción al hacer clic (que sería la selección por tiempo de mirada)
  const handlePictogramClick = (id: number) => {
  const selected = (currentFolder || PICTOGRAM_LIST).find(p => p.id === id);
  if (selected?.isFolder && selected.content) {
    setCurrentFolder(selected.content);
  } else {
    setSelectedId(id);
  }

  
};
const findPictogramById = (id: number, list: Pictogram[]): Pictogram | undefined => {
  for (const pictogram of list) {
    if (pictogram.id === id) return pictogram;
    if (pictogram.content) {
      const found = findPictogramById(id, pictogram.content);
      if (found) return found;
    }
  };
}
  return (
    <div className="eye-tracking-container">
      <h1>EyeGesturesLite: Comunicación Asistida</h1>
      
      {/* 📌 BARRA DE ESTADO */}
      <div className="status-bar">
        {selectedId ? (
          <p className="status-message success">
            <FiCheckCircle /> Seleccionado: {findPictogramById(selectedId!, PICTOGRAM_LIST)?.name}
          </p>
        ) : (
          <p className="status-message waiting">
            <FiEye /> Seleccionado: {findPictogramById(selectedId!, PICTOGRAM_LIST)?.name}
          </p>
        )}
      </div>

      {/* 📌 CUADRÍCULA DE PICTOGRAMAS */}
      {/* 🔙 Botón para volver atrás si estás dentro de una carpeta */}
        {currentFolder && (
          <div className="back-button-container">
            <button
              className="back-button"
                onClick={() => {
                  setCurrentFolder(null);
                  setSelectedId(null);
                }}
              >
                ⬅ Volver
            </button>
          </div>
        )}
      <div className="pictogram-grid-selector">
        {pictogramsToShow.map((pictogram) => (
          <div
            key={pictogram.id}
            className={`pictogram-card 
              ${hoveredId === pictogram.id ? "hovered" : ""}
              ${selectedId === pictogram.id ? "selected" : ""}`}
            onMouseEnter={() => handleGazeSelection(pictogram.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handlePictogramClick(pictogram.id)}
          >
            <img src={pictogram.imagePath} alt={pictogram.name} className="pictogram-image" />
            <p className="pictogram-name">{pictogram.name}</p>
          </div>
        ))}
      </div>
=======
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
>>>>>>> f0ccab6d6fb1c6cbc96567e7dd4d6b66a586252d
    </div>
  );
};

<<<<<<< HEAD
export default EyeTrackingPage;
=======
export default EyeTrackingPage;
>>>>>>> f0ccab6d6fb1c6cbc96567e7dd4d6b66a586252d
