import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface CustomCell {
  label: string;
  color: string;
  image: string | null;
}

export interface CustomGrid {
  id: string;
  title: string;
  rows: number;
  cols: number;
  cells: (CustomCell | null)[][];
}

interface GridFirestore extends Omit<CustomGrid, "cells"> {
  cells: string; // JSON.stringify de la matriz 2D
}

const serializeGrids = (grids: CustomGrid[]): GridFirestore[] =>
  grids.map(({ cells, ...rest }) => ({ ...rest, cells: JSON.stringify(cells) }));
 
const deserializeGrids = (grids: GridFirestore[]): CustomGrid[] =>
  grids.map(({ cells, ...rest }) => ({ ...rest, cells: JSON.parse(cells) }));

interface GridsCtx {
  savedGrids: CustomGrid[];
  setSavedGrids: React.Dispatch<React.SetStateAction<CustomGrid[]>>;
  isGridsLoaded: boolean;
}

const GridsContext = createContext<GridsCtx>({ 
  savedGrids: [], 
  setSavedGrids: () => {}, 
  isGridsLoaded: false 
});

export const GridsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedGrids, setSavedGrids] = useState<CustomGrid[]>([]);
  const [isGridsLoaded, setIsGridsLoaded] = useState(false);
  const { user } = useAuth();

  const loadedForUserRef = useRef<string | null>(null);


  // ── Carga las grillas desde Firestore al iniciar sesión
  useEffect(() => {
    loadedForUserRef.current = null;
    setSavedGrids([]);
    setIsGridsLoaded(false);

    if (!user || user.id === "guest") {
        setIsGridsLoaded(true);
        return;
      }

    const loadGrids = async () => {

      try {
        const userRef = doc(db, "usuarios", user.id);
        const docSnap = await getDoc(userRef);
 
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.grillasPersonalizadas) {
            setSavedGrids(deserializeGrids(data.grillasPersonalizadas as GridFirestore[]));
          }
        }
      } catch (error) {
        console.error("Error cargando grillas personalizadas:", error);
      } finally {
        // Igual que con configuraciones: marcamos la carga como completada
        // aunque falle, para no bloquear la app.
        loadedForUserRef.current = user.id;

        setIsGridsLoaded(true);
      }
    };
 
    loadGrids();
  }, [user]);

  // ── Guarda las grillas en Firestore cada vez que cambian, pero solo después de la carga inicial
  useEffect(() => {
    // No guardar si: no hay usuario, es invitado, o la carga inicial no terminó
    // (evita pisar los datos de Firestore con el array vacío del estado inicial)
    if (!user || user.id === "guest" || !isGridsLoaded) return;

    if (loadedForUserRef.current !== user.id) return;

    const saveGrids = async () => {
      try {
        await setDoc(
          doc(db, "usuarios", user.id),
          { grillasPersonalizadas: serializeGrids(savedGrids) },
          { merge: true } // merge para no borrar configuraciones ni otros campos
        );
      } catch (error) {
        console.error("Error guardando grillas personalizadas:", error);
      }
    };
 
    saveGrids();
  }, [savedGrids, isGridsLoaded, user]);

  return (
    <GridsContext.Provider value={{ savedGrids, setSavedGrids, isGridsLoaded }}>
      {children}
    </GridsContext.Provider>
  );
};

export const useGrids = () => useContext(GridsContext);
