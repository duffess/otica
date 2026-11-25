import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { reducedMotion } from '../device';

/**
 * Girar o óculos com o mouse ou o dedo.
 * - Computador: arrastar em cima do óculos gira em Y (horizontal) e inclina em X (vertical).
 * - Toque: um dedo que começa em cima do óculos gira ele e não rola a página; fora dele,
 *   a rolagem segue normal.
 * Ao soltar, o óculos fica onde a pessoa deixou (com inércia) até a página rolar de novo.
 */
export const drag = {
  active: false,
  /** Giro em Y acumulado desde o último quadro (a cena consome e zera). */
  yaw: 0,
  /** Inclinação em X escolhida pela pessoa. */
  pitch: 0,
  /** Velocidade de giro na hora de soltar (rad/s), para a inércia. */
  vYaw: 0,
  /** Depois de soltar, segura a pose até a página rolar `HOLD_PX`. */
  hold: false,
  holdY: 0,
};

const HOLD_PX = 60;
export const PITCH_LIMIT = 0.8;

/** Elementos em que um toque/clique é da interface, não do óculos. */
const UI = 'a, button, input, label, select, textarea, .config__panel, .chapter__copy, .service, .footer__text, .topbar, .skip, .loader';

export function releaseHoldIfScrolled() {
  if (drag.hold && !drag.active && Math.abs(window.scrollY - drag.holdY) > HOLD_PX) drag.hold = false;
}

export function useGlassesDrag(target: React.RefObject<THREE.Object3D | null>) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const box = new THREE.Box3();
    const root = document.documentElement;

    /** O ponteiro está em cima do óculos? Usa a caixa do óculos (aro fino é difícil de acertar). */
    const overGlasses = (x: number, y: number, el: EventTarget | null) => {
      if (el instanceof Element && el.closest(UI)) return false;
      const obj = target.current;
      if (!obj) return false;
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      box.setFromObject(obj).expandByScalar(0.02);
      return ray.ray.intersectsBox(box);
    };

    let lx = 0;
    let ly = 0;
    let lt = 0;
    const begin = (x: number, y: number) => {
      drag.active = true;
      drag.hold = true;
      drag.vYaw = 0;
      lx = x;
      ly = y;
      lt = performance.now();
    };
    const move = (x: number, y: number, k: number) => {
      const dx = x - lx;
      const dy = y - ly;
      const now = performance.now();
      const dt = Math.max(1, now - lt) / 1000;
      const dYaw = dx * 0.011 * k;
      drag.yaw += dYaw;
      drag.pitch = THREE.MathUtils.clamp(drag.pitch + dy * 0.007 * k, -PITCH_LIMIT, PITCH_LIMIT);
      // média móvel: a velocidade do fim do gesto, sem picos
      drag.vYaw = drag.vYaw * 0.6 + (dYaw / dt) * 0.4;
      lx = x;
      ly = y;
      lt = now;
    };
    const end = () => {
      if (!drag.active) return;
      drag.active = false;
      drag.holdY = window.scrollY;
      // gesto parado antes de soltar: sem inércia
      if (performance.now() - lt > 80 || reducedMotion) drag.vYaw = 0;
      drag.vYaw = THREE.MathUtils.clamp(drag.vYaw, -8, 8);
      root.style.cursor = '';
    };

    // mouse e caneta
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if (!overGlasses(e.clientX, e.clientY, e.target)) return;
      e.preventDefault(); // sem seleção de texto
      begin(e.clientX, e.clientY);
      root.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (drag.active) return move(e.clientX, e.clientY, 1);
      root.style.cursor = overGlasses(e.clientX, e.clientY, e.target) ? 'grab' : '';
    };

    // toque: precisa de listeners não passivos para segurar a rolagem só quando o dedo está no óculos
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return end();
      const t = e.touches[0];
      if (!overGlasses(t.clientX, t.clientY, e.target)) return;
      e.preventDefault();
      begin(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!drag.active) return;
      e.preventDefault();
      const t = e.touches[0];
      move(t.clientX, t.clientY, 1.25);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
      root.style.cursor = '';
    };
  }, [camera, gl, target]);
}
