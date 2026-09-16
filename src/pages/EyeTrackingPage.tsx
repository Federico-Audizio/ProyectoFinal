import React, { useState, useRef, useEffect } from "react";
import "./EyeTrackingPage.css";
import FiEye from "../components/Icons/FiEye";
import FiCheckCircle from "../components/Icons/FiCheckCircle";
import { useAudio } from "../hooks/useAudio";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
    name: "Familia",
    imagePath: "/public/pictograms/familia/familia.png",
    isFolder: true,
    content: [
      { id: 101, name: "Mamá", imagePath: "/public/pictograms/Familia/mamá.png" },
      { id: 102, name: "Papá", imagePath: "/public/pictograms/Familia/papá.png" },
      { id: 103, name: "Abuela", imagePath: "/public/pictograms/Familia/abuela.png" },
      { id: 104, name: "Abuelo", imagePath: "/public/pictograms/Familia/abuelo.png" },
      { id: 105, name: "Hermana", imagePath: "/public/pictograms/Familia/niña.png" },
      { id: 106, name: "Hermano", imagePath: "/public/pictograms/Familia/niño.png" },
      { id: 107, name: "Gato", imagePath: "/public/pictograms/Familia/gato.png" },
      { id: 108, name: "Perro", imagePath: "/public/pictograms/Familia/perro.png" }
    ],
  },
  {
    id: 2,
    name: "Necesidades",
    imagePath: "/public/pictograms/Verbos.png",
    isFolder: true,
    content: [
      { id: 201, name: "Defecar", imagePath: "/public/pictograms/Necesidades/cagar.png" },
      { id: 202, name: "Orinar", imagePath: "/public/pictograms/Necesidades/orinar.png" },
      { id: 203, name: "Bañarse", imagePath: "/public/pictograms/Necesidades/ducha.png" },
      { id: 204, name: "Cepillar los dientes", imagePath: "/public/pictograms/Necesidades/cepillar los dientes.png" },
      { id: 205, name: "Lavar la cara", imagePath: "/public/pictograms/Necesidades/lavar la cara.png" },
      { id: 206, name: "Cambiarse", imagePath: "/public/pictograms/Necesidades/Ropa.png" },
      { id: 207, name: "Lavar la ropa", imagePath: "/public/pictograms/Necesidades/lavar la ropa.png" },
      { id: 208, name: "Hospital", imagePath: "/public/pictograms/hospital.png" }
    ],
  },
  { id: 3, name: "Dolor", imagePath: "/public/pictograms/dolor.png",
    isFolder: true,
    content: [
      { id: 301, name: "Dolor de cabeza", imagePath: "/public/pictograms/Dolor/dolor de cabeza.png" },
      { id: 302, name: "Dolor de brazo", imagePath: "/public/pictograms/Dolor/dolor de brazo.png" },
      { id: 303, name: "Dolor de pierna", imagePath: "/public/pictograms/Dolor/dolor de pierna.png" },
      { id: 304, name: "Dolor de estómago", imagePath: "/public/pictograms/Dolor/dolor de estómago.png" },
      { id: 305, name: "Dolor de pecho", imagePath: "/public/pictograms/Dolor/dolor de pecho.png" },
      { id: 306, name: "Dolor de espalda", imagePath: "/public/pictograms/Dolor/dolor de espalda.png" },
      { id: 307, name: "Dolor de muela", imagePath: "/public/pictograms/Dolor/dolor de muela.png" },
      { id: 308, name: "Dolor de oído", imagePath: "/public/pictograms/Dolor/dolor de oído.png" }
    ],
   },
  { id: 4, name: "Emociones", imagePath: "/public/pictograms/¿estás contento.png",
    isFolder: true,
    content: [
      { id: 401, name: "Alegre", imagePath: "/public/pictograms/Estado/alegre.png" },
      { id: 402, name: "Enojado", imagePath: "/public/pictograms/Estado/enfadado.png" },
      { id: 403, name: "Triste", imagePath: "/public/pictograms/Estado/triste.png" },
      { id: 404, name: "Aburrido", imagePath: "/public/pictograms/Estado/aburrido.png" },
      { id: 405, name: "Ansioso", imagePath: "/public/pictograms/Estado/ansioso.png" },
      { id: 406, name: "Emocionado", imagePath: "/public/pictograms/Estado/emocionado.png" },
      { id: 407, name: "Confusión", imagePath: "/public/pictograms/Estado/confusión.png" },
      { id: 408, name: "Sorpresa", imagePath: "/public/pictograms/Estado/sorpresa.png" }
    ],
   },
  { id: 5, name: "Comida", imagePath: "/public/pictograms/comida.png",
    isFolder: true,
    content: [
      { id: 501, name: "Milanesa", imagePath: "/public/pictograms/Comida/milanesa.png" },
      { id: 502, name: "Pollo", imagePath: "/public/pictograms/Comida/pollo.png" },
      { id: 503, name: "Hamburguesa", imagePath: "/public/pictograms/Comida/hamburguesa.png" },
      { id: 504, name: "Pastas", imagePath: "/public/pictograms/Comida/pasta.png" },
      { id: 505, name: "Ensalada", imagePath: "/public/pictograms/Comida/ensalada.png" },
      { id: 506, name: "Pescado", imagePath: "/public/pictograms/Comida/pescado.png" },
      { id: 507, name: "Galleta", imagePath: "/public/pictograms/Comida/galletas.png" }
    ],
   },
  { id: 6, name: "Bebida", imagePath: "/public/pictograms/bebida.png",
    isFolder: true,
    content: [
      { id: 601, name: "Agua", imagePath: "/public/pictograms/Bebida/agua.png" },
      { id: 602, name: "Café", imagePath: "/public/pictograms/Bebida/café.png" },
      { id: 603, name: "Leche", imagePath: "/public/pictograms/Bebida/leche.png" },
      { id: 604, name: "Jugo", imagePath: "/public/pictograms/Bebida/jugo.png" },
      { id: 605, name: "Coca-Cola", imagePath: "/public/pictograms/Bebida/Coca-Cola.png" },
      { id: 606, name: "Mate", imagePath: "/public/pictograms/Bebida/mate.png" }
    ],
   },
  { id: 7, name: "Acciones", imagePath: "/public/pictograms/verbos.png",
    isFolder: true,
    content: [
      { id: 701, name: "Pasear", imagePath: "/public/pictograms/Verbos/pasear.png" },
      { id: 702, name: "Pasear en bicicleta", imagePath: "/public/pictograms/Verbos/pasear en bicicleta.png" },
      { id: 703, name: "Ver la televisión", imagePath: "/public/pictograms/Verbos/ver la televisión.png" },
      { id: 704, name: "Escuchar música", imagePath: "/public/pictograms/Verbos/escuchar música.png" },
      { id: 705, name: "Jugar", imagePath: "/public/pictograms/Verbos/jugar.png" },
      { id: 706, name: "Contar un cuento", imagePath: "/public/pictograms/Verbos/contar un cuento.png"}
    ],
   },
  { id: 8, name: "Lugares", imagePath: "/public/pictograms/lugares.png",
    isFolder: true,
    content: [
      { id: 801, name: "Escuela", imagePath: "/public/pictograms/Lugares/director de escuela.png" },
      { id: 802, name: "Hospital", imagePath: "/public/pictograms/Lugares/hospital.png" },
      { id: 803, name: "Comisaria", imagePath: "/public/pictograms/Lugares/comisaria.png" },
      { id: 804, name: "Parque", imagePath: "/public/pictograms/Lugares/parque.png" },
      { id: 805, name: "Pileta", imagePath: "/public/pictograms/Lugares/piscina.png" },
      { id: 806, name: "Cine", imagePath: "/public/pictograms/Lugares/cine.png" },
      { id: 807, name: "Restaurante", imagePath: "/public/pictograms/Lugares/restaurante.png" },
      { id: 808, name: "Heladería", imagePath: "/public/pictograms/Lugares/heladería.png" }

    ],
   },

];

