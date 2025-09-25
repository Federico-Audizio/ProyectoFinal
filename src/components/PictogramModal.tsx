import React from "react";
import "../pages/PictogramPage.css";

interface Pictogram {
  label: string;
  emoji?: string;
  image?: string;
  color: string;
}

interface PictogramModalProps {
  isOpen: boolean;
  onClose: () => void;
  pictograms: Pictogram[];
  onSelect: (pic: Pictogram) => void; // 👈 ahora recibe el objeto completo
}

const PictogramModal: React.FC<PictogramModalProps> = ({
  isOpen,
  onClose,
  pictograms,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Selecciona un pictograma</h3>
        <div className="pictogram-grid">
          {pictograms.map((pic, idx) => (
            <div
              key={idx}
              className="pictogram-tile"
              style={{ borderColor: pic.color }}
              onClick={() => {
                onSelect(pic); // 👈 pasamos el objeto completo
                onClose();
              }}
            >
              {pic.image ? (
                <img src={pic.image} alt={pic.label} className="pictogram-img" />
              ) : (
                <span className="emoji">{pic.emoji}</span>
              )}
              <span className="label">{pic.label}</span>
            </div>
          ))}
        </div>
        <button className="clear-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default PictogramModal;
