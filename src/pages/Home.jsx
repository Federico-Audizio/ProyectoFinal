import React from "react";
import CameraCapture from "../components/CameraCapture";

const Home = () => {
  return (
    <div>
      <h2>Inicio</h2>
      {/* Inserta el componente que activa la cámara */}
      <CameraCapture />
    </div>
  );
};

export default Home;
