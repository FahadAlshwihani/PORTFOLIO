import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import App from "./App";
import "./index.css"
import "./styles/global.css";
import "./styles/sections.css";
import "./styles/herosection.css"; // keep your original styles loaded

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
