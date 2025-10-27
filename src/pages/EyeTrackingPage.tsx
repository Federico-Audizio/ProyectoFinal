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
    </div>
  );
};

export default EyeTrackingPage;