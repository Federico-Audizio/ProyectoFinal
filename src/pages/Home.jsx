import React from "react";
import { Link } from "react-router-dom"; // Importamos Link para la navegación
import "./Home.css"; // Importamos los estilos que creamos arriba

const Home = () => {
  return (
    <div className="home-container">
      {/* Título Principal */}
      <h1 className="home-title">BIENVENIDOS</h1>

      {/* Menú de Opciones */}
      <div className="menu-list">
        
        {/* Opción 1: Reconocimiento de Emociones */}
        <div className="menu-item">
          <div className="icon-circle">
            {/* AQUÍ VA TU ICONO 1. Puedes usar una etiqueta <img> o un icono de librería */}
            <span>😶</span> 
          </div>
          <Link to="/camera" className="nav-button">
            Reconocimiento de Emociones
          </Link>
        </div>

        {/* Opción 2: Pictogramas */}
        <div className="menu-item">
          <div className="icon-circle">
             {/* AQUÍ VA TU ICONO 2 */}
            <span>🖼️</span>
          </div>
          <Link to="/pictograms" className="nav-button">
            Pictogramas
          </Link>
        </div>

        {/* Opción 3: Seguimiento Visual */}
        <div className="menu-item">
          <div className="icon-circle">
             {/* AQUÍ VA TU ICONO 3 */}
            <span>👁️</span>
          </div>
          <Link to="/eyetracking" className="nav-button">
            Seguimiento Visual
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;