import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './device';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Rolagem suave (Lenis) ligada ao relógio do GSAP. Desligada com prefers-reduced-motion. */
export function startSmoothScroll() {
  if (lenis || reducedMotion) return () => {};
  // um pouco mais lenta e mais "pesada" que o padrão: luxo silencioso, e menos chance de
  // atravessar uma troca de cena num giro só da roda
  lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.8, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t: number) => lenis?.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

/**
 * Trechos de troca de cena: [início, fim] em px de rolagem. Cada seção chega ao longo do
 * 100vh antes do seu topo (o mesmo critério de scene/rig.ts); fora disso a cena está parada.
 */
function transitions(): [number, number][] {
  const vh = window.innerHeight;
  const max = ScrollTrigger.maxScroll(window);
  const out: [number, number][] = [];
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el, i) => {
    if (i === 0) return;
    const start = Math.max(0, el.offsetTop - vh);
    const end = Math.min(el.offsetTop, max);
    if (end - start > 40) out.push([start, end]);
  });
  return out;
}

/** Para onde assentar a partir de y, seguindo a direção do gesto. null = já está numa cena. */
function settleTarget(y: number, dir: number): number | null {
  for (const [a, b] of transitions()) {
    if (y <= a + 2 || y >= b - 2) continue;
    const p = (y - a) / (b - a);
    // descendo, basta passar de 25% para seguir em frente; subindo, idem para voltar
    if (dir > 0) return p > 0.25 ? b : a;
    if (dir < 0) return p < 0.75 ? a : b;
    return p > 0.5 ? b : a;
  }
  return null;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Freio: quando o gesto termina no meio de uma troca de cena, a página completa o
 * movimento e para na cena (antes ou depois, conforme a direção). Evita o meio-termo em
 * que o texto novo e o anterior aparecem juntos sobre o óculos em movimento.
 */
export function startSceneSnap() {
  if (reducedMotion) return () => {};
  let lastY = window.scrollY;
  let dir = 0;
  let timer = 0;
  let snapping = false;
  let touching = false;

  const settle = () => {
    if (snapping || touching || document.documentElement.style.overflow === 'hidden') return;
    const y = window.scrollY;
    const target = settleTarget(y, dir);
    if (target === null || Math.abs(target - y) < 4) return;
    snapping = true;
    const duration = 0.7 + Math.min(1, Math.abs(target - y) / window.innerHeight) * 0.6;
    if (lenis) {
      lenis.scrollTo(target, { duration, easing: easeInOutCubic, onComplete: () => (snapping = false) });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
      window.setTimeout(() => (snapping = false), duration * 1000 + 300);
    }
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (y !== lastY) dir = Math.sign(y - lastY);
    lastY = y;
    window.clearTimeout(timer);
    // o Lenis ainda desliza depois do último evento da roda: espera ele quase parar
    timer = window.setTimeout(settle, lenis ? 220 : 160);
  };
  const onTouchStart = () => {
    touching = true;
    window.clearTimeout(timer);
  };
  const onTouchEnd = () => {
    touching = false;
    window.clearTimeout(timer);
    timer = window.setTimeout(settle, 220);
  };
  // um gesto novo do usuário cancela o pouso em andamento
  const onWheel = () => {
    if (snapping && lenis) {
      snapping = false;
      lenis.scrollTo(window.scrollY, { immediate: true });
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    window.removeEventListener('wheel', onWheel);
  };
}

export function scrollToEl(el: HTMLElement) {
  if (lenis) lenis.scrollTo(el, { duration: 1.8 });
  else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}

export function lockScroll(locked: boolean) {
  if (lenis) (locked ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export { gsap, ScrollTrigger };
