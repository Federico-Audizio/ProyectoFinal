import React from "react";
import CameraCapture from "../components/CameraCapture";

const Home = () => {
  return (
    <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
      {/* Cabecera gris */}
      <header
        style={{
          backgroundColor: "#2e2e2e",
          color: "white",
          padding: "15px",
          fontSize: "1.5rem",
          fontWeight: "bold",
          textAlign: "center",
          width: "100%",
        }}
      >
        Apoyo Comunicacional
      </header>

      {/* Contenido */}
      <main style={{ padding: "20px" }}>
        <CameraCapture />
      </main>
    </div>
  );
};

export default Home;

