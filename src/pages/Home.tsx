import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { useAudio } from "../hooks/useAudio.js";
import { preload } from "react-dom";

interface Pictogram {
  text: string;
  file: string;
  image: string;
}

interface PictogramResponse {
  pictograms: Pictogram[];
}

interface SignResponse {
  language: string;
  voice: string;
  sign: {
    text: string;
    file: string;
  }[];
}

const Home: React.FC = () => {
  const { preloadAudio } = useAudio();

  const [pictograms, setPictograms] = useState<Pictogram[]>([]);

  useEffect(() => {
    const preload = async () => {
      try {
        const pictoPath = await fetch("/AudioGenerator/pictograms.json");
        const pictoData: PictogramResponse = await pictoPath.json();
        const signPath = await fetch("/AudioGenerator/sign.json");
        const signData: SignResponse = await signPath.json();


        const PictoPromises = pictoData.pictograms.map(p => {
          const audioPicto = `/AudioGenerator/audio/es/${p.file}`;
          return preloadAudio(audioPicto);
        });

        const SignPromises = signData.sign.map(p => {
          const audioSign = `/AudioGenerator/audio/es/${p.file}`;
          return preloadAudio(audioSign);
        });

        console.log("Audios listos y decodificados.");

        /* 3. Precarga de Imágenes (Mejorado con Promesas)
        const imagePromises = data.pictograms.map(p => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            // Asumimos que las imágenes están en /pictograms/
            img.src = `/pictograms/${p.image}`; 
            img.onload = () => resolve(img.src);
            img.onerror = () => {
              console.warn(`No se pudo cargar la imagen: ${p.image}`);
              // Resolvemos aunque falle para no detener toda la carga
              resolve(null); 
            };
          });
        });*/

        // 4. Esperamos a que TODO (audios e imágenes) termine
        await Promise.all([...SignPromises, ...PictoPromises]);

        console.log("Todos los audios e imágenes han sido precargados correctamente.");
      } catch (error) {
        console.error("Error precargando recursos:", error);
      }
    };

    preload();
  }, [preloadAudio]);

  return (
    <div className="home-container">
      <h1 className="home-title">BIENVENIDOS</h1>

      <div className="menu-list">
        <div className="menu-item">
          <div className="icon-circle">
            <span>😶</span>
          </div>
          <Link to="/camera" className="nav-button">
            Reconocimiento de Emociones
          </Link>
        </div>

        <div className="menu-item">
          <div className="icon-circle">
            <span>🖼️</span>
          </div>
          <Link to="/pictograms" className="nav-button">
            Pictogramas
          </Link>
        </div>

        <div className="menu-item">
          <div className="icon-circle">
            <span>👁️</span>
          </div>
          <Link to="/eyetracking" className="nav-button">
            Seguimiento Visual
          </Link>
        </div>

        <div className="menu-item">
          <div className="icon-circle">
            <span>🤟</span>
          </div>
          <Link to="/sena" className="nav-button">
            Detector de Señas
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
