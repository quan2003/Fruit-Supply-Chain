// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Web3Provider } from "./contexts/Web3Context";
import { AuthProvider } from "./contexts/AuthContext";
import "./assets/styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Web3Provider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>
);
