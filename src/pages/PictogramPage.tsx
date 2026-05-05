import React, { lazy, useState } from "react";
import PictogramTile from "../components/PictogramTile";
import PictogramModal from "../components/PictogramModal";
import "./PictogramPage.css";
import { useAudio } from "../hooks/useAudio";


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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { playAudio, playPhrase } = useAudio();

  // Estados de Configuración de Accesibilidad (tamaño de letra y pictograma)
  type SizeOption = "small" | "normal" | "large";
  const [textSize, setTextSize] = useState<SizeOption>("normal");
  const [imageSize, setImageSize] = useState<SizeOption>("normal");
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  
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
        { label: "No quero", imagePath: "/public/pictograms/Conectores/no quiero.png", color: "#fa18c2" },
        { label: "Tengo", imagePath: "/public/pictograms/Conectores/tengo.png", color: "#fa18c2" },
        { label: "Conn", imagePath: "/public/pictograms/Conectores/_con.png", color: "#fa18c2" },
        { label: "Estoy", imagePath: "/public/pictograms/Conectores/estoy.png", color: "#fa18c2" },
        { label: "Ir", imagePath: "/public/pictograms/Conectores/ir.png", color: "#fa18c2" },
        { label: "Necesito", imagePath: "/public/pictograms/Conectores/necesito.png", color: "#fa18c2" },
        { label: "Tú", imagePath: "/public/pictograms/Conectores/tu.png", color: "#fa18c2" },
      ]}
    ] : []),
    
    { label: "Sed", image: "/pictograms/beber.png", color: "#00FF00" },
    { label: "Bebida", isFolder: true, image: "/pictograms/bebida.png", color: "#FF8000",
      content: [
        { label: "Agua", imagePath: "/public/pictograms/Bebida/agua.png", color: "#FF8000" },
        { label: "Café", imagePath: "/public/pictograms/Bebida/café.png", color: "#FF8000" },
        { label: "Leche", imagePath: "/public/pictograms/Bebida/leche.png", color: "#FF8000" },
        { label: "Jugo", imagePath: "/public/pictograms/Bebida/jugo.png", color: "#FF8000" },
        { label: "Coca-Cola", imagePath: "/public/pictograms/Bebida/coca-cola.png", color: "#FF8000" },
        { label: "Mate", imagePath: "/public/pictograms/Bebida/mate.png", color: "#FF8000" },
      ]
     },
    { label: "Hambre", image: "/pictograms/comer.png", color: "#00FF00" },
    { label: "Comida", isFolder: true, image: "/pictograms/comida.png", color: "#FF8000",
      content: [
        { label: "Milanesa", imagePath: "/public/pictograms/Comida/milanesa.png", color: "#FF8000" },
        { label: "Pollo", imagePath: "/public/pictograms/Comida/pollo.png", color: "#FF8000" },
        { label: "Hamburguesa", imagePath: "/public/pictograms/Comida/hamburguesa.png", color: "#FF8000" },
        { label: "Pastas", imagePath: "/public/pictograms/Comida/pasta.png", color: "#FF8000" },
        { label: "Ensalada", imagePath: "/public/pictograms/Comida/ensalada.png", color: "#FF8000" },
        { label: "Pescado", imagePath: "/public/pictograms/Comida/pescado.png", color: "#FF8000" },
        { label: "Galleta", imagePath: "/public/pictograms/Comida/galletas.png", color: "#FF8000" }
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
        { label: "Defecar", imagePath: "/public/pictograms/Necesidades/cagar.png", color: "#00FF00" },
        { label: "Orinar", imagePath: "/public/pictograms/Necesidades/orinar.png", color: "#00FF00" },
        { label: "Bañarse", imagePath: "/public/pictograms/Necesidades/ducha.png", color: "#00FF00" },
        { label: "Cepillar los dientes", imagePath: "/public/pictograms/Necesidades/cepillar los dientes.png", color: "#00FF00" },
        { label: "Lavar la cara", imagePath: "/public/pictograms/Necesidades/lavar la cara.png", color: "#00FF00" },
        { label: "Cambiarse", imagePath: "/public/pictograms/Necesidades/Ropa.png", color: "#00FF00" },
        { label: "Lavar la ropa", imagePath: "/public/pictograms/Necesidades/lavar la ropa.png", color: "#00FF00" },
        { label: "Hospital", imagePath: "/public/pictograms/Lugares/hospital.png", color: "#00FF00" }
      ]
     },
    { label: "Dolor", image: "/pictograms/dolor.png", color: "#00FF00" },
    { label: "Dolores", isFolder: true, image: "/pictograms/dolor.png", color: "#00FF00",
      content: [
        { label: "Dolor de cabeza", imagePath: "/public/pictograms/Dolor/dolor de cabeza.png", color: "#00FF00" },
        { label: "Dolor de brazo", imagePath: "/public/pictograms/Dolor/dolor de brazo.png", color: "#00FF00" },
        { label: "Dolor de pierna", imagePath: "/public/pictograms/Dolor/dolor de pierna.png", color: "#00FF00" },
        { label: "Dolor de estómago", imagePath: "/public/pictograms/Dolor/dolor de estómago.png", color: "#00FF00" },
        { label: "Dolor de pecho", imagePath: "/public/pictograms/Dolor/dolor de pecho.png", color: "#00FF00" },
        { label: "Dolor de espalda", imagePath: "/public/pictograms/Dolor/dolor de espalda.png", color: "#00FF00" },
        { label: "Dolor de muela", imagePath: "/public/pictograms/Dolor/dolor de muela.png", color: "#00FF00" },
        { label: "Dolor de oído", imagePath: "/public/pictograms/Dolor/dolor de oído.png", color: "#00FF00" }
      ]
     },
    { label: "Ropa", isFolder: true, image: "/pictograms/Necesidades/ropa.png", color: "#FF8000",
      content: [
        { label: "Camiseta", imagePath: "/public/pictograms/Ropa/camiseta.png", color: "#FF8000" },
        { label: "Pantalón", imagePath: "/public/pictograms/Ropa/pantalón.png", color: "#FF8000" },
        { label: "Zapatillas", imagePath: "/public/pictograms/Ropa/zapatilla.png", color: "#FF8000" },
        { label: "Gorra", imagePath: "/public/pictograms/Ropa/gorra.png", color: "#FF8000" },
        { label: "Campera", imagePath: "/public/pictograms/Ropa/campera.png", color: "#FF8000" },
        { label: "Sudadera", imagePath: "/public/pictograms/Ropa/sudadera.png", color: "#FF8000" },
        { label: "Calcetín", imagePath: "/public/pictograms/Ropa/calcetín.png", color: "#FF8000" },
        { label: "Calzoncillo", imagePath: "/public/pictograms/Ropa/calzoncillo.png", color: "#FF8000" },
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
        { label: "Jugar a la pelota", imagePath: "/public/pictograms/Juegos/jugar a la pelota.png", color: "#00FF00" },
        { label: "Jugar en el suelo", imagePath: "/public/pictograms/Juegos/jugar en el suelo.png", color: "#00FF00" },
        { label: "Jugar con el tablet", imagePath: "/public/pictograms/Juegos/jugar con el tablet.png", color: "#00FF00" },
        { label: "Jugar al fútbol", imagePath: "/public/pictograms/Juegos/fútbol.png", color: "#00FF00" },
        { label: "Jugar al básquet", imagePath: "/public/pictograms/Juegos/baloncesto.png", color: "#00FF00" },
        { label: "Jugar al tenis", imagePath: "/public/pictograms/Juegos/tenista.png", color: "#00FF00" },
        { label: "Jugar al voleibol", imagePath: "/public/pictograms/Juegos/jugador de voleibol.png", color: "#00FF00" },
        { label: "Jugar al bolos", imagePath: "/public/pictograms/Juegos/jugar a los bolos.png", color: "#00FF00" },
        { label: "Jugar al hockey", imagePath: "/public/pictograms/Juegos/jugador de hockey hierba.png", color: "#00FF00" },
        { label: "Jugar a la play", imagePath: "/public/pictograms/Juegos/consola.png", color: "#00FF00" }
      ]
     },
    { label: "Juguetes", isFolder: true, image: "/pictograms/juegos didácticos.png", color: "#FF8000",
      content: [
        { label: "Muñeca", imagePath: "/public/pictograms/Juguetes/muñeca.png", color: "#FF8000" },
        { label: "Pelota", imagePath: "/public/pictograms/Juguetes/pelota.png", color: "#FF8000" },
        { label: "Camión", imagePath: "/public/pictograms/Juguetes/camión de juguete.png", color: "#FF8000" },
        { label: "Rompecabezas", imagePath: "/public/pictograms/Juguetes/ficha de puzzle.png", color: "#FF8000" },
        { label: "Bloques", imagePath: "/public/pictograms/Juguetes/bloques.png", color: "#FF8000" },
        { label: "Peluches", imagePath: "/public/pictograms/Juguetes/osito.png", color: "#FF8000" },
        { label: "Slime", imagePath: "/public/pictograms/Juguetes/slime.png", color: "#FF8000" },
        { label: "Ensartable", imagePath: "/public/pictograms/Juguetes/ensartable.png", color: "#FF8000" },
        { label: "Bolitas", imagePath: "/public/pictograms/Juguetes/canica.png", color: "#FF8000" }
      ]
     },
    { label: "Acciones", isFolder: true, image: "/pictograms/verbos.png", color: "#00FF00" ,
      content: [
        { label: "Escribir", imagePath: "/public/pictograms/Verbos/escribir.png", color: "#00FF00" },
        { label: "Pasear", imagePath: "/public/pictograms/Verbos/pasear.png", color: "#00FF00" },
        { label: "Pasear en bicicleta", imagePath: "/public/pictograms/Verbos/pasear en bicicleta.png", color: "#00FF00" },
        { label: "Jugar", imagePath: "/public/pictograms/Verbos/jugar.png", color: "#00FF00" },
        { label: "Contar un cuento", imagePath: "/public/pictograms/Verbos/contar un cuento.png", color: "#00FF00" }
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Grilla principal */}
      <div className="pictogram-grid">
        {pictograms.map((pic, idx) => (
          <PictogramTile
            key={idx}
            label={pic.label}
            //emoji={(pic as any).emoji}
            image={pic.image}
            color={pic.color}
            isFolder={pic.isFolder}
            // CAMBIO 1: Validamos contra el array 'phrase' (si es simple, mira el primer elemento)
            isSelected={commLevel === "simple" && phrase[0]?.label === pic.label}
            onClick={() => {
              if (!pic.isFolder) {
                if (commLevel === "simple") {
                  playAudio(pic.label);
                }
              } else {
                  if(commLevel === "simple"){
                    playAudio(pic.label);
                  }
                if(pic.content) {
                  setCurrentFolder(pic.content); 
                  setIsModalOpen(true);
                }
                return; // CAMBIO 2: ¡Importante! Cortamos acá para que la carpeta no suba a la barra
              }

              // CAMBIO 3: En vez de setSelected, armamos el objeto y usamos setPhrase
              const newSelected = {
                label: pic.label,
                emoji: (pic as any).emoji,
                image: pic.image || (pic as any).imagePath, // Cubrimos image e imagePath por las dudas
                color: pic.color,
              };

              if (commLevel === "simple") {
                setPhrase([newSelected]); // Modo simple: pisa lo que había y deja solo este
              } else {
                if (phrase.length < 7) {
                  setPhrase((prev) => [...prev, newSelected]); // Modo compuesto: lo suma al final de la frase
                }
                else if (phrase.length >= 7) {
                  console.log("Límite de 7 pictogramas alcanzado. No se pueden agregar más.");
                  return;
                }
              }
            }}
          />
        ))}
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
    </div> // 👈 Cierre del div className="pictogram-page"
  );
};

export default PictogramPage;
