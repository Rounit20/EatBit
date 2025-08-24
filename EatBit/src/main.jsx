import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// Import Tailwind CSS first
import "./styles/index.css";
// Then import your custom styles
import "./styles/App.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);