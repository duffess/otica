/** Decisões de dispositivo tomadas uma vez na carga (o 3D não troca de modo no meio). */
const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

/** Celular/tablet: modelo leve, sem transmission, DPR até 1.5. */
export const isLite = mq('(max-width: 768px)') || mq('(pointer: coarse)');
export const reducedMotion = mq('(prefers-reduced-motion: reduce)');

/** ?modelo=codigo mostra o óculos modelado em código (placeholder). */
export const usePlaceholder =
  typeof window !== 'undefined' && new URLSearchParams(location.search).get('modelo') === 'codigo';

export const MODEL_URL = isLite ? '/models/glasses-mobile.glb' : '/models/glasses-desktop.glb';
