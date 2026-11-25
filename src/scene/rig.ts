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
  fit: 2.2, sx: 0, sy: 0, spin: 1, rotY: 0, explode: 0, chart: 0, flex: 0, dark: 0,
};

const flat = (k: Keyframe) => ({
  px: k.pos[0], py: k.pos[1], pz: k.pos[2],
  tx: k.target[0], ty: k.target[1], tz: k.target[2],
  fit: k.fit, sx: k.screen[0], sy: k.screen[1], spin: k.spin, rotY: k.rotY, explode: k.explode, chart: k.chart, flex: k.flex, dark: k.dark,
});

const isNarrow = () => window.innerWidth < 769;

/**
 * O óculos termina dentro de .footer__stage. Mede onde esse espaço fica na tela com a
 * página rolada até o fim e converte em screen/fit. No serviço ele fica o mesmo tanto
 * abaixo da tela que o rodapé sobe: com a interpolação linear, sobe junto com o rodapé.
 */
function footerFrames(kfs: Record<string, Keyframe>, max: number) {
  const stage = document.querySelector<HTMLElement>('.footer__stage');
  const footer = document.querySelector<HTMLElement>('[data-scene="rodape"]');
  if (!stage || !footer || !kfs.rodape || !kfs.servico) return kfs;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = stage.getBoundingClientRect();
  const top = r.top + window.scrollY - max; // topo do espaço na tela, no fim da rolagem
  const sx = (r.left + r.width / 2) / vw - 0.5;
  // um pouco acima do centro: o reflexo no chão fica embaixo do óculos
  const sy = 0.5 - (top + r.height * 0.36) / vh;
  // girando, o óculos ocupa a diagonal (~2 unidades: frente + hastes); ela cabe em ~75% do espaço
  const fit = 2 / Math.max(0.2, (0.75 * r.width) / vw);
  const travel = (max - Math.max(0, footer.offsetTop - vh)) / vh;
  return {
    ...kfs,
    rodape: { ...kfs.rodape, screen: [sx, sy] as [number, number], fit },
    servico: { ...kfs.servico, screen: [sx, sy - travel] as [number, number], fit },
  };
}

export function setupRig() {
  let tl: gsap.core.Timeline | null = null;
  let st: ScrollTrigger | null = null;
  const cuts: ScrollTrigger[] = [];

  const build = () => {
    tl?.kill();
    st?.kill();
    cuts.splice(0).forEach((c) => c.kill());

    const kfs = footerFrames(getKeyframes(isNarrow()), ScrollTrigger.maxScroll(window));
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
            start: 'top 60%',
            end: 'bottom 60%',
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
      // a troca começa quando a seção entra por baixo e termina quando ela chega ao topo
      // (ou no fim da página, no caso do rodapé, que é mais baixo que a tela)
      const top = Math.min(el.offsetTop, max);
      const start = Math.max(0, el.offsetTop - vh);
      const duration = Math.max(1, top - start);
      const { dark, ...rest } = flat(k);
      const isFooter = el.dataset.scene === 'rodape';
      // no rodapé o óculos acompanha a página (linear) e o escuro chega logo no começo
      tl!.to(rig, { ...rest, duration, ease: isFooter ? 'none' : 'power2.inOut' }, start);
      tl!.to(rig, { dark, duration, ease: 'expo.out' }, start);
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

