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

  // Estado para seguimiento facial
  //const [mode, setMode] = useState<'center' | 'calibrating' | 'tracking'>('center');
  const [guideState, setGuideState] = useState<'red' | 'yellow' | 'white' |'green'>('red');
  const [countdown, setCountdown] = useState(5);  const [faceOk, setFaceOk] = useState(false);
  const [calibrationStarted, setCalibrationStarted] = useState(false);

  // Centrado de rostro refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceOkRef = useRef(false); // 👈 ESTO ES LA CLAVE

  
  const stableTimeRef = useRef<number | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHoveredRef = useRef<number | null>(null);
  const BACK_BUTTON_ID = -99;

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
      // CASO 1: Es el botón de atrás
      if (id === BACK_BUTTON_ID) {
        setCurrentFolder(null);
        setSelectedId(null);
      } 
      // CASO 2: Es un pictograma normal
      else {
        const selected = pictogramsToShow.find((p) => p.id === id);
        if (selected?.isFolder && selected.content) {
          setCurrentFolder(selected.content);
          setSelectedId(null);
        } else {
          setSelectedId(id);
        }
      }
      
      setAnimatingId(null);
      setHoveredId(null); 
    }, 300); // 3 Segundos// <--- Este tiempo debe coincidir con el de tu CSS (.3s)
  };

  // Helper para obtener el objeto seleccionado actual
  const selectedPictogramObj = selectedId ? findPictogramById(selectedId, PICTOGRAM_LIST) : null;

  // Ref para contar frames estables
  const faceStableFramesRef = useRef(0);

  // Función de Diagnóstico para chequear si la cara está centrada
  const checkFacePosition = () => {
    const landmarks = (window as any).currentFaceLandmarks;
    
    // Si no hay cara, ROJO directo.
    if (!landmarks) {
        faceStableFramesRef.current = 0;
        return false;
    }

    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    if (!leftEye || !rightEye) return false;

    const eyesCenterX = (leftEye.x + rightEye.x) / 2;
    const eyesCenterY = (leftEye.y + rightEye.y) / 2;

    // 1. EL RECUADRO DE SEGURIDAD
    // Definimos la zona "buena". Si te sales de aquí, pausa.
    const FACE_BOX = {
      left: 0.40,  
      right: 0.60,
      top: 0.45,
      bottom: 0.65
    };

    const isInside =
      eyesCenterX > FACE_BOX.left &&
      eyesCenterX < FACE_BOX.right &&
      eyesCenterY > FACE_BOX.top &&
      eyesCenterY < FACE_BOX.bottom;

    if (isInside) {
      // ✅ ESTÁS DENTRO: Sumamos confianza
      faceStableFramesRef.current += 1;
      
      // Exigimos 10 frames seguidos (aprox 0.3 segundos) para quitar la pausa.
      // Esto evita que se desbloquee por error si solo pasaste rápido.
      if (faceStableFramesRef.current > 50) {
          return true; // SEMÁFORO VERDE
      }
      return false; // Aún esperando estabilidad...
      
    } else {
      // ❌ TE SALISTE: Reseteamos confianza inmediatamente
      faceStableFramesRef.current = 0;
      console.log("⚠️ Usuario fuera de posición -> PAUSA");
      return false; // SEMÁFORO ROJO
    }
  };

  // ======================================
  // 🔹 EyeGestures: carga e inicialización
  // ======================================
  useEffect(() => {
    if ((window as any)._eyeGesturesLoaded) return;
      (window as any)._eyeGesturesLoaded = true;
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
        await loadCSS("/libs/eyegestures/eyegestures.css");
        await loadScript("/libs/eyegestures/eyegestures.js");

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
          // 1. Consultamos al semáforo
          const isStableAndCentered = checkFacePosition();
          
          // 2. Guardamos el estado real
          faceOkRef.current = isStableAndCentered;

          // 3. CONTROL DEL OVERLAY (PANTALLA DE CENTRADO)
          // Si el estado cambió, actualizamos la pantalla.
          // Si isStableAndCentered es FALSE -> Se muestra el recuadro rojo (Pausa).
          // Si isStableAndCentered es TRUE -> Se quita el recuadro (Juego).
          //if (faceOk !== isStableAndCentered) {
          //   setFaceOk(isStableAndCentered); 
          //   setGuideState(isStableAndCentered ? "green" : "red");
          //}

          // 4. LA PAUSA
          // Si no tienes luz verde, cortamos aquí.
          // El cursor se queda quieto donde estaba, y el usuario ve el recuadro rojo.
          if (!faceOkRef.current) {
            return; 
          }
          
          const [x, y] = point;

          const px = x > 1 ? x : x * window.innerWidth;
          const py = y > 1 ? y : y * window.innerHeight;

          //if (mode !== 'center') return; // Solo procesar esto si estamos en modo centrado
          const cursor = document.getElementById("cursor") as HTMLElement | null;
          const brush = document.createElement("div");
          if (!cursor || !brush) return;

          // --- POSICIONAMIENTO BÁSICO DEL CURSOR ---
          cursor.style.left = `${px}px`;
          cursor.style.top = `${py}px`;
              
          // 👁️ CAMBIO AQUÍ: Si estamos centrando, ocultamos el cursor real
          // para que solo se vea el HUD técnico.
          cursor.style.opacity = faceOk ? "0.5" : "1";
          cursor.style.display = "block";

          // --- LÓGICA DE CALIBRACION NORMAL ---

          //cursor.style.left = `${px}px`;
          //cursor.style.top = `${py}px`;
          //cursor.style.display = "block";
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
          
          // detectar elementos debajo del cursor
          const elements = document.elementsFromPoint(px, py - window.scrollY);
          const pictogramEl = elements.find((el) =>
            el.classList.contains("pictogram-card")
          ) as HTMLElement | undefined;

          if (pictogramEl) {
            const id = Number(pictogramEl.dataset.id);

            // efecto hover
            if (lastHoveredRef.current !== id) {
              lastHoveredRef.current = id;
              setHoveredId(id);

              // ⭐ Activa animación de borde 3s
              setHoveredId(id);

              if (timerRef.current) clearTimeout(timerRef.current);

              // COINCIDE CON CSS: 3000ms = 3 segundos
              timerRef.current = setTimeout(() => {
                handlePictogramClick(id);
                
                // Opcional: Feedback visual extra (click)
                pictogramEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
              }, 3000); 
            }
          } else {
            setHoveredId(null);
            if (timerRef.current) clearTimeout(timerRef.current);
          }
        };

        const startSafe = () => {
          const videoEl = document.getElementById("video");
          
          if (videoEl) {
            // ¡Video encontrado! Arrancamos seguro
            const gestures = new EG("video", onPoint);
            gestures.start();

            setCalibrationStarted(true);
            (window as any)._eyeGesturesInstance = gestures;
            console.log("🚀 EyeGestures iniciado correctamente (Video detectado)");
          } else {
            // El video aún no existe, esperamos 100ms y probamos de nuevo
            console.warn("⏳ Esperando elemento <video>...");
            setTimeout(startSafe, 100);
          }
        };

        // Llamamos a la función por primera vez
        startSafe();

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
  // 🔹 Efecto de chequeo facial periódico
  // ======================================
  const visualStableRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const isConfirmed = checkFacePosition();

      if (!isConfirmed) {
        visualStableRef.current = 0;
        setFaceOk(false);
        setGuideState("red");
        return;
      }

      visualStableRef.current += 100;

      // ⚪ Primeros 1.5s
      if (visualStableRef.current < 1000) {
        setGuideState("white");
        return;
      }

      // 🟢 Confirmado visible
      setFaceOk(true);
      setGuideState("green");

    }, 100);

    return () => clearInterval(interval);
  }, []);

  // ======================================
  // 🔹 Render principal
  // ======================================
  return (
    
    <div className="eye-tracking-container">

      {/* ✅ NUEVA BARRA DE ESTADO INTEGRADA */}
      <div className="status-bar">
        
        {/* 1. BOTÓN ATRÁS (Solo si estamos dentro de una carpeta) */}
        {currentFolder && (
          <div className="back-card-container">
             <div
                data-id={BACK_BUTTON_ID}
                className={`pictogram-card mini-card
                  ${hoveredId === BACK_BUTTON_ID ? "hovered" : ""}
                  ${animatingId === BACK_BUTTON_ID ? "click-animate" : ""}
                `}
                onMouseEnter={() => handleGazeSelection(BACK_BUTTON_ID)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handlePictogramClick(BACK_BUTTON_ID)}
                style={{ position: "relative", cursor: "pointer" }}
              >
                {/* BORDE DE CARGA (El mismo que las otras tarjetas) */}
                <div className="selection-border"><span></span></div>
                
                {/* Icono o Imagen de Flecha Atrás */}
                {/* Puedes poner <img src="/ruta/flecha.png" /> si prefieres */}
                <span className="back-icon">⬅️</span> 
                <p style={{margin: "5px 0 0 0", fontSize: "12px", fontWeight: "bold"}}>Volver</p>
            </div>
          </div>
        )}

        {/* 2. ÁREA CENTRAL (Mensaje + Imagen Seleccionada) */}
        <div className="status-message-area">
          {selectedId && selectedPictogramObj ? (
            <div className="status-message success">
              {/* Muestra la IMAGEN */}
              <img 
                src={selectedPictogramObj.imagePath} 
                alt={selectedPictogramObj.name} 
                className="selected-preview-img" 
              />
              {/* Muestra el TEXTO */}
              <span>{selectedPictogramObj.name}</span>
              <FiCheckCircle />
            </div>
          ) : (
            <p className="status-message waiting">
              <FiEye style={{marginRight: "10px"}}/> Esperando selección...
            </p>
          )}
        </div>
      </div>

      <div id="status" >Initializing...</div>
      <div id="error" style={{ color: "red" }}></div>

      {/* 🎯 Cursor visual */}
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
            data-id={pictogram.id}
            className={`pictogram-card 
              ${hoveredId === pictogram.id ? "hovered" : ""}
              ${selectedId === pictogram.id ? "selected" : ""}
              ${animatingId === pictogram.id ? "click-animate" : ""}
            `}
            onMouseEnter={() => handleGazeSelection(pictogram.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handlePictogramClick(pictogram.id)}
            style={{ position: "relative" }} /* Importante para posicionar los bordes */
          >
            {/* 👇 AGREGAR ESTO: Elemento visual para la carga de 3 segundos */}
            <div className="selection-border">
                <span></span>
            </div>
            {/* 👆 FIN DEL AGREGADO */}
            <img src={pictogram.imagePath} alt={pictogram.name} className="pictogram-image" />
            <p className="pictogram-name">{pictogram.name}</p>
          </div>
        ))}
      </div>

      {/* 🔳 Overlay de centrado de ojos */}
      <div 
        className="calibration-overlay"
        style={{ 
          // Si faceOk es true (jugando): Escondemos visualmente y permitimos clicks a través
          opacity: faceOk ? 0 : 1,
          visibility: faceOk ? "hidden" : "visible",
          pointerEvents: faceOk ? "none" : "auto", // Importante para poder clickear abajo
          transition: "all 0.5s ease" // Suaviza la desaparición
        }}
      >
          <div className="calibration-window">
            <div className="camera-container-mini">
            <video id="video" autoPlay muted playsInline className="video-mini" />
                <div ref={hudRef} className={`eye-guide-hud-mini ${guideState}`} >
                <div className="scan-line"></div>
                    {/* Esquinas decorativas */}
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>

                    <span className="guide-text-hud">
                      {guideState === 'red' && 'ALINEE SUS OJOS'}
                      {guideState === 'green' && 'POSICIÓN CORRECTA'}
                    </span>
              </div>
            </div>
            
            <div className="instruction-footer">
              <p className="main-instruction">Detección de Rostro</p>
              <p className="sub-instruction">Centre su rostro dentro del recuadro</p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default EyeTrackingPage;
