import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureAnonSession } from "./lib/anonAuth";

ensureAnonSession().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
