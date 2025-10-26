import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";

// Import admin utilities for development (remove in production)
if (process.env.NODE_ENV === 'development') {
  import('./scripts/createAdmin.ts').then(module => {
    (window as unknown as Record<string, unknown>).adminUtils = module.consoleHelpers;
    console.log('🔧 Admin utilities loaded. Use "adminUtils" in console for admin management.');
  }).catch(error => {
    console.warn('Failed to load admin utilities:', error);
  });
}

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Global stil sıfırlama */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
