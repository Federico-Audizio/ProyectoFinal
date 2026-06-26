import React, { useState } from "react";
import ReactDOM from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { useGrids } from "../contexts/GridsContext";
import EmergencyModal from "./EmergencyModal";
import { useAuth } from "../contexts/AuthContext";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { savedGrids, setSavedGrids } = useGrids();
  
  const [isGridsOpen, setIsGridsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [showEmergencyBtn, setShowEmergencyBtn] = useState(true);

  const deleteGrid = (id: string) => {
    setSavedGrids(prev => prev.filter(g => g.id !== id));
    setConfirmDeleteId(null);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const pendingGrid = savedGrids.find(g => g.id === confirmDeleteId);

  return (
    <>
      <div className="sidebar" style={isGridsOpen || isProfileOpen ? { overflow: "visible" } : undefined}>
        {/* ── Perfil de usuario (siempre arriba del sidebar) ── */}
        {user && (
          <div
            className={`sidebar-user-icon${isProfileOpen ? " sui-open" : ""}`}
            //onMouseEnter={() => setIsProfileOpen(true)}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            {user.photo ? (
              <img 
                src={user.photo} 
                alt={user.nombre} 
                className="sidebar-icon sidebar-user-avatar" 
              />
            ) : (
              <div className="sidebar-icon sidebar-user-initials">
                {getInitials(user.nombre || user.email || "?")}
              </div>
            )}
            <span className="link-text">
              {user.id === "guest" ? "Invitado" : user.nombre.split(" ")[0]}
            </span>

            {user &&isProfileOpen && (
              <div className="sidebar-profile-submenu" onClick={e => e.stopPropagation()}>
                <p className="sgs-title">Mi cuenta</p>
 
                <div className="profile-header">
                  {user.photo ? (
                    <img src={user.photo} alt={user.nombre} className="profile-avatar" />
                  ) : (
                    <div className="profile-initials-large">
                      {getInitials(user.nombre || user.email || "?")}
                    </div>
                  )}
                  <div className="profile-info">
                    <p className="profile-name">
                      {user.id === "guest" ? "Invitado" : user.nombre}
                    </p>
                    {user.id !== "guest" && (
                      <p className="profile-email">{user.email}</p>
                    )}
                    {user.id === "guest" && (
                      <p className="profile-guest-note">
                        Las configuraciones no se guardan en modo invitado
                      </p>
                    )}
                  </div>
                </div>

                {/* NUEVO: Fila con el Toggle Switch para ocultar/mostrar la emergencia */}
                <div className="profile-toggle-row">
                  <span className="toggle-label">Botón Emergencia</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={showEmergencyBtn} 
                      onChange={() => setShowEmergencyBtn(!showEmergencyBtn)} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
 
                <button className="profile-logout-btn" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}

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
          <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="link-text">Mis Grillas</span>

          {isGridsOpen && (
            <div className="sidebar-grids-submenu">
              <p className="sgs-title">Mis Grillas</p>
              <button className="sgs-new-btn" onClick={() => { setIsGridsOpen(false); navigate("/custom-editor"); }}>
                + Nueva Grilla
              </button>
              {savedGrids.length === 0 ? (
                <p className="sgs-empty">Sin grillas aún</p>
              ) : (
                savedGrids.map(g => (
                  <div key={g.id} className="sgs-item-row">
                    <button className="sgs-item" onClick={() => { setIsGridsOpen(false); navigate(`/custom-editor?id=${g.id}`); }}>
                      <span className="sgs-item-name">{g.title}</span>
                      <span className="sgs-item-size">{g.cols}×{g.rows}</span>
                    </button>
                    <button className="sgs-delete-btn" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(g.id); }} title="Eliminar grilla">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
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
        {showEmergencyBtn && (
          <button className="emergency-sidebar-btn" onClick={() => setIsEmergencyOpen(true)}>
          <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="link-text">Emergencia</span>
        </button>
        )}

        {isEmergencyOpen && <EmergencyModal onClose={() => setIsEmergencyOpen(false)} />}
      </div>

      {confirmDeleteId && ReactDOM.createPortal(
        <div className="sgs-confirm-overlay">
          <div className="sgs-confirm-modal">
            <h3 className="sgs-confirm-title">Eliminar grilla</h3>
            <p className="sgs-confirm-text">
              Vas a eliminar <strong>"{pendingGrid?.title}"</strong>. Esta accion no se puede deshacer.
            </p>
            <div className="sgs-confirm-actions">
              <button className="sgs-confirm-cancel" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button className="sgs-confirm-delete" onClick={() => deleteGrid(confirmDeleteId)}>Eliminar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
 
      {/* ── Popup de perfil ── 
      {isProfileOpen && user && ReactDOM.createPortal(
        <div className="profile-overlay" onClick={() => setIsProfileOpen(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <button className="profile-close" onClick={() => setIsProfileOpen(false)}>✕</button>
 
            <div className="profile-header">
              {user.photo ? (
                <img src={user.photo} alt={user.nombre} className="profile-avatar" />
              ) : (
                <div className="profile-initials-large">
                  {getInitials(user.nombre || user.email || "?")}
                </div>
              )}
              <div className="profile-info">
                <p className="profile-name">
                  {user.id === "guest" ? "Invitado" : user.nombre}
                </p>
                {user.id !== "guest" && (
                  <p className="profile-email">{user.email}</p>
                )}
                {user.id === "guest" && (
                  <p className="profile-guest-note">
                    Las configuraciones no se guardan en modo invitado
                  </p>
                )}
              </div>
            </div>
 
            <button className="profile-logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>,
        document.body
      )}*/}
    </>
  );
};

export default Sidebar;
