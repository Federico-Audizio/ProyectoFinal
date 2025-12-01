import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* 1. Link CÁMARA */}
      <NavLink to="/camera" className="icon">
        <img src="/icons/emocion.png" alt="Cámara" className="sidebar-icon" />
        <span className="link-text">Cámara</span> {/* <--- Nuevo Texto */}
      </NavLink>

      {/* 2. Link PICTOGRAMAS */}
      <NavLink to="/pictograms" className="icon">
        <img src="/icons/pictograma.png" alt="Pictogramas" className="sidebar-icon" />
        <span className="link-text">Pictogramas</span> {/* <--- Nuevo Texto */}
      </NavLink>

      {/* 3. Link SEGUIMIENTO OCULAR */}
      <NavLink to="/eyegestures" className="icon">
        <img src="/icons/visibilidad.png" alt="EyeTracking" className="sidebar-icon" />
        <span className="link-text">Calibración</span> {/* <--- Nuevo Texto */}
      </NavLink>
    </div>
  );
};

export default Sidebar;