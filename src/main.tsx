import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureAnonSession } from "./lib/anonAuth";

// Render immediately so the app never shows a blank screen
// if anonymous auth is slow or disabled. Auth runs in the background.
createRoot(document.getElementById("root")!).render(<App />);
ensureAnonSession();
