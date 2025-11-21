import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CameraPage from "./pages/CameraPage";
import PictogramPage from "./pages/PictogramPage";
import EyeTrackingPage from './pages/EyeTrackingPage'; 


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout = envoltorio con sidebar, se mantiene siempre */}
        <Route path="/" element={<Layout />}>
          {/* Estas son las pantallas que se cargan en <Outlet /> */}
          <Route path="camera" element={<CameraPage />} />
          <Route path="pictograms" element={<PictogramPage />} />
          <Route path="eyetracking" element={<EyeTrackingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