const EyeTrackingPage: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Pictogram[] | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);
  const { playAudio } = useAudio();

  // Estado para seguimiento facial
  //const [mode, setMode] = useState<'center' | 'calibrating' | 'tracking'>('center');
  const [guideState, setGuideState] = useState<'red' | 'yellow' | 'white' |'green'>('red');
  const [countdown, setCountdown] = useState(5);  const [faceOk, setFaceOk] = useState(false);
  //const [calibrationStarted, setCalibrationStarted] = useState(false);

  // Centrado de rostro refs
  //const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceOkRef        = useRef(false);
  const calibratingRef   = useRef(true);  // true = calibración activa, no permitir selección
  const [isCalibrating,  setIsCalibrating] = useState(true);

  
  //const stableTimeRef = useRef<number | null>(null);
  const hudRef          = useRef<HTMLDivElement>(null);
  const timerRef        = useRef<NodeJS.Timeout | null>(null);
  const lastHoveredRef  = useRef<number | null>(null);
  const hoveredRectRef  = useRef<DOMRect | null>(null);   // rect del pictograma activo
  const TOLERANCE_PX    = 90;  // margen extra en px alrededor del pictograma
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
    // Bloquear si la calibración no terminó
    if (calibratingRef.current) return;
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
          playAudio(selected.name); // Reproducir audio al entrar a carpeta
        } else if (selected) {
          setSelectedId(id);
          playAudio(selected.name);
        }
      }
      
      setAnimatingId(null);
      setHoveredId(null);
      lastHoveredRef.current = null;
      hoveredRectRef.current = null;
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
      left: 0.47,  
      right: 0.53,
      top: 0.50,
      bottom: 0.60
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
  /*🔊 Función para reproducir el audio
  const playAudio = (text: string) => {
  // Convertimos el texto a un nombre de archivo compatible (ej: "Ir al baño" -> "ir_al_baño.mp3")
  // Asegúrate de que coincida con cómo guardaste los archivos en tu script de Polly
  const fileName = text.toLowerCase().replace(/\s+/g, "_") + ".mp3";
  const audioPath = `public/AudioGenerator/audio/es/${fileName}`; 

  const audio = new Audio(audioPath);
  audio.play().catch(err => console.error("Error al reproducir audio:", err));
};*/

