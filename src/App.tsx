import React from "react";
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import { GridsProvider } from "./contexts/GridsContext";
import Layout from "./components/Layout";
import CameraPage from "./pages/CameraPage";
import PictogramPage from "./pages/PictogramPage";
import EyeTrackingPage from './pages/EyeTrackingPage';
import Home from "./pages/Home";
import SenaPage from "./pages/SenaPage";
import CustomGridEditor from "./components/CustomGridEditor";
import { AuthProvider } from "./contexts/AuthContext";

const CustomGridEditorRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id") ?? "new";
  return <CustomGridEditor key={id} onClose={() => navigate(-1)} />;
};

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
          <Route path="custom-editor" element={<CustomGridEditorRoute />} />
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
