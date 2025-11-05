import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CameraPage from "./pages/CameraPage";
import PictogramPage from "./pages/PictogramPage";
<<<<<<< HEAD
import EyeTrackingPage from './pages/EyeTrackingPage'; 

=======
import EyeTrackingPage from "./pages/EyeTrackingPage"; // 👈 nueva importación
>>>>>>> f0ccab6d6fb1c6cbc96567e7dd4d6b66a586252d

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout = envoltorio con sidebar, se mantiene siempre */}
        <Route path="/" element={<Layout />}>
          {/* Estas son las pantallas que se cargan en <Outlet /> */}
          <Route path="camera" element={<CameraPage />} />
          <Route path="pictograms" element={<PictogramPage />} />
<<<<<<< HEAD
          <Route path="eyetracking" element={<EyeTrackingPage />} />
=======
          <Route path="eyegestures" element={<EyeTrackingPage />} /> {/* 👈 nueva ruta */}
>>>>>>> f0ccab6d6fb1c6cbc96567e7dd4d6b66a586252d
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
