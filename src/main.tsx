
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster as SonnerToaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SonnerToaster position="top-right" />
  </>
);
