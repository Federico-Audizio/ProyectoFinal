import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { useGrids } from "../contexts/GridsContext";
import EmergencyModal from "./EmergencyModal";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { savedGrids } = useGrids();
  const [isGridsOpen, setIsGridsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  return (
    <div className="sidebar" style={isGridsOpen ? { overflow: "visible", width: "220px" } : undefined}>
      {/* 1. Link CÁMARA */}
      <NavLink to="/camera" className="icon">
        <img src="/icons/emocion.png" alt="Cámara" className="sidebar-icon" />
        <span className="link-text">Cámara</span>
      </NavLink>

      {/* 2. Link PICTOGRAMAS */}
      <NavLink to="/pictograms" className="icon">
        <img src="/icons/pictograma.png" alt="Pictogramas" className="sidebar-icon" />
        <span className="link-text">Pictogramas</span>
      </NavLink>

      {/* Grillas personalizadas */}
      <div
        className={`icon sidebar-grids-icon${isGridsOpen ? " sgi-open" : ""}`}
        onMouseEnter={() => setIsGridsOpen(true)}
        onMouseLeave={() => setIsGridsOpen(false)}
      >
        <svg
          className="sidebar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="link-text">Mis Grillas</span>

        {isGridsOpen && (
          <div className="sidebar-grids-submenu">
            <p className="sgs-title">Mis Grillas</p>

            <button
              className="sgs-new-btn"
              onClick={() => { setIsGridsOpen(false); navigate("/custom-editor"); }}
            >
              + Nueva Grilla
            </button>

            {savedGrids.length === 0 ? (
              <p className="sgs-empty">Sin grillas aún</p>
            ) : (
              savedGrids.map(g => (
                <button
                  key={g.id}
                  className="sgs-item"
                  onClick={() => { setIsGridsOpen(false); navigate(`/custom-editor?id=${g.id}`); }}
                >
                  <span className="sgs-item-name">{g.title}</span>
                  <span className="sgs-item-size">{g.cols}×{g.rows}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Link SEGUIMIENTO OCULAR */}
      <NavLink to="/eyegestures" className="icon">
        <img src="/icons/visibilidad.png" alt="EyeTracking" className="sidebar-icon" />
        <span className="link-text">Calibración</span>
      </NavLink>

      {/* 4. Link SEÑAS */}
      <NavLink to="/sena" className="icon">
        <img src="/icons/lenguajedesenas.png" alt="Señas" className="sidebar-icon" />
        <span className="link-text">Señas</span>
      </NavLink>

      {/* Botón de emergencia */}
      <button className="emergency-sidebar-btn" onClick={() => setIsEmergencyOpen(true)}>
        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="link-text">Emergencia</span>
      </button>

      {isEmergencyOpen && <EmergencyModal onClose={() => setIsEmergencyOpen(false)} />}
    </div>
  );
};

export default Sidebar;
