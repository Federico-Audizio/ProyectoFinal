import React from "react";
import "../pages/PictogramPage.css"; // Asegúrate que la ruta sea correcta

interface Pictogram {
  label: string;
  emoji?: string;
  image?: string;
  imagePath?: string;
  color: string;
}

interface PictogramModalProps {
  isOpen: boolean;
  onClose: () => void;
  pictograms: Pictogram[];
  onSelect: (pic: Pictogram) => void;
}

const PictogramModal: React.FC<PictogramModalProps> = ({
  isOpen,
  onClose,
  pictograms,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Botón X */}
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Título con nueva clase para alinear */}
        <h3 className="modal-header">
          Selecciona un pictograma
        </h3>

        <div className="modal-grid">
          {pictograms.map((pic, idx) => (
            <div
              key={idx}
              className="pictogram-tile"
              // Aumenté un poco la altura mínima del cuadro
              style={{ borderColor: pic.color, minHeight: "140px" }} 
              onClick={() => {
                onSelect(pic);
                onClose();
              }}
            >
              {pic.image || pic.imagePath ? (
                <img 
                  src={pic.image || pic.imagePath} 
                  alt={pic.label} 
                  className="pictogram-img"
                  // 🔍 TAMAÑO AUMENTADO: de 60px a 85px
                  style={{ width: "85px", height: "85px", objectFit: "contain" }} 
                />
              ) : (
                // 🔍 TAMAÑO EMOJI AUMENTADO: de 40px a 70px
                <span className="emoji" style={{ fontSize: "70px" }}>
                  {pic.emoji || "❓"}
                </span>
              )}
              
              {/* 🔍 TAMAÑO TEXTO AUMENTADO: de 14px a 18px y negrita */}
              <span className="label" style={{ fontSize: "18px", marginTop: "10px", fontWeight: "bold" }}>
                {pic.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PictogramModal;