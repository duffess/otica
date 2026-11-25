import { useEffect, useRef } from 'react';
import { BRAND } from '../brand';
import { reducedMotion } from '../device';
import { gsap, scrollToEl } from '../motion';

export function Hero() {
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion || !copy.current) return;
    // o título sai devagar enquanto a câmera ainda gira o óculos
    const hint = copy.current.parentElement!.querySelector('.hero__hint');
    const tw = gsap.to([copy.current, hint], {
      opacity: 0,
      y: -40,
      ease: 'none',
      scrollTrigger: { start: 0, end: () => window.innerHeight * 0.6, scrub: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);

  // o topo fixo some ao descer (não cobre os textos) e volta ao subir
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.topbar');
    if (!bar) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const hide = y > window.innerHeight * 0.5 && y > last;
      bar.classList.toggle('is-hidden', hide);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // com o foco do teclado dentro dele, sempre aparece
    const onFocus = () => bar.classList.remove('is-hidden');
    bar.addEventListener('focusin', onFocus);
    return () => {
      window.removeEventListener('scroll', onScroll);
      bar.removeEventListener('focusin', onFocus);
    };
  }, []);

  return (
    <section className="hero" data-scene="abertura" aria-labelledby="hero-title">
      <header className="topbar">
        <span className="topbar__logo" aria-hidden>
          {BRAND.name}
        </span>
        <nav aria-label="Principal">
          <a
            href="#configurador"
            onClick={(e) => {
              e.preventDefault();
              scrollToEl(document.getElementById('configurador')!);
            }}
          >
            Monte o seu
          </a>
        </nav>
        <span className="topbar__note">Site conceito</span>
      </header>

      <div className="hero__copy" ref={copy}>
        <h1 id="hero-title" className="hero__title">
          {BRAND.name}
        </h1>
        <p className="hero__lede">{BRAND.tagline}</p>
        <p className="hero__place">{BRAND.kind} nos Jardins, São Paulo</p>
      </div>

      <p className="hero__hint" aria-hidden>
        <span className="hero__hint-line" />
        Role devagar
      </p>
    </section>
  );
}
