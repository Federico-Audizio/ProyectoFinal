import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Buscamos el div root del index.html
const rootElement = document.getElementById("root");

// Si existe, montamos la app en él
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

