import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./experience.css";
import { LanguageProvider } from "./i18n/Language";
import "./design-system.css";
import "./visual-restoration.css";
import "./scene-system.css";
import "./interface-layout.css";
import "./global-header.css";
import "./scene-continuity.css";
import "./chinese-typography.css";
import "./stamp-button.css";
import "./scene-stage.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider><App /></LanguageProvider>
  </StrictMode>,
);
