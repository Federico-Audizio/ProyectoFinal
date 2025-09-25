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

  const pictograms = [
    { label: "Feliz", emoji: "😀", color: "#FFD700" },
    { label: "Triste", emoji: "😢", color: "#87CEFA" },
    { label: "Enojado", emoji: "😡", color: "#FF6347" },
    { label: "Sorpresa", emoji: "😮", color: "#FFA500" },
    { label: "Comer", emoji: "🍽️", color: "#ff9f1c" },
    { label: "Dormir", emoji: "😴", color: "#2ec4b6" },
    { label: "Jugar", emoji: "⚽", color: "#e71d36" },
    { label: "Agua", emoji: "💧", color: "#00aaff" },
    { label: "Triste", emoji: "😢", color: "#87CEFA" },
    { label: "Enojado", emoji: "😡", color: "#FF6347" },
    { label: "Sorpresa", emoji: "😮", color: "#FFA500" },
    { label: "Comer", emoji: "🍽️", color: "#ff9f1c" },
    { label: "Dormir", emoji: "😴", color: "#2ec4b6" },
    { label: "Jugar", emoji: "⚽", color: "#e71d36" },
    { label: "Agua", emoji: "💧", color: "#00aaff" },
    { label: "Triste", emoji: "😢", color: "#87CEFA" },
    { label: "Enojado", emoji: "😡", color: "#FF6347" },
    { label: "Sorpresa", emoji: "😮", color: "#FFA500" },
    { label: "Feliz", emoji: "😀", color: "#FFD700" },
    { label: "Triste", emoji: "😢", color: "#87CEFA" },
    { label: "Enojado", emoji: "😡", color: "#FF6347" },
    { label: "Sorpresa", emoji: "😮", color: "#FFA500" },
    { label: "Feliz", emoji: "😀", color: "#FFD700" },
    { label: "Triste", emoji: "😢", color: "#87CEFA" },
    { label: "Enojado", emoji: "😡", color: "#FF6347" },
    { label: "Sorpresa", emoji: "😮", color: "#FFA500" },
    { label: "Feliz", emoji: "😀", color: "#FFD700" },
    { label: "Triste", emoji: "😢", color: "#87CEFA" },
    { label: "Enojado", emoji: "😡", color: "#FF6347" },
    { label: "Sorpresa", emoji: "😮", color: "#FFA500" },
    { label: "Comer", emoji: "🍽️", color: "#ff9f1c" },
    { label: "Dormir", emoji: "😴", color: "#2ec4b6" },
    { label: "Jugar", emoji: "⚽", color: "#e71d36" },
    { label: "Agua", emoji: "💧", color: "#00aaff" },
    { label: "Comida", isFolder: true, color: "#32CD32" }, // 👈 carpeta
    { label: "Familia", isFolder: true, color: "#32CD32" },
    { label: "Casa", isFolder: true, color: "#32CD32" },
  ];

  const folderContent = [
    { label: "Pizza", image: "/pictos/pizza.png", color: "#32CD32" },
    { label: "Manzana", image: "/pictos/apple.png", color: "#32CD32" },
    { label: "Pan", image: "/pictos/bread.png", color: "#32CD32" },
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
          </div>
        ) : (
          <span className="placeholder">Selecciona un pictograma...</span>
        )}

        {/* Botón borrar */}
        {selected && (
          <button className="clear-btn" onClick={() => setSelected(null)}>
            ❌ Borrar
          </button>
        )}
      </div>

      {/* 🔹 Grilla principal */}
      <div className="pictogram-grid">
        {pictograms.map((pic, idx) => (
          <PictogramTile
            key={idx}
            label={pic.label}
            emoji={pic.emoji}
            image={(pic as any).image} // 👈 soporte si hay imagen
            color={pic.color}
            isFolder={pic.isFolder}
            isSelected={selected?.label === pic.label} // ✅ aquí marcamos selección
            onClick={() => {
               if (pic.isFolder) setIsModalOpen(true);
               else setSelected({ label: pic.label, emoji: pic.emoji, image: (pic as any).image, color: pic.color });
            }}
          />
        ))}
      </div>

      {/* 🔹 Modal con más pictogramas */}
      <PictogramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pictograms={folderContent}
        onSelect={(pic) => setSelected(pic)}
      />
    </div>
  );
};

export default PictogramPage;
