import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '../device';
import { getKeyframes, type Keyframe } from './keyframes';

gsap.registerPlugin(ScrollTrigger);

/**
 * Estado animado pela rolagem. A cena lê isso a cada quadro.
 * Uma timeline do GSAP, presa à rolagem (scrub), leva o "proxy" de parada em parada:
 * cada seção segura sua parada e a troca acontece no último 100vh antes dela chegar ao topo.
 */
export const rig = {
  px: 0, py: 0.78, pz: 3.7,
  tx: 0, ty: 0.46, tz: 0,
  fit: 2.2, sx: 0, sy: 0, spin: 1, rotY: 0, explode: 0, chart: 0, flex: 0,
};

const flat = (k: Keyframe) => ({
  px: k.pos[0], py: k.pos[1], pz: k.pos[2],
  tx: k.target[0], ty: k.target[1], tz: k.target[2],
  fit: k.fit, sx: k.screen[0], sy: k.screen[1], spin: k.spin, rotY: k.rotY, explode: k.explode, chart: k.chart, flex: k.flex,
});

const isNarrow = () => window.innerWidth < 769;

export function setupRig() {
  let tl: gsap.core.Timeline | null = null;
  let st: ScrollTrigger | null = null;
  const cuts: ScrollTrigger[] = [];

  const build = () => {
    tl?.kill();
    st?.kill();
    cuts.splice(0).forEach((c) => c.kill());

    const kfs = getKeyframes(isNarrow());
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    const frames = sections.map((s) => kfs[s.dataset.scene!]).filter(Boolean);
    if (!frames.length) return;
    Object.assign(rig, flat(frames[0]));

    if (reducedMotion) {
      // Sem câmera animada: um corte seco quando a seção ocupa metade da tela.
      sections.forEach((el, i) => {
        const k = kfs[el.dataset.scene!];
        if (!k) return;
        cuts.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top 50%',
            end: 'bottom 50%',
            onToggle: (self) => self.isActive && Object.assign(rig, flat(k)),
          }),
        );
        if (i === 0) Object.assign(rig, flat(k));
      });
      return;
    }

    const vh = window.innerHeight;
    const max = ScrollTrigger.maxScroll(window);
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    // a timeline tem a "duração" da rolagem em px: 1 segundo = 1 px
    tl.set(rig, flat(frames[0]), 0);
    sections.forEach((el, i) => {
      if (i === 0) return;
      const k = kfs[el.dataset.scene!];
      if (!k) return;
      const top = Math.min(el.offsetTop, max);
      const start = Math.max(0, top - vh);
      tl!.to(rig, { ...flat(k), duration: Math.max(1, top - start) }, start);
    });
    tl.set({}, {}, Math.max(max, tl.duration()));
    st = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: (self) => tl!.seek(self.scroll(), false),
    });
    tl.seek(window.scrollY, false);
  };

  build();
  ScrollTrigger.addEventListener('refresh', build);
  return () => {
    ScrollTrigger.removeEventListener('refresh', build);
    tl?.kill();
    st?.kill();
    cuts.forEach((c) => c.kill());
  };
}

