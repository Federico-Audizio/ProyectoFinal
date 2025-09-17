import React, { useState } from "react";
import PictogramTile from "../components/PictogramTile";
import "./PictogramPage.css";

const PictogramPage: React.FC = () => {
  const [selected, setSelected] = useState<string>("");

  const pictograms = [
    { label: "Yo", emoji: "🧑", color: "orange" },
    { label: "Tú", emoji: "👩", color: "orange" },
    { label: "Comer", emoji: "🍎", color: "green" },
    { label: "Beber", emoji: "🥤", color: "green" },
    { label: "Feliz", emoji: "😀", color: "gold" },
    { label: "Triste", emoji: "😢", color: "blue" },
    { label: "Enojado", emoji: "😡", color: "red" },
    { label: "Jugar", emoji: "⚽", color: "purple" },
    { label: "Yo", emoji: "🧑", color: "orange" },
    { label: "Tú", emoji: "👩", color: "orange" },
    { label: "Comer", emoji: "🍎", color: "green" },
    { label: "Beber", emoji: "🥤", color: "green" },
    { label: "Feliz", emoji: "😀", color: "gold" },
    { label: "Triste", emoji: "😢", color: "blue" },
    { label: "Enojado", emoji: "😡", color: "red" },
    { label: "Jugar", emoji: "⚽", color: "purple" },
    { label: "Yo", emoji: "🧑", color: "orange" },
    { label: "Tú", emoji: "👩", color: "orange" },
    { label: "Comer", emoji: "🍎", color: "green" },
    { label: "Beber", emoji: "🥤", color: "green" },
    { label: "Feliz", emoji: "😀", color: "gold" },
    { label: "Triste", emoji: "😢", color: "blue" },
    { label: "Enojado", emoji: "😡", color: "red" },
    { label: "Jugar", emoji: "⚽", color: "purple" },
    { label: "Yo", emoji: "🧑", color: "orange" },
    { label: "Tú", emoji: "👩", color: "orange" },
    { label: "Comer", emoji: "🍎", color: "green" },
    { label: "Beber", emoji: "🥤", color: "green" },
    { label: "Feliz", emoji: "😀", color: "gold" },
    { label: "Triste", emoji: "😢", color: "blue" },
    { label: "Enojado", emoji: "😡", color: "red" },
    { label: "Jugar", emoji: "⚽", color: "purple" },
    { label: "Yo", emoji: "🧑", color: "orange" },
    { label: "Tú", emoji: "👩", color: "orange" },
    { label: "Comer", emoji: "🍎", color: "green" },
    { label: "Beber", emoji: "🥤", color: "green" },
    { label: "Feliz", emoji: "😀", color: "gold" },
    { label: "Triste", emoji: "😢", color: "blue" },
    { label: "Enojado", emoji: "😡", color: "red" },
    { label: "Jugar", emoji: "⚽", color: "purple" },
  ];

  return (
    <div className="pictogram-page">
      {/* Barra superior */}
      <div className="sentence-bar">
        {selected ? (
          <span className="sentence-text">{selected}</span>
        ) : (
          <span className="placeholder">Selecciona un pictograma...</span>
        )}
        <button className="clear-btn" onClick={() => setSelected("")}>
          ❌ Borrar
        </button>
      </div>

      {/* Grilla de pictogramas */}
      <div className="pictogram-grid">
        {pictograms.map((p, index) => (
          <PictogramTile
            key={index}
            label={p.label}
            emoji={p.emoji}
            color={p.color}
            onClick={() => setSelected(p.label)}
          />
        ))}
      </div>
    </div>
  );
};

export default PictogramPage;
