import React, { createContext, useContext, useState } from "react";

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

interface GridsCtx {
  savedGrids: CustomGrid[];
  setSavedGrids: React.Dispatch<React.SetStateAction<CustomGrid[]>>;
}

const GridsContext = createContext<GridsCtx>({ savedGrids: [], setSavedGrids: () => {} });

export const GridsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedGrids, setSavedGrids] = useState<CustomGrid[]>([]);
  return (
    <GridsContext.Provider value={{ savedGrids, setSavedGrids }}>
      {children}
    </GridsContext.Provider>
  );
};

export const useGrids = () => useContext(GridsContext);
