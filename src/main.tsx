import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bodoni-moda/latin-400.css';
import '@fontsource/bodoni-moda/latin-400-italic.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import './styles.css';
import './loadModel'; // começa a baixar o modelo já, com progresso
import App from './App';
import { reducedMotion } from './device';

// a página sempre abre na abertura (a câmera depende da posição da rolagem)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
// o CSS também respeita o parâmetro ?movimento=reduzido
if (reducedMotion) document.documentElement.classList.add('reduce-motion');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
