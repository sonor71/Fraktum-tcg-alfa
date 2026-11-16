import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import "./ui/styles.css";
import "./ui/mobile.css";
import "./ui/gameplay-v2.css";
import "./ui/match-mobile-final.css";
import "./ui/fraktum-unified.css";
import "./ui/fraktum-reforged.css";
import "./ui/fraktum-reforged-v2.css";
import "./ui/fraktum-battle-vfx.css";
import "./ui/fraktum-authentic-pixel.css";
import "./ui/fraktum-player-world.css";
import "./ui/fraktum-arcane-pixel-v4.css";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
