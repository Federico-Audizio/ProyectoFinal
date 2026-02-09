import React, { useState } from "react";
import PictogramTile from "../components/PictogramTile";
import PictogramModal from "../components/PictogramModal";
import "./PictogramPage.css";
import { useAudio } from "../hooks/useAudio";


interface SelectedPicto {
  label: string;
  emoji?: string;
  image?: string;
  color: string; // ✅ ahora también aceptamos color
}

const PictogramPage: React.FC = () => {
  const [selected, setSelected] = useState<SelectedPicto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<any[]>([]);
  const { playAudio } = useAudio();
  

  const pictograms = [
    { label: "Yo", image: "/pictograms/yo.png", color: "#ffff00ff" },
    { label: "Sed", image: "/pictograms/beber.png", color: "#00FF00" },
    { label: "Bebida", isFolder: true, image: "/pictograms/bebida.png", color: "#FF8000" },
    { label: "Hambre", image: "/pictograms/comer.png", color: "#00FF00" },
    { label: "Comida", isFolder: true, image: "/pictograms/comida.png", color: "#FF8000" },
    { label: "Escuela", image: "/pictograms/director de escuela.png", color: "#FF8000" },
    { label: "Hospital", image: "/pictograms/hospital.png", color: "#FF8000" },
    { label: "Lugares", isFolder: true, image: "/pictograms/lugares.png", color: "#FF8000" },
    { label: "Si", image: "/pictograms/sí.png", color: "#33FF33" },
    { label: "Mamá", image: "/pictograms/mamá.png", color: "#FFFF00" },
    { label: "Baño", image: "/pictograms/baño.png", color: "#00FF00" },
    { label: "Salir", image: "/pictograms/salir.png", color: "#00FF00" },
    { label: "Ayuda", image: "/pictograms/ayuda.png", color: "#00FF00" },
    { label: "Ayudas", isFolder: true, image: "/pictograms/ayudas para la movilidad.png", color: "#00FF00" },
    { label: "Dolor", image: "/pictograms/dolor.png", color: "#00FF00" },
    { label: "Dolores", isFolder: true, image: "/pictograms/dolor.png", color: "#00FF00" },
    { label: "Ropa", isFolder: true, image: "/pictograms/ropa.png", color: "#FF8000" },
    { label: "No", image: "/pictograms/no.png", color: "#CC0000" },
    { label: "Papá", image: "/pictograms/papá.png", color: "#FFFF00" },
    { label: "Dormir", image: "/pictograms/dormir.png", color: "#00FF00" },
    { label: "Jugar", image: "/pictograms/jugar.png", color: "#00FF00" },
    { label: "Ver la televisión", image: "/pictograms/ver la televisión.png", color: "#00FF00" },
    { label: "Escuchar música", image: "/pictograms/escuchar música.png", color: "#00FF00" },
    { label: "¿Por que?", image: "/pictograms/qué.png", color: "#9933FF" },
    { label: "¿Quién?", image: "/pictograms/quién.png", color: "#9933FF" },
    { label: "Enojado", image: "/pictograms/enfadado.png", color: "#007FFF" },
    { label: "Alegre", image: "/pictograms/alegre.png", color: "#007FFF" },
    { label: "Familia", isFolder: true, image: "/pictograms/familia.png", color: "#FFFF00" },
    { label: "Lugares de la casa", isFolder: true, image: "/pictograms/casa de muñecas.png", color: "#FF8000" },
    { label: "Juegos", isFolder: true, image: "/pictograms/jugar.png", color: "#00FF00" },
    { label: "Juguetes", isFolder: true, image: "/pictograms/juegos didácticos.png", color: "#FF8000" },
    { label: "Acciones", isFolder: true, image: "/pictograms/verbos.png", color: "#00FF00" },
    { label: "¿Dónde?", image: "/pictograms/dónde.png", color: "#9933FF" },
    { label: "Preguntas", isFolder: true, image: "/pictograms/¿estás contento.png", color: "#9933FF" },
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
    { label: "Triste", image: "/pictograms/triste.png", color: "#007FFF" },
  ];

  const folderContent = [
    { label: "Pizza", image: "/pictograms/Estado/pizza.png", color: "#32CD32" },
    { label: "Manzana", image: "/pictograms/Estado/manzana.png", color: "#32CD32" },
    { label: "Pan", image: "/pictograms/Estado/pan.png", color: "#32CD32" },
  ];

  return (
    <div className="pictogram-page">
      {/* 🔹 Barra superior */}
      <div className="sentence-bar">
        {selected ? (
          <div className="sentence-content">
            <div className="sentence-emoji">
              {selected.image ? (
                <img
                  src={selected.image}
                  alt={selected.label}
                  className="sentence-img"
                />
              ) : (
                selected.emoji || "❓"
              )}
            </div>
            <span className="sentence-text">{selected.label}</span>

            {/* ✅ Botón borrar dentro del bloque */}
            <button className="close-btn" onClick={() => setSelected(null)}>
              <img src="/icons/borrar.png" alt="Borrar" className="btn-icon" /> Borrar
            </button>
          </div>
        ) : (
          <span className="placeholder">Selecciona un pictograma...</span>
        )}
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
            isSelected={selected?.label === pic.label}
            onClick={() => {
              if (!pic.isFolder) {
                playAudio(pic.label);
    
              }else{
                playAudio(pic.label);
                if(pic.content) {
                  setCurrentFolder(pic.content); // cargamos el contenido de esa carpeta
                  setIsModalOpen(true);
                } 
              }

                setSelected({
                  label: pic.label,
                  emoji: (pic as any).emoji,
                  image: (pic as any).image,
                  color: pic.color,
                });
            }}
          />
        ))}
      </div>

      {/* 🔹 Modal con más pictogramas */}
      <PictogramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pictograms={currentFolder}
        onSelect={(pic) => setSelected(pic)}
      />
    </div>
  );
};

export default PictogramPage;
