import React, { useState, useRef, useEffect } from "react";
import "./EyeTrackingPage.css";
import FiEye from "../components/Icons/FiEye";
import FiCheckCircle from "../components/Icons/FiCheckCircle";

// 🎯 1. Interfaz para definir pictogramas
interface Pictogram {
  id: number;
  name: string;
  imagePath: string;
  isFolder?: boolean;
  content?: Pictogram[];
}

// 🎯 2. LISTA DE PICTOGRAMAS
const PICTOGRAM_LIST: Pictogram[] = [
  {
    id: 1,
    name: "Casa",
    imagePath: "/public/pictograms/casa de muñecas.png",
    isFolder: true,
    content: [
      { id: 101, name: "Dormir", imagePath: "/public/pictograms/Casa/dormir.png" },
      { id: 102, name: "Cocina", imagePath: "/public/pictograms/Casa/cocina.png" },
      { id: 103, name: "Baño", imagePath: "/public/pictograms/Casa/baño.png" },
      { id: 104, name: "Jardín", imagePath: "/public/pictograms/Casa/jardín.png" },
    ],
  },
  {
    id: 2,
    name: "Verbos",
    imagePath: "/public/pictograms/Verbos.png",
    isFolder: true,
    content: [
      { id: 201, name: "Escribir", imagePath: "/public/pictograms/Verbos/escribir.png" },
      { id: 202, name: "Pensar", imagePath: "/public/pictograms/Verbos/pensar.png" },
      { id: 203, name: "Pasear", imagePath: "/public/pictograms/Verbos/pasear.png" },
      { id: 204, name: "Romper", imagePath: "/public/pictograms/Verbos/romper.png" },
    ],
  },
  { id: 3, name: "Alegre", imagePath: "/public/pictograms/Estado/alegre.png" },
  { id: 4, name: "Mamá", imagePath: "/public/pictograms/Estado/mamá.png" },
  { id: 5, name: "Comida", imagePath: "/public/pictograms/comer.png" },
  { id: 6, name: "Beber", imagePath: "/public/pictograms/beber.png" },
  { id: 7, name: "Ir al baño", imagePath: "/public/pictograms/baño.png" },
  { id: 8, name: "Ver televisión", imagePath: "/public/pictograms/ver la televisión.png" },

];

