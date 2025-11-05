import React, { useState } from "react";
import PictogramTile from "../components/PictogramTile";
import PictogramModal from "../components/PictogramModal";
import "./PictogramPage.css";

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


  const pictograms = [
    { label: "Yo", image: "/public/pictograms/yo.png", color: "#ffff00ff" },
    { label: "Sed", image: "/public/pictograms/beber.png", color: "#00FF00" },
    { label: "Bebida", isFolder: true, image: "/public/pictograms/bebida.png", color: "#FF8000" },
    { label: "Hambre", image: "/public/pictograms/comer.png", color: "#00FF00" },
    { label: "Comida", isFolder: true, image: "/public/pictograms/comida.png", color: "#FF8000" },
    { label: "Escuela", image: "/public/pictograms/director de escuela.png", color: "#FF8000" },
    { label: "Hospital", image: "/public/pictograms/hospital.png", color: "#FF8000" },
    { label: "Lugares", isFolder: true, image: "/public/pictograms/lugares.png", color: "#FF8000" },
    { label: "Si", image: "/public/pictograms/sí.png", color: "#33FF33" },
    { label: "Mamá", image: "/public/pictograms/mamá.png", color: "#FFFF00" },
    { label: "Ir al baño", image: "/public/pictograms/baño.png", color: "#00FF00" },
    { label: "Salir", image: "/public/pictograms/salir.png", color: "#00FF00" },
    { label: "Ayuda", image: "/public/pictograms/ayuda.png", color: "#00FF00" },
    { label: "Ayudas", isFolder: true, image: "/public/pictograms/ayudas para la movilidad.png", color: "#00FF00" },
    { label: "Dolor", image: "/public/pictograms/dolor.png", color: "#00FF00" },
    { label: "Dolores", isFolder: true, image: "/public/pictograms/dolor.png", color: "#00FF00" },
    { label: "Ropa", isFolder: true, image: "/public/pictograms/ropa.png", color: "#FF8000" },
    { label: "No", image: "/public/pictograms/no.png", color: "#CC0000" },
    { label: "Papá", image: "/public/pictograms/papá.png", color: "#FFFF00" },
    { label: "Dormir", image: "/public/pictograms/dormir.png", color: "#00FF00" },
    { label: "Jugar", image: "/public/pictograms/jugar.png", color: "#00FF00" },
    { label: "Ver televisión", image: "/public/pictograms/ver la televisión.png", color: "#00FF00" },
    { label: "Escuchar música", image: "/public/pictograms/escuchar música.png", color: "#00FF00" },
    { label: "¿Por que?", image: "/public/pictograms/qué.png", color: "#9933FF" },
    { label: "¿Quién?", image: "/public/pictograms/quién.png", color: "#9933FF" },
    { label: "Enojado", image: "/public/pictograms/enfadado.png", color: "#007FFF" },
    { label: "Feliz", image: "/public/pictograms/alegre.png", color: "#007FFF" },
    { label: "Familia", isFolder: true, image: "/public/pictograms/familia.png", color: "#FFFF00" },
    { label: "Lugares de la casa", isFolder: true, image: "/public/pictograms/casa de muñecas.png", color: "#FF8000" },
    { label: "Juegos", isFolder: true, image: "/public/pictograms/jugar.png", color: "#00FF00" },
    { label: "Juguetes", isFolder: true, image: "/public/pictograms/juegos didácticos.png", color: "#FF8000" },
    { label: "Acciones", isFolder: true, image: "/public/pictograms/verbos.png", color: "#00FF00" },
    { label: "¿Dónde?", image: "/public/pictograms/dónde.png", color: "#9933FF" },
    { label: "Preguntas", isFolder: true, image: "/public/pictograms/¿estás contento.png", color: "#9933FF" },
    { label: "Emociones", isFolder: true, image: "/public/pictograms/¿estás contento.png", color: "#007FFF",
      content: [
        { label: "Aburrido", image: "/public/pictograms/Estado/aburrida.png", color: "#007FFF" },
        { label: "Agobiado", image: "/public/pictograms/Estado/agobiado.png", color: "#007FFF" },
        { label: "Ansioso", image: "/public/pictograms/Estado/ansioso.png", color: "#007FFF" },
        { label: "Confusión", image: "/public/pictograms/Estado/confusión.png", color: "#007FFF" },
        { label: "Distraído", image: "/public/pictograms/Estado/distraído.png", color: "#007FFF" },
        { label: "Emocionado", image: "/public/pictograms/Estado/emocionado.png", color: "#007FFF" },
      ]
     },
    { label: "Triste", image: "/public/pictograms/triste.png", color: "#007FFF" },
  ];

  const folderContent = [
    { label: "Pizza", image: "/public/pictograms/Estado/pizza.png", color: "#32CD32" },
    { label: "Manzana", image: "/public/pictos/apple.png", color: "#32CD32" },
    { label: "Pan", image: "/public/pictos/bread.png", color: "#32CD32" },
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
            emoji={(pic as any).emoji}
            image={(pic as any).image}
            color={pic.color}
            isFolder={pic.isFolder}
            isSelected={selected?.label === pic.label}
            onClick={() => {
              if (pic.isFolder && pic.content) {
                setCurrentFolder(pic.content); // cargamos el contenido de esa carpeta
                setIsModalOpen(true);
              }else
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