// Estados de Accesibilidad (Tamaño de texto e imágenes)
  type SizeOption = "small" | "normal" | "large";
  const [textSize, setTextSize] = useState<SizeOption>("normal");
  const [imageSize, setImageSize] = useState<SizeOption>("normal");
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

  const { user } = useAuth();
  const [isOcularConfigLoaded, setIsOcularConfigLoaded] = useState(false);

  // Cargar configuración desde Firestore al montar
  useEffect(() => {
    if (!user || user.id === "guest") {
      setIsOcularConfigLoaded(true);
      return;
    }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "usuarios", user.id));
        if (snap.exists()) {
          const cfg = snap.data()?.configuracionesOcular;
          if (cfg?.imageSize) setImageSize(cfg.imageSize as SizeOption);
          if (cfg?.textSize) setTextSize(cfg.textSize as SizeOption);
        }
      } catch (e) {
        console.error("Error cargando configuración ocular:", e);
      } finally {
        setIsOcularConfigLoaded(true);
      }
    };
    load();
  }, [user]);

  // Guardar configuración en Firestore solo después de que se cargó la config inicial
  useEffect(() => {
    if (!user || user.id === "guest" || !isOcularConfigLoaded) return;
    const save = async () => {
      try {
        await setDoc(
          doc(db, "usuarios", user.id),
          { configuracionesOcular: { imageSize, textSize } },
          { merge: true }
        );
      } catch (e) {
        console.error("Error guardando configuración ocular:", e);
      }
    };
    save();
  }, [imageSize, textSize, isOcularConfigLoaded]);

  // Función para inyectar estilos dinámicos
  const getDynamicStyles = () => {
    // Configuración de imagen
    let imgSize = "70%"; // normal
    if (imageSize === "small") imgSize = "50%";
    if (imageSize === "large") imgSize = "85%";

    // Configuración de texto
    let txtSize = "1.2rem"; // normal
    if (textSize === "small") txtSize = "1rem";
    if (textSize === "large") txtSize = "1.8rem";

    return {
      "--dynamic-img-size": imgSize,
      "--dynamic-txt-size": txtSize,
    } as React.CSSProperties;
  };

  // ======================================
  // 🔹 EyeGestures: carga e inicialización
  // ======================================
  useEffect(() => {
    //if ((window as any)._eyeGesturesLoaded) return;
    //  (window as any)._eyeGesturesLoaded = true;

    let isMounted = true; // 🔒 Candado para saber si el componente sigue vivo
    let gesturesInstance: any = null; // Referencia local para limpieza segura
    
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

        // 🔒 CHECK 1: Si al terminar de cargar scripts el usuario ya se fue, CANCELAR.
        if (!isMounted) return;
        // Esperamos a que se monte EyeGestures
        const checkReady = () =>
          new Promise<void>((resolve, reject) => {
            let tries = 0;
            const interval = setInterval(() => {
              if ((window as any).EyeGestures) {
                clearInterval(interval);
                resolve();
              } else if (tries++ > 20) { // Un poco más de paciencia
                clearInterval(interval);
                reject(new Error("❌ EyeGestures no se encontró en window"));
              }
            }, 300);
          });

        await checkReady();

        // 🔒 CHECK 2: Si al terminar de esperar la clase el usuario ya se fue, CANCELAR.
        if (!isMounted) return;
        const EG = (window as any).EyeGestures;

        // 📍 Actualiza cursor y detecta coordenadas
        const onPoint = (point: number[], calibration: boolean) => {
          // Actualizar estado de calibración (calibration=true → aún calibrando)
          if (calibratingRef.current !== calibration) {
            calibratingRef.current = calibration;
            setIsCalibrating(calibration);
          }

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
          if (!cursor) return;

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

          // Bloquear selección mientras se calibra
          if (calibratingRef.current) {
            setHoveredId(null);
            if (timerRef.current) clearTimeout(timerRef.current);
            lastHoveredRef.current = null;
            hoveredRectRef.current = null;
            return;
          }

          if (pictogramEl) {
            const id = Number(pictogramEl.dataset.id);

            // Actualizar siempre el rect del elemento activo
            hoveredRectRef.current = pictogramEl.getBoundingClientRect();

            if (lastHoveredRef.current !== id) {
              // Nuevo pictograma: reiniciar timer
              if (timerRef.current) clearTimeout(timerRef.current);
              lastHoveredRef.current = id;
              setHoveredId(id);

              timerRef.current = setTimeout(() => {
                handlePictogramClick(id);
                pictogramEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
              }, 3000);
            }
            // Si es el mismo: no hacer nada, el timer sigue corriendo
          } else {
            // El cursor no está sobre ningún pictograma.
            // Verificar si sigue dentro de la zona de tolerancia del último pictograma.
            const rect = hoveredRectRef.current;
            if (rect && lastHoveredRef.current !== null) {
              const inTolerance =
                px >= rect.left   - TOLERANCE_PX &&
                px <= rect.right  + TOLERANCE_PX &&
                (py - window.scrollY) >= rect.top    - TOLERANCE_PX &&
                (py - window.scrollY) <= rect.bottom + TOLERANCE_PX;

              if (inTolerance) {
                // Pequeño desvío: mantener selección y timer activos
                return;
              }
            }

            // Fuera de la zona de tolerancia: cancelar
            setHoveredId(null);
            lastHoveredRef.current = null;
            hoveredRectRef.current = null;
            if (timerRef.current) clearTimeout(timerRef.current);
          }
        };

        const startSafe = () => {
          // 🔒 CHECK 3: Última verificación antes de crear la instancia
          if (!isMounted) return;

          const videoEl = document.getElementById("video");
          if (videoEl) {
            // 🛑 SI YA EXISTE UNA INSTANCIA PREVIA, MATARLA ANTES DE CREAR OTRA
            if ((window as any)._eyeGesturesInstance) {
                console.warn("⚠️ Encontrada instancia previa. Limpiando...");
                (window as any)._eyeGesturesInstance.stop();
                (window as any)._eyeGesturesInstance = null;
            }

            // AHORA SÍ, CREAR LA NUEVA
            console.log("🚀 Iniciando NUEVA instancia de EyeGestures");
            gesturesInstance = new EG("video", onPoint);
            gesturesInstance.start();
            gesturesInstance.isCalibrationActive = false;

            // Guardar referencia global
            (window as any)._eyeGesturesInstance = gesturesInstance;
          } else {
            if (isMounted) setTimeout(startSafe, 100);
          }
        };

        startSafe();

      } catch (error) {
        console.error("❌ Error al iniciar EyeGestures:", error);
      }
    };

    loadEyeGestures();

    // 🧹 LIMPIEZA AL SALIR DE LA PANTALLA
    return () => {
      console.log("👋 Saliendo de EyeTrackingPage: Limpiando todo...");
      isMounted = false; // 🔒 CERRAR CANDADO: Bloquea cualquier carga pendiente

      // 1. Detener la instancia de EyeGestures (llama al stop() modificado del Paso 1)
      if (gesturesInstance) {
        gesturesInstance.stop();
      } else if ((window as any)._eyeGesturesInstance) {
        (window as any)._eyeGesturesInstance.stop();
      }

      // 2. Limpiar referencias globales
      (window as any)._eyeGesturesInstance = null;

      // 3. Eliminar manualmente elementos residuales por seguridad
      // (Por si el stop() de JS fallara o no se ejecutara a tiempo)
      const elementsToRemove = ["cursor", "calib_cursor", "logoDivEyeGestures", "cursorTrail", "output_canvas"];
      elementsToRemove.forEach(id => document.getElementById(id)?.remove());

      // 4. Detener video del elemento React si aún existe
      const video = document.getElementById("video") as HTMLVideoElement | null;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);
  
  // ======================================
  // 🔹 Efecto de chequeo facial periódico
  // ======================================
  const visualStableRef = useRef(0);
  const calibrationTriggeredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const isConfirmed = checkFacePosition();
      faceOkRef.current = isConfirmed;

      const inst = (window as any)._eyeGesturesInstance;

      // 🔴 CASO 1: USUARIO FUERA DE POSICIÓN
      if (!isConfirmed) {
        visualStableRef.current = 0;
        setFaceOk(false);
        setGuideState("red");

        // PAUSAR CALIBRACIÓN (Si existe la instancia y estaba activa)
        if (inst && calibrationTriggeredRef.current === true) {
            console.log("⏸️ Usuario perdido: Pausando calibración");
            // Accedemos directamente a la propiedad para pausar el cálculo interno
            inst.isCalibrationActive = false; 
            
            // Ocultamos el cursor de calibración (punto rojo) si existe
            const calibCursor = document.getElementById("calib_cursor");
            if (calibCursor) calibCursor.style.display = "none";
            
            calibrationTriggeredRef.current = false;
        }
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

      if (inst && calibrationTriggeredRef.current === false) {
        //const inst = (window as any)._eyeGesturesInstance;
        
        // Verificamos que la instancia y el nuevo método existan
        if (typeof inst.startCalibrationNow === 'function') {
           inst.startCalibrationNow();
           //calibrationTriggeredRef.current = true; // Marcamos para no llamarlo mil veces
           //setCalibrationStarted(true); // Tu estado visual de React
        }else {
          inst.isCalibrationActive = true; // Método alternativo
        }
        calibrationTriggeredRef.current = true;
      }

    }, 100);

    return () => clearInterval(interval);
  }, []);

  // ======================================
  // 🔹 Render principal
  // ======================================
  return (
    
    <div className="eye-tracking-container" style={getDynamicStyles()}>

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

      {/*<div id="status" >Initializing...</div>
      <div id="error" style={{ color: "red" }}></div>*/}

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
          zIndex: 50,
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

      {/* Banner "calibrando" visible sobre la grilla cuando cara OK pero aún calibrando */}
      {faceOk && isCalibrating && (
        <div className="calibrating-banner">
          <span className="calibrating-dot" />
          Calibrando mirada… Seguí el punto con los ojos
        </div>
      )}

      {/* 📦 Cuadrícula de pictogramas */}
      <div className={`pictogram-grid-selector ${isCalibrating ? "grid-blocked" : ""}`}>
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
          }}>
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
              
              <div className="instruction-footer"  style={{position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '50px' }}>
                <p className="main-instruction">Detección de Rostro</p>
                <p className="sub-instruction">Centre su rostro dentro del recuadro</p>

                <button
                  className="hud-settings-btn"
                  onClick={() => setIsSizeModalOpen(true)}
                  title="Configurar Tamaño"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"/>
                    <polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/>
                    <line x1="3"  y1="21" x2="10" y2="14"/>
                  </svg>
                </button>
                
              </div>
            </div>
          </div>

          {isSizeModalOpen && (
          <div className="calibration-overlay" style={{ zIndex: 300, opacity: 1, visibility: 'visible', pointerEvents: 'auto' }}>
            <div className="eye-config-modal-content">
              <button className="eye-config-close-btn" onClick={() => setIsSizeModalOpen(false)}>×</button>
              <h2 className="eye-config-modal-title">Personalización Visual</h2>
              
              <div className="eye-config-section">
                <p className="eye-config-label">Tamaño de los Pictogramas</p>
                <div className="eye-config-segmented">
                  <button className={`segment ${imageSize === "small" ? "active" : ""}`} onClick={() => setImageSize("small")}>Pequeño</button>
                  <button className={`segment ${imageSize === "normal" ? "active" : ""}`} onClick={() => setImageSize("normal")}>Normal</button>
                  <button className={`segment ${imageSize === "large" ? "active" : ""}`} onClick={() => setImageSize("large")}>Grande</button>
                </div>
              </div>

              <div className="eye-config-section">
                <p className="eye-config-label">Tamaño del Texto</p>
                <div className="eye-config-segmented">
                  <button className={`segment ${textSize === "small" ? "active" : ""}`} onClick={() => setTextSize("small")}>Pequeño</button>
                  <button className={`segment ${textSize === "normal" ? "active" : ""}`} onClick={() => setTextSize("normal")}>Normal</button>
                  <button className={`segment ${textSize === "large" ? "active" : ""}`} onClick={() => setTextSize("large")}>Grande</button>
                </div>
              </div>

              {/* Vista previa en tiempo real adaptada para seguimiento ocular */}
              <div className="eye-config-preview-box">
                <p className="eye-config-preview-title">Vista Previa</p>
                <div className="eye-config-preview-card">
                  <img src="/public/pictograms/bebida.png" alt="preview" className="pictogram-image" />                </div>
                  <p className="pictogram-name">Ejemplo</p>
              </div>
              
              <button className="eye-config-save-btn" onClick={() => setIsSizeModalOpen(false)}>Guardar cambios</button>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default EyeTrackingPage;
