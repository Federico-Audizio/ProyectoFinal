import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../firebase";

// 1. Define una interfaz real para tu usuario (cambia los campos según tu backend)
export interface User {
  id: string;
  email: string;
  nombre: string;
  token: string;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean; // Útil para evitar parpadeos mientras verificás la sesión
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode; // Tipado correcto para los hijos en React + TS
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 2. Al cargar la app, verificamos si ya había un usuario guardado
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.id === "guest"){
          setUser(parsedUser);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error al parsear el usuario del localStorage", error);
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          nombre: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
          token,
          photo: firebaseUser.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
 
    return unsubscribe; // Limpia el listener al desmontar
  }, []);

  // 3. Abstraemos el login para que guarde en estado y en almacenamiento al mismo tiempo
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  // 4. Abstraemos el logout para limpiar todo
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};