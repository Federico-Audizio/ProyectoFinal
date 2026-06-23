import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import { useAudio } from "../hooks/useAudio.js"; //[cite: 1]

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, provider, db } from "../firebase.js";
//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { useAuth } from "../contexts/AuthContext.js";



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
  const { preloadAudio } = useAudio(); //[cite: 1]
  const [pictograms, setPictograms] = useState<Pictogram[]>([]); //[cite: 1]

  const {login, loading} = useAuth(); //[cite: 1]
  const navigate = useNavigate(); //[cite: 1]

  // --- Estados para el Modal de Login ---
  const [showModal, setShowModal] = useState(true); // Se muestra al entrar por defecto
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null); // Aquí guardarás el usuario de Firebase o 'guest'
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    } else if (!loading && !user) {
      setShowModal(true);
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Tu lógica de precarga intacta[cite: 1]
    const preload = async () => {
      try {
        const pictoPath = await fetch("/AudioGenerator/pictograms.json"); //[cite: 1]
        const pictoData: PictogramResponse = await pictoPath.json(); //[cite: 1]
        const signPath = await fetch("/AudioGenerator/sign.json"); //[cite: 1]
        const signData: SignResponse = await signPath.json(); //[cite: 1]

        const PictoPromises = pictoData.pictograms.map((p) => { //[cite: 1]
          const audioPicto = `/AudioGenerator/audio/es/${p.file}`; //[cite: 1]
          return preloadAudio(audioPicto); //[cite: 1]
        });

        const SignPromises = signData.sign.map((p) => { //[cite: 1]
          const audioSign = `/AudioGenerator/audio/es/${p.file}`; //[cite: 1]
          return preloadAudio(audioSign); //[cite: 1]
        });

        await Promise.all([...SignPromises, ...PictoPromises]); //[cite: 1]
        console.log("Todos los audios e imágenes han sido precargados."); //[cite: 1]
      } catch (error) { //[cite: 1]
        console.error("Error precargando recursos:", error); //[cite: 1]
      }
    };

    preload(); //[cite: 1]
  }, [preloadAudio]); //[cite: 1]

  // --- Funciones de Autenticación ---
  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, provider);
      
      // Referencia al documento del usuario en Firestore
      const userRef = doc(db, "usuarios", result.user.uid);
      const docSnap = await getDoc(userRef);

      const token = await result.user.getIdToken();
      login({
        id: result.user.uid,
        email: result.user.email || "",
        nombre: result.user.displayName || "",
        token: token,
      });
      navigate("/");
      setShowModal(false);

      // Si el usuario no existe en la base de datos, lo creamos
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          nombre: result.user.displayName,
          fechaCreacion: new Date(),
          configuraciones: {} // Aquí guardarás preferencias de pictogramas, sensibilidad de cámara, etc.
        });
      }

      
    } catch (error: any) {
      console.error("Error con Google:", error);
      setAuthError("Error al iniciar sesión con Google.");
    }
  };

  // --- LÓGICA DE CORREO Y CONTRASEÑA ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegistering) {
        // Registrar nuevo usuario
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Crear su documento en la base de datos no relacional
        await setDoc(doc(db, "usuarios", result.user.uid), {
          email: result.user.email,
          fechaCreacion: new Date(),
          configuraciones: {} 
        });
        
        const token = await result.user.getIdToken();
        login({ id: result.user.uid, email: result.user.email || "", nombre: result.user.email?.split("@")[0] || "", token });
      } else {
        // Iniciar sesión con usuario existente
        const result = await signInWithEmailAndPassword(auth, email, password);
        const token = await result.user.getIdToken();
        login({ id: result.user.uid, email: result.user.email || "", nombre: result.user.displayName || "", token });
      }
      navigate("/");
      setShowModal(false);
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      // Manejo básico de errores de Firebase
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("El correo ya está registrado.");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setAuthError("Correo o contraseña incorrectos.");
      } else {
        setAuthError("Error al autenticar. Verifica tus datos.");
      }
    }
  };

  // --- LÓGICA DE INVITADO ---
  const handleGuest = () => {
    login({ id: "guest", email: "", nombre: "Invitado", token: "" });
    setShowModal(false);
    navigate("/");
  };

  return (
    <div className="home-container">
      {/* MODAL EMERGENTE */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}</h2>
            
            <button className="google-btn" onClick={handleGoogleLogin}>
              Continuar con Google
            </button>

            <div className="divider">o</div>

            <form onSubmit={handleEmailAuth} className="auth-form">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="submit-btn">
                {isRegistering ? "Registrarse" : "Ingresar"}
              </button>
            </form>

            <button 
              className="toggle-auth-btn" 
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>

            <button className="guest-btn" onClick={handleGuest}>
              Continuar como Invitado (Sin guardar config.)
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO ORIGINAL DE HOME */}
      <h1 className="home-title">BIENVENIDOS</h1> {/*[cite: 1] */}

      <div className="menu-list"> {/*[cite: 1] */}
        <div className="menu-item"> {/*[cite: 1] */}
          <div className="icon-circle"> {/*[cite: 1] */}
            <span>😶</span> {/*[cite: 1] */}
          </div>
          <Link to="/camera" className="nav-button"> {/*[cite: 1] */}
            Reconocimiento de Emociones {/*[cite: 1] */}
          </Link>
        </div>

        <div className="menu-item"> {/*[cite: 1] */}
          <div className="icon-circle"> {/*[cite: 1] */}
            <span>🖼️</span> {/*[cite: 1] */}
          </div>
          <Link to="/pictograms" className="nav-button"> {/*[cite: 1] */}
            Pictogramas {/*[cite: 1] */}
          </Link>
        </div>

        <div className="menu-item"> {/*[cite: 1] */}
          <div className="icon-circle"> {/*[cite: 1] */}
            <span>👁️</span> {/*[cite: 1] */}
          </div>
          <Link to="/eyetracking" className="nav-button"> {/*[cite: 1] */}
            Seguimiento Visual {/*[cite: 1] */}
          </Link>
        </div>

        <div className="menu-item"> {/*[cite: 1] */}
          <div className="icon-circle"> {/*[cite: 1] */}
            <span>🤟</span> {/*[cite: 1] */}
          </div>
          <Link to="/sena" className="nav-button"> {/*[cite: 1] */}
            Detector de Señas {/*[cite: 1] */}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; //[cite: 1]


