import React from "react";

interface PictogramTileProps {
  label: string;
  emoji: string;
  color: string; // color del borde (categoría)
  onClick: () => void;
}

const PictogramTile: React.FC<PictogramTileProps> = ({ label, emoji, color, onClick }) => {
  return (
    <div
      className="pictogram-tile"
      style={{ borderColor: color }}
      onClick={onClick}
    >
      <div className="emoji">{emoji}</div>
      <div className="label">{label}</div>
    </div>
  );
};

export default PictogramTile;