const EyeTrackingPage: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Pictogram[] | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHoveredRef = useRef<number | null>(null);

  // 🔹 Función para encontrar pictograma por ID
  const findPictogramById = (id: number, list: Pictogram[]): Pictogram | undefined => {
    for (const pictogram of list) {
      if (pictogram.id === id) return pictogram;
      if (pictogram.content) {
        const found = findPictogramById(id, pictogram.content);
        if (found) return found;
      }
    }
  };

  const pictogramsToShow = currentFolder || PICTOGRAM_LIST;

  // 🔹 Simulación hover por mirada
  const handleGazeSelection = (id: number) => setHoveredId(id);

  // 🔹 Click (o selección futura por mirada)
  const handlePictogramClick = (id: number) => {
    // 1. Evitar dobles clicks si ya se está animando
    if (animatingId === id) return;
    // 2. Activar la animación visual
    setAnimatingId(id);
    // 3. Esperar a que termine la animación (300ms) antes de ejecutar la lógica
    setTimeout(() => {
      const selected = pictogramsToShow.find((p) => p.id === id);
      
      if (selected?.isFolder && selected.content) {
        setCurrentFolder(selected.content);
        setSelectedId(null);
      } else {
        setSelectedId(id);
      }
      // 4. Limpiar el estado de animación
      setAnimatingId(null);
      // Limpiar el hover para que no se quede "pegado" visualmente
      setHoveredId(null); 
    }, 300); // <--- Este tiempo debe coincidir con el de tu CSS (.3s)
  };

  // ======================================
  // 🔹 EyeGestures: carga e inicialización
  // ======================================
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

        // ✅ Cargamos localmente los archivos
        await loadCSS("/eyegestures.css");
        await loadScript("/eyegestures.js");

        // Esperamos a que se monte EyeGestures
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

        // 📍 Actualiza cursor y detecta coordenadas
        const onPoint = (point: number[], calibration: boolean) => {
          const [x, y] = point;
          const cursor = document.getElementById("cursor") as HTMLElement | null;
          const brush = document.createElement("div");
          if (!cursor || !brush) return;

          const px = x > 1 ? x : x * window.innerWidth;
          const py = y > 1 ? y : y * window.innerHeight;

          cursor.style.left = `${px}px`;
          cursor.style.top = `${py}px`;
          cursor.style.display = "block";
          cursor.style.backgroundColor = calibration
            ? "rgba(0, 150, 255, 0.8)"
            : "rgba(0, 150, 255, 0.8)";

          // ⭐ Glow fuerte
          cursor.style.boxShadow = calibration
            ? "0px 0px 22px 12px rgba(0, 150, 255, 0.7)"
            : "0px 0px 22px 12px rgba(0,150,255,0.7)";

          // 🔷 Efecto estela suave
          brush.style.position = "absolute";
          brush.style.left = `${px}px`;
          brush.style.top = `${py}px`;
          brush.style.width = "80px";
          brush.style.height = "80px";
          brush.style.borderRadius = "50%";
          brush.style.zIndex = "1";


          // 💙 Color azul estilo demo (fuerte en el centro, suave afuera)
          brush.style.background =
            "radial-gradient(circle, rgba(0,150,255,0.6) 0%, rgba(0,150,255,0.30) 50%, rgba(0,150,255,0) 100%)";
          // 🔥 Blur suave para que parezca una estela real
          brush.style.filter = "blur(20px)";
          brush.style.pointerEvents = "none";
          brush.style.transform = "translate(-50%, -50%)";
          // ⭐ Transición para que desaparezca lentamente
          brush.style.transition = "opacity 1.2s ease-out";

          // Agregar al contenedor
          document.body.appendChild(brush);
          // 🕒 Después de 20ms, bajamos opacidad para que se desvanezca
          setTimeout(() => {
            brush.style.opacity = "0";
          }, 20);
          // 🗑️ Eliminar la pincelada después de que desaparezca
          setTimeout(() => {
            brush.remove();
          }, 1500);
        

          // 🎯 Aquí luego implementaremos detección de hover sobre pictogramas
          // Verificar qué pictograma está bajo el cursor
          const elements = document.elementsFromPoint(px, py);
          const pictogramEl = elements.find((el) =>
            el.classList.contains("pictogram-card")
          ) as HTMLElement | undefined;

          if (pictogramEl) {
            const id = Number(pictogramEl.dataset.id);
            if (id !== hoveredId) {
              setHoveredId(id);
              // Reinicia temporizador de selección
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                handlePictogramClick(id);
              }, 2000); // 👁️ selección tras 2 s de mirada
            }
          } else {
            setHoveredId(null);
            if (timerRef.current) clearTimeout(timerRef.current);
          }
        };

        const gestures = new EG("video", onPoint);
        gestures.start();
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

  // ======================================
  // 🔹 Render principal
  // ======================================
  return (
    <div className="eye-tracking-container">
      <h1>EyeGesturesLite: Comunicación Asistida</h1>

      {/* 📌 Barra de estado */}
      <div className="status-bar">
        {selectedId ? (
          <p className="status-message success">
            <FiCheckCircle /> Seleccionado: {findPictogramById(selectedId!, PICTOGRAM_LIST)?.name}
          </p>
        ) : (
          <p className="status-message waiting">
            <FiEye /> Esperando selección...
          </p>
        )}
      </div>

      {/* 🔙 Volver atrás */}
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

      {/* 📸 Video oculto + cursor */}
      <video id="video" width="640" height="480" autoPlay style={{ display: "none" }}></video>
      <div id="status" style={{ display: "none" }}>Initializing...</div>
      <div id="error" style={{ display: "none", color: "red" }}></div>

      {/* 🎯 Cursor visual */}
      {/* Cursor principal */}
      <div
        id="cursor"
        style={{
          position: "absolute",
          width: "28px",
          height: "28px",
          backgroundColor: "rgba(0, 150, 255, 0.95)",
          borderRadius: "50%",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          boxShadow: "0px 0px 20px 10px rgba(0, 150, 255, 0.7)",
        }}
      ></div>

      {/* 🔥 Estela estilo pincel (MATCH con EyeGestures) */}
      <div
        id="cursorTrail"
        style={{
          position: "absolute",
          width: "160px",
          height: "160px",
          background:
            "radial-gradient(circle, rgba(0,150,255,0.55) 0%, rgba(0,150,255,0.15) 60%, rgba(0,150,255,0) 100%)",
          borderRadius: "50%",
          filter: "blur(35px)",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          transition: "left 0.35s ease-out, top 0.35s ease-out, opacity 0.4s",
          zIndex: 999,
        }}
      ></div>

      {/* 📦 Cuadrícula de pictogramas */}
      <div className="pictogram-grid-selector">
        {pictogramsToShow.map((pictogram) => (
          <div
            key={pictogram.id}
            className={`pictogram-card 
              ${hoveredId === pictogram.id ? "hovered" : ""}
              ${selectedId === pictogram.id ? "selected" : ""}
              ${animatingId === pictogram.id ? "click-animate" : ""}
              `} 
            onMouseEnter={() => handleGazeSelection(pictogram.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handlePictogramClick(pictogram.id)}
          >
            <img src={pictogram.imagePath} alt={pictogram.name} className="pictogram-image" />
            <p className="pictogram-name">{pictogram.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EyeTrackingPage;