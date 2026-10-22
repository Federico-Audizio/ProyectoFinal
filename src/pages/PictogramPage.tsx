import React, { useEffect, useState } from "react";
import PictogramTile from "../components/PictogramTile";
import PictogramModal from "../components/PictogramModal";
import CustomGridEditor from "../components/CustomGridEditor";
import "./PictogramPage.css";
import { useAudio } from "../hooks/useAudio";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

interface SelectedPicto {
  label: string;
  emoji?: string;
  image?: string;
  color: string; 
}

type CommLevel = "simple" | "composed";

const PictogramPage: React.FC = () => {

  // Estados principales
  const [phrase, setPhrase] = useState<SelectedPicto[]>([]);
  const [commLevel, setCommLevel] = useState<CommLevel>("simple");


  const [selected, setSelected] = useState<SelectedPicto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<any[]>([]);
  const [currentFolderLabel, setCurrentFolderLabel] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { playAudio, playPhrase } = useAudio();

  // Estados de Configuración de Accesibilidad (tamaño de letra y pictograma)
  type SizeOption = "small" | "normal" | "large";
  const [textSize, setTextSize] = useState<SizeOption>("normal");
  const [imageSize, setImageSize] = useState<SizeOption>("normal");
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [hiddenPictos, setHiddenPictos] = useState<string[]>([]);
  const [isHideModeActive, setIsHideModeActive] = useState(false);

  const { user } = useAuth();
  const lugaresContent = [
    { label: "Parque", image: "/pictograms/Lugares/parque.png", color: "#FF8000" },
    { label: "Pileta", image: "/pictograms/Lugares/piscina.png", color: "#FF8000" },
    { label: "Cine", image: "/pictograms/Lugares/cine.png", color: "#FF8000" },
    { label: "Restaurante", image: "/pictograms/Lugares/restaurante.png", color: "#FF8000" },
    { label: "Heladería", image: "/pictograms/Lugares/heladería.png", color: "#FF8000" },
    { label: "Comisaría", image: "/pictograms/Lugares/comisaria.png", color: "#FF8000" }
  ];

  // Si estamos en nivel compuesto, le metemos Escuela y Hospital adentro
  if (commLevel === "composed") {
    lugaresContent.unshift(
      { label: "Escuela", image: "/pictograms/Lugares/director de escuela.png", color: "#FF8000" },
      { label: "Hospital", image: "/pictograms/Lugares/hospital.png", color: "#FF8000" }
    );
  }

  const pictograms = [
    { label: "Yo", image: "/pictograms/yo.png", color: "#ffff00ff" },
    // 👇 ESTOS DOS SOLO APARECEN EN MODO COMPUESTO
    ...(commLevel === "composed" ? [
      { label: "Quiero", image: "/pictograms/Conectores/quiero.png", color: "#fa18c2" }, // Asegurá la ruta
      { label: "Conectores", isFolder: true, image: "/pictograms/Conectores/tengo.png", color: "#fa18c2", content: [
        { label: "No quiero", imagePath: "/pictograms/Conectores/no quiero.png", color: "#fa18c2" },
        { label: "Tengo", imagePath: "/pictograms/Conectores/tengo.png", color: "#fa18c2" },
        { label: "Conn", imagePath: "/pictograms/Conectores/_con.png", color: "#fa18c2" },
        { label: "Estoy", imagePath: "/pictograms/Conectores/estoy.png", color: "#fa18c2" },
        { label: "Ir", imagePath: "/pictograms/Conectores/ir.png", color: "#fa18c2" },
        { label: "Necesito", imagePath: "/pictograms/Conectores/necesito.png", color: "#fa18c2" },
        { label: "Tú", imagePath: "/pictograms/Conectores/tu.png", color: "#fa18c2" },
      ]}
    ] : []),
    
    { label: "Sed", image: "/pictograms/beber.png", color: "#00FF00" },
    { label: "Bebida", isFolder: true, image: "/pictograms/bebida.png", color: "#FF8000",
      content: [
        { label: "Agua", imagePath: "/pictograms/Bebida/agua.png", color: "#FF8000" },
        { label: "Café", imagePath: "/pictograms/Bebida/café.png", color: "#FF8000" },
        { label: "Leche", imagePath: "/pictograms/Bebida/leche.png", color: "#FF8000" },
        { label: "Jugo", imagePath: "/pictograms/Bebida/jugo.png", color: "#FF8000" },
        { label: "Coca-Cola", imagePath: "/pictograms/Bebida/coca-cola.png", color: "#FF8000" },
        { label: "Mate", imagePath: "/pictograms/Bebida/mate.png", color: "#FF8000" },
      ]
     },
    { label: "Hambre", image: "/pictograms/comer.png", color: "#00FF00" },
    { label: "Comida", isFolder: true, image: "/pictograms/comida.png", color: "#FF8000",
      content: [
        { label: "Milanesa", imagePath: "/pictograms/Comida/milanesa.png", color: "#FF8000" },
        { label: "Pollo", imagePath: "/pictograms/Comida/pollo.png", color: "#FF8000" },
        { label: "Hamburguesa", imagePath: "/pictograms/Comida/hamburguesa.png", color: "#FF8000" },
        { label: "Pastas", imagePath: "/pictograms/Comida/pasta.png", color: "#FF8000" },
        { label: "Ensalada", imagePath: "/pictograms/Comida/ensalada.png", color: "#FF8000" },
        { label: "Pescado", imagePath: "/pictograms/Comida/pescado.png", color: "#FF8000" },
        { label: "Galleta", imagePath: "/pictograms/Comida/galletas.png", color: "#FF8000" }
      ]
     },
    // 👇 ESTOS DOS SOLO APARECEN EN MODO SIMPLE
    ...(commLevel === "simple" ? [
      { label: "Escuela", image: "/pictograms/Lugares/director de escuela.png", color: "#FF8000" },
      { label: "Hospital", image: "/pictograms/Lugares/hospital.png", color: "#FF8000" }
    ] : []),

    // La carpeta lugares usa el contenido que armamos arriba dinámicamente
    { label: "Lugares", isFolder: true, image: "/pictograms/lugares.png", color: "#FF8000", content: lugaresContent },
    { label: "Sí", image: "/pictograms/sí.png", color: "#33FF33" },
    
    

    { label: "Mamá", image: "/pictograms/Familia/mamá.png", color: "#FFFF00" },
    { label: "Baño", image: "/pictograms/baño.png", color: "#00FF00" },
    { label: "Salir", image: "/pictograms/salir.png", color: "#00FF00" },
    { label: "Ayuda", image: "/pictograms/ayuda.png", color: "#00FF00" },
    { label: "Ayudas", isFolder: true, image: "/pictograms/ayudas para la movilidad.png", color: "#00FF00",
      content: [
        { label: "Defecar", imagePath: "/pictograms/Necesidades/cagar.png", color: "#00FF00" },
        { label: "Orinar", imagePath: "/pictograms/Necesidades/orinar.png", color: "#00FF00" },
        { label: "Bañarse", imagePath: "/pictograms/Necesidades/ducha.png", color: "#00FF00" },
        { label: "Cepillar los dientes", imagePath: "/pictograms/Necesidades/cepillar los dientes.png", color: "#00FF00" },
        { label: "Lavar la cara", imagePath: "/pictograms/Necesidades/lavar la cara.png", color: "#00FF00" },
        { label: "Cambiarse", imagePath: "/pictograms/Necesidades/ropa.png", color: "#00FF00" },
        { label: "Lavar la ropa", imagePath: "/pictograms/Necesidades/lavar la ropa.png", color: "#00FF00" },
        { label: "Hospital", imagePath: "/pictograms/Lugares/hospital.png", color: "#00FF00" }
      ]
     },
    { label: "Dolor", image: "/pictograms/dolor.png", color: "#00FF00" },
    { label: "Dolores", isFolder: true, image: "/pictograms/dolor.png", color: "#00FF00",
      content: [
        { label: "Dolor de cabeza", imagePath: "/pictograms/Dolor/dolor de cabeza.png", color: "#00FF00" },
        { label: "Dolor de brazo", imagePath: "/pictograms/Dolor/dolor de brazo.png", color: "#00FF00" },
        { label: "Dolor de pierna", imagePath: "/pictograms/Dolor/dolor de pierna.png", color: "#00FF00" },
        { label: "Dolor de estómago", imagePath: "/pictograms/Dolor/dolor de estómago.png", color: "#00FF00" },
        { label: "Dolor de pecho", imagePath: "/pictograms/Dolor/dolor de pecho.png", color: "#00FF00" },
        { label: "Dolor de espalda", imagePath: "/pictograms/Dolor/dolor de espalda.png", color: "#00FF00" },
        { label: "Dolor de muela", imagePath: "/pictograms/Dolor/dolor de muela.png", color: "#00FF00" },
        { label: "Dolor de oído", imagePath: "/pictograms/Dolor/dolor de oído.png", color: "#00FF00" }
      ]
     },
    { label: "Ropa", isFolder: true, image: "/pictograms/Necesidades/ropa.png", color: "#FF8000",
      content: [
        { label: "Camiseta", imagePath: "/pictograms/Ropa/camiseta.png", color: "#FF8000" },
        { label: "Pantalón", imagePath: "/pictograms/Ropa/pantalón.png", color: "#FF8000" },
        { label: "Zapatillas", imagePath: "/pictograms/Ropa/zapatilla.png", color: "#FF8000" },
        { label: "Gorra", imagePath: "/pictograms/Ropa/gorra.png", color: "#FF8000" },
        { label: "Campera", imagePath: "/pictograms/Ropa/campera.png", color: "#FF8000" },
        { label: "Sudadera", imagePath: "/pictograms/Ropa/sudadera.png", color: "#FF8000" },
        { label: "Calcetín", imagePath: "/pictograms/Ropa/calcetín.png", color: "#FF8000" },
        { label: "Calzoncillo", imagePath: "/pictograms/Ropa/calzoncillo.png", color: "#FF8000" },
      ]
     },
    { label: "No", image: "/pictograms/no.png", color: "#CC0000" },
    { label: "Papá", image: "/pictograms/Familia/papá.png", color: "#FFFF00" },
    { label: "Dormir", image: "/pictograms/dormir.png", color: "#00FF00" },
    { label: "Jugar", image: "/pictograms/Verbos/jugar.png", color: "#00FF00" },
    { label: "Ver la televisión", image: "/pictograms/Verbos/ver la televisión.png", color: "#00FF00" },
    { label: "Escuchar música", image: "/pictograms/Verbos/escuchar música.png", color: "#00FF00" },
    { label: "¿Por qué?", image: "/pictograms/Preguntas/por qué.png", color: "#9933FF" },
    { label: "¿Quién?", image: "/pictograms/Preguntas/quién.png", color: "#9933FF" },
    { label: "Enojado", image: "/pictograms/Estado/enfadado.png", color: "#007FFF" },
    { label: "Alegre", image: "/pictograms/Estado/alegre.png", color: "#007FFF" },
    { label: "Familia", isFolder: true, image: "/pictograms/Familia/familia.png", color: "#FFFF00",
      content: [
        { label: "Abuela", image: "/pictograms/Familia/abuela.png", color: "#FFFF00" },
        { label: "Abuelo", image: "/pictograms/Familia/abuelo.png", color: "#FFFF00" },
        { label: "Hermana", image: "/pictograms/Familia/niña.png", color: "#FFFF00" },
        { label: "Hermano", image: "/pictograms/Familia/niño.png", color: "#FFFF00" },
        { label: "Gato", image: "/pictograms/Familia/gato.png", color: "#FFFF00" },
        { label: "Perro", image: "/pictograms/Familia/perro.png", color: "#FFFF00" }
      ]
     },
    { label: "Lugares de la casa", isFolder: true, image: "/pictograms/casa de muñecas.png", color: "#FF8000", 
      content: [
        { label: "Cocina", image: "/pictograms/Casa/cocina.png", color: "#FF8000" },
        { label: "Dormitorio", image: "/pictograms/Casa/dormitorio.png", color: "#FF8000" },
        { label: "Baño", image: "/pictograms/Casa/baño.png", color: "#FF8000" },
        { label: "Jardín", image: "/pictograms/Casa/jardín.png", color: "#FF8000" },
        { label: "Salón", image: "/pictograms/Casa/salón.png", color: "#FF8000" },
        { label: "Comedor", image: "/pictograms/Casa/comedor.png", color: "#FF8000" },
        { label: "Garaje", image: "/pictograms/Casa/garaje.png", color: "#FF8000" },
        { label: "Terraza", image: "/pictograms/Casa/terraza.png", color: "#FF8000" }
      ]
    },
    { label: "Juegos", isFolder: true, image: "/pictograms/Verbos/jugar.png", color: "#00FF00",
      content: [
        { label: "Jugar a la pelota", imagePath: "/pictograms/Juegos/jugar a la pelota.png", color: "#00FF00" },
        { label: "Jugar en el suelo", imagePath: "/pictograms/Juegos/jugar en el suelo.png", color: "#00FF00" },
        { label: "Jugar con el tablet", imagePath: "/pictograms/Juegos/jugar con el tablet.png", color: "#00FF00" },
        { label: "Jugar al fútbol", imagePath: "/pictograms/Juegos/fútbol.png", color: "#00FF00" },
        { label: "Jugar al básquet", imagePath: "/pictograms/Juegos/baloncesto.png", color: "#00FF00" },
        { label: "Jugar al tenis", imagePath: "/pictograms/Juegos/tenista.png", color: "#00FF00" },
        { label: "Jugar al voleibol", imagePath: "/pictograms/Juegos/jugador de voleibol.png", color: "#00FF00" },
        { label: "Jugar al bolos", imagePath: "/pictograms/Juegos/jugar a los bolos.png", color: "#00FF00" },
        { label: "Jugar al hockey", imagePath: "/pictograms/Juegos/jugador de hockey hierba.png", color: "#00FF00" },
        { label: "Jugar a la play", imagePath: "/pictograms/Juegos/consola.png", color: "#00FF00" }
      ]
     },
    { label: "Juguetes", isFolder: true, image: "/pictograms/juegos didácticos.png", color: "#FF8000",
      content: [
        { label: "Muñeca", imagePath: "/pictograms/Juguetes/muñeca.png", color: "#FF8000" },
        { label: "Pelota", imagePath: "/pictograms/Juguetes/pelota.png", color: "#FF8000" },
        { label: "Camión", imagePath: "/pictograms/Juguetes/camión de juguete.png", color: "#FF8000" },
        { label: "Rompecabezas", imagePath: "/pictograms/Juguetes/ficha de puzzle.png", color: "#FF8000" },
        { label: "Bloques", imagePath: "/pictograms/Juguetes/bloques.png", color: "#FF8000" },
        { label: "Peluches", imagePath: "/pictograms/Juguetes/osito.png", color: "#FF8000" },
        { label: "Slime", imagePath: "/pictograms/Juguetes/slime.png", color: "#FF8000" },
        { label: "Ensartable", imagePath: "/pictograms/Juguetes/ensartable.png", color: "#FF8000" },
        { label: "Bolitas", imagePath: "/pictograms/Juguetes/canica.png", color: "#FF8000" }
      ]
     },
    { label: "Acciones", isFolder: true, image: "/pictograms/verbos.png", color: "#00FF00" ,
      content: [
        { label: "Escribir", imagePath: "/pictograms/Verbos/escribir.png", color: "#00FF00" },
        { label: "Pasear", imagePath: "/pictograms/Verbos/pasear.png", color: "#00FF00" },
        { label: "Pasear en bicicleta", imagePath: "/pictograms/Verbos/pasear en bicicleta.png", color: "#00FF00" },
        { label: "Jugar", imagePath: "/pictograms/Verbos/jugar.png", color: "#00FF00" },
        { label: "Contar un cuento", imagePath: "/pictograms/Verbos/contar un cuento.png", color: "#00FF00" }
      ]
    },
    { label: "¿Dónde?", image: "/pictograms/Preguntas/dónde.png", color: "#9933FF" },
    { label: "Preguntas", isFolder: true, image: "/pictograms/Preguntas/undefined.png", color: "#9933FF",
      content: [
        { label: "¿Qué?", image: "/pictograms/Preguntas/qué.png", color: "#9933FF" },
        { label: "¿Qué dices?", image: "/pictograms/Preguntas/¿qué dices.png", color: "#9933FF" },
        { label: "¿Cuándo?", image: "/pictograms/Preguntas/cuándo.png", color: "#9933FF" },
        { label: "¿Cómo?", image: "/pictograms/Preguntas/cómo.png", color: "#9933FF" },
        { label: "¿Cuál?", image: "/pictograms/Preguntas/¿cuál.png", color: "#9933FF" },
        { label: "¿Qué es?", image: "/pictograms/Preguntas/qué es.png", color: "#9933FF" },
      ]
     },
    { label: "Emociones", isFolder: true, image: "/pictograms/¿estás contento.png", color: "#007FFF",
      content: [
        { label: "Aburrido", image: "/pictograms/Estado/aburrida.png", color: "#007FFF" },
        { label: "Agobiado", image: "/pictograms/Estado/agobiado.png", color: "#007FFF" },
        { label: "Ansioso", image: "/pictograms/Estado/ansioso.png", color: "#007FFF" },
        { label: "Confusión", image: "/pictograms/Estado/confusión.png", color: "#007FFF" },
        { label: "Distraído", image: "/pictograms/Estado/distraído.png", color: "#007FFF" },
        { label: "Emocionado", image: "/pictograms/Estado/emocionado.png", color: "#007FFF" },
      ]
     },
    { label: "Triste", image: "/pictograms/Estado/triste.png", color: "#007FFF" },
  ];

  const saveConfigurations = async () => {
    if (!user || user.id === "guest") return;

    try {
      await setDoc(
        doc(db, "usuarios", user.id),
        {
          configuraciones: {
            imageSize,
            textSize,
            commLevel,
            hiddenPictos,
          }
        },
        { merge: true }
      );
      console.log("Configuración guardada exitosamente");
    } catch (error) {
      console.error("Error guardando configuración:", error);
    }
  };

 // Carga de configuración desde Firestore al montar el componente
  useEffect(() => {
    const loadConfigurations = async () => {
      if (!user || user.id === "guest") {
        setIsConfigLoaded(true); // Si es invitado, permitimos que la app avance
        return;
      }

      try {
        const userRef = doc(db, "usuarios", user.id);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();

          if (userData && userData.configuraciones) {
            const { imageSize: imgSz, textSize: txtSz, commLevel: lvl, hiddenPictos: hp } = userData.configuraciones;

            if (imgSz !== undefined) setImageSize(imgSz);
            if (txtSz !== undefined) setTextSize(txtSz);
            if (lvl !== undefined) setCommLevel(lvl);
            if (hp !== undefined) setHiddenPictos(hp);
          }
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      } finally {
        setIsConfigLoaded(true); // ¡Fundamental! Avisamos que ya terminó de cargar
      }
    };
    
    loadConfigurations();
  }, [user]);


  useEffect(() => {
    // Evita guardar si no hay usuario, es invitado, o si aún no se descargó la config inicial
    if (!user || user.id === "guest" || !isConfigLoaded) return;

    saveConfigurations();
  }, [imageSize, textSize, commLevel, hiddenPictos, isConfigLoaded]);

  // Manejador centralizado para cuando se hace clic en un pictograma (principal o modal)
  const handlePictogramSelect = (pic: any) => {
    if (pic.isFolder) {
      if (commLevel === "simple") {
        playAudio(pic.label);
      }
      if (pic.content) {
        setCurrentFolder(pic.content);
        setIsModalOpen(true);
      }
      return;
    }

    // 🔊 CAMBIO: Solo suena automáticamente si NO estamos en modo compuesto
    //if (commLevel === "simple") {
    //  playAudio(pic.label);
    //}

    const newSelected: SelectedPicto = {
      label: pic.label,
      emoji: pic.emoji,
      image: pic.image || pic.imagePath, // Maneja ambas propiedas según tu array
      color: pic.color,
    };

    if (commLevel === "simple") {
      // Nivel simple: Reemplaza lo que haya por el nuevo pictograma (array de 1 elemento)
      setPhrase([newSelected]);
    } else {
      // Nivel compuesto: Agrega al final
      if (phrase.length < 7) {
        setPhrase(prev => [...prev, newSelected]); 
      }
      else if (phrase.length >= 7) {
        console.log("Límite de 7 pictogramas alcanzado. No se pueden agregar más.");
        return;
      }
    }
  };

  // Funciones para los controles de frase compuesta
  const removeLast = () => {
    setPhrase((prev) => prev.slice(0, -1));
  };

  const clearPhrase = () => {
    setPhrase([]);
  };

  const playFullPhrase = async () => {
    playPhrase(phrase.map(p => p.label));
  };

  const toggleHidePicto = (label: string) => {
    setHiddenPictos(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  // Función para calcular los tamaños dinámicos
  const getDynamicStyles = () => {
    let imgSize = "55px"; // normal
    if (imageSize === "small") imgSize = "40px";
    if (imageSize === "large") imgSize = "75px";

    let txtSize = "16px"; // normal
    if (textSize === "small") txtSize = "13px";
    if (textSize === "large") txtSize = "21px";

    return {
      "--dynamic-img-size": imgSize,
      "--dynamic-txt-size": txtSize,
      "--folder-display": textSize === "large" ? "none" : "inline-block",
    } as React.CSSProperties;
  };

  return (
    <div className="pictogram-page" style={getDynamicStyles()}>
      {/* 🔹 Barra superior */}
      <div className="sentence-bar">

        {/* Lado Izquierdo: Contenido de la frase */}
        <div className="sentence-content">
          {phrase.length === 0 ? (
            <span className="placeholder">Selecciona un pictograma...</span>
          ) : (
            <div className="phrase-items-container">
              {phrase.map((p, index) => (
                <div key={index} className="phrase-item">
                  {p.image ? (
                    <img src={p.image} alt={p.label} className="sentence-img" />
                  ) : (
                    <span className="sentence-emoji">{p.emoji || "❓"}</span>
                  )}
                  <span className="sentence-text">{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado Derecho: Controles y Configuración */}
        <div className="sentence-controls">
          
          {/* Controles de Nivel Simple */}
          {commLevel === "simple" && phrase.length > 0 && (
            <button className="control-btn btn-danger" onClick={clearPhrase} title="Borrar">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          )}

          {/* Controles de Frases Compuestas */}
          {commLevel === "composed" && phrase.length > 0 && (
            <div className="composed-controls">
              {/* Borrar último: Rojo */}
              <button className="control-btn btn-danger" onClick={removeLast} title="Borrar último">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
              </button>
              
              {/* Play: Verde */}
              <button className="control-btn btn-success" onClick={playFullPhrase} title="Reproducir frase">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
              </button>

              {/* Borrar todo: Rojo */}
              <button className="control-btn btn-danger" onClick={clearPhrase} title="Borrar todo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          )}

          {/* Botón confirmar modo ocultar */}
          {isHideModeActive && (
            <button className="control-btn btn-success hide-confirm-btn" onClick={() => setIsHideModeActive(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          )}

          {/* Botón de Configuración (Dropdown) */}
          <div className="settings-wrapper">
            <button 
              className="control-btn settings-btn" 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>

            {isSettingsOpen && (
              <div className="settings-dropdown">
                <p className="dropdown-title">Nivel de Comunicación</p>
                <label className="dropdown-option">
                  <input 
                    type="radio" 
                    name="level" 
                    checked={commLevel === "simple"}
                    onChange={() => { setCommLevel("simple"); setPhrase([]); setIsSettingsOpen(false); }}
                  />
                  Palabra Simple
                </label>
                <label className="dropdown-option">
                  <input 
                    type="radio" 
                    name="level" 
                    checked={commLevel === "composed"}
                    onChange={() => { setCommLevel("composed"); setPhrase([]); setIsSettingsOpen(false); }}
                  />
                  Frases Compuestas
                </label>
                {/*Separador y botón de personalización */}
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-action-btn"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsSizeModalOpen(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  Personalizar Tamaño
                </button>
                <button
                  className="dropdown-action-btn"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsHideModeActive(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  Ocultar Pictogramas
                </button>
                <button
                  className="dropdown-action-btn"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsCustomizationOpen(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Personalización de Grilla
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Grilla principal */}
      <div className="pictogram-grid">
        {pictograms.map((pic, idx) => {
          const isHidden = hiddenPictos.includes(pic.label);
          return (
            <div
              key={idx}
              className="picto-slot"
              style={{
                visibility: isHidden && !isHideModeActive ? 'hidden' : 'visible',
                opacity: isHideModeActive && isHidden ? 0.35 : 1,
              }}
            >
              <PictogramTile
                label={pic.label}
                image={pic.image}
                color={pic.color}
                isFolder={pic.isFolder}
                isSelected={commLevel === "simple" && phrase[0]?.label === pic.label}
                onClick={() => {
                  if (isHideModeActive) {
                    toggleHidePicto(pic.label);
                    return;
                  }
                  if (!pic.isFolder) {
                    if (commLevel === "simple") playAudio(pic.label);
                  } else {
                    if (commLevel === "simple") playAudio(pic.label);
                    if (pic.content) {
                      setCurrentFolder(pic.content);
                      setCurrentFolderLabel(pic.label);
                      setIsModalOpen(true);
                    }
                    return;
                  }
                  const newSelected = {
                    label: pic.label,
                    emoji: (pic as any).emoji,
                    image: pic.image || (pic as any).imagePath,
                    color: pic.color,
                  };
                  if (commLevel === "simple") {
                    setPhrase([newSelected]);
                  } else {
                    if (phrase.length < 7) {
                      setPhrase((prev) => [...prev, newSelected]);
                    } else if (phrase.length >= 7) {
                      return;
                    }
                  }
                }}
              />
              {isHideModeActive && (
                <button
                  className={`picto-hide-badge ${isHidden ? 'picto-hide-badge-show' : 'picto-hide-badge-hide'}`}
                  onClick={(e) => { e.stopPropagation(); toggleHidePicto(pic.label); }}
                >
                  {isHidden ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12"><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></svg>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔹 MODAL DE ACCESIBILIDAD (HU 13) */}
      {isSizeModalOpen && (
        <div className="modal-overlay">
          <div className="size-modal-content">
            <button className="modal-close-btn" onClick={() => setIsSizeModalOpen(false)}>×</button>
            <h2 className="size-modal-title">Personalización Visual</h2>
            
            <div className="size-section">
              <p className="size-label">Tamaño de los Pictogramas (Imágenes)</p>
              <div className="segmented-control">
                <button className={`segment ${imageSize === "small" ? "active" : ""}`} onClick={() => setImageSize("small")}>Pequeño</button>
                <button className={`segment ${imageSize === "normal" ? "active" : ""}`} onClick={() => setImageSize("normal")}>Normal</button>
                <button className={`segment ${imageSize === "large" ? "active" : ""}`} onClick={() => setImageSize("large")}>Grande</button>
              </div>
            </div>

            <div className="size-section">
              <p className="size-label">Tamaño del Texto (Etiquetas)</p>
              <div className="segmented-control">
                <button className={`segment ${textSize === "small" ? "active" : ""}`} onClick={() => setTextSize("small")}>Pequeño</button>
                <button className={`segment ${textSize === "normal" ? "active" : ""}`} onClick={() => setTextSize("normal")}>Normal</button>
                <button className={`segment ${textSize === "large" ? "active" : ""}`} onClick={() => setTextSize("large")}>Grande</button>
              </div>
            </div>
            
            {/* Vista previa en tiempo real */}
            <div className="size-preview">
              <p className="preview-title">Vista Previa</p>
              <div className="pictogram-tile preview-tile">
                <img src="/pictograms/beber.png" alt="preview" className="picto-img" style={{ maxWidth: "var(--dynamic-img-size)", maxHeight: "var(--dynamic-img-size)" }}/>
                <span className="label" style={{ fontSize: "var(--dynamic-txt-size)" }}>Ejemplo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 MODAL: Aquí es donde ocurre la magia de la ventana emergente */}
      {/* No necesitas cambiar nada aquí si tu componente Modal ya tiene la lógica nueva */}
      <PictogramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pictograms={currentFolder}
        folderLabel={currentFolderLabel}
        userId={user?.id ?? null}
        onSelect={(pic) => {
          // 🔊 Solo reproducimos el audio automáticamente en nivel simple
          if (commLevel === "simple") {
            playAudio(pic.label);
          }
          
          const newSelected = {
            label: pic.label,
            emoji: (pic as any).emoji,
            image: pic.image || (pic as any).imagePath,
            color: pic.color,
          };

          // Dependiendo del nivel, lo sumamos a la frase o lo reemplazamos
          if (commLevel === "simple") {
            setPhrase([newSelected]);
          } else {
            if (phrase.length < 7) {
              setPhrase((prev) => [...prev, newSelected]);
            }
            else if (phrase.length >= 7) {
              console.log("Límite de 7 pictogramas alcanzado. No se pueden agregar más.");
              return;
            }
          }
          
          setIsModalOpen(false);
        }}
      />
      {isCustomizationOpen && (
        <CustomGridEditor onClose={() => setIsCustomizationOpen(false)} />
      )}
    </div>
  );
};

export default PictogramPage;
