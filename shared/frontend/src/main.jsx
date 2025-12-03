import "./i18n"; // 👈 must be imported before anything else

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { UIProvider } from "./context/UIContext";
import { AuthProvider } from "./context/AuthContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n"; // 👈 import configured i18n instance

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}> {/* ✅ Connect i18n to React */}
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </I18nextProvider>
  </React.StrictMode>
);