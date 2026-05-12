import React from "react";

interface PictogramTileProps {
  label: string;
  emoji?: string;
  image?: string;
  color: string;
  isFolder?: boolean;
  isSelected?: boolean; // ✅ nuevo
  onClick: () => void;
}

const PictogramTile: React.FC<PictogramTileProps> = ({
  label,
  emoji,
  image,
  color,
  isFolder = false,
  isSelected = false, // ✅ default
  onClick,
}) => {
  return (
    <div
      className={`pictogram-tile ${isFolder ? "folder-tile" : ""} ${isSelected ? "selected" : ""}`}
      style={{ borderColor: color, ["--picto-color" as any]: color }}
      onClick={onClick}
    >
      <div className="emoji">
        {image ? (
          <img src={image} alt={label} className="picto-img" />
        ) : (
          emoji || "❓"
        )}
      </div>
      <div className="label">
        {isFolder && <span className="folder-emoji">📂 </span>}
        {label}
      </div>
    </div>
  );
};

export default PictogramTile;
