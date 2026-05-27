import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GridsProvider } from "./contexts/GridsContext";
import Layout from "./components/Layout";
import CameraPage from "./pages/CameraPage";
import PictogramPage from "./pages/PictogramPage";
import EyeTrackingPage from './pages/EyeTrackingPage';
import Home from "./pages/Home";
import SenaPage from "./pages/SenaPage";
import CustomGridEditor from "./components/CustomGridEditor";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
    <GridsProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/" element={<Layout />}>
          <Route path="camera" element={<CameraPage />} />
          <Route path="pictograms" element={<PictogramPage />} />
          <Route path="custom-editor" element={<CustomGridEditor onClose={() => {}} />} />
          <Route path="eyetracking" element={<EyeTrackingPage />} />
          <Route path="eyegestures" element={<EyeTrackingPage />} />
          <Route path="sena" element={<SenaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </GridsProvider>
    </AuthProvider>
  );
}

export default App;
