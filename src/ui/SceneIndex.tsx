import { useEffect, useState } from 'react';
import { ScrollTrigger } from '../motion';

/**
 * Índice discreto da cena atual (computador): "02 — Armação".
 * Lê data-index/data-label das seções; some na abertura, no serviço e no rodapé.
 * É decorativo: cada seção já tem o próprio título para leitores de tela.
 */
export function SceneIndex() {
  const [cur, setCur] = useState<{ num: string; label: string } | null>(null);

  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return;
          const { index, label } = el.dataset;
          setCur(index && label ? { num: index, label } : null);
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <div className={`scene-index${cur ? ' is-on' : ''}`} aria-hidden>
      <span className="scene-index__num">{cur?.num ?? '02'}</span>
      <span className="scene-index__bar" />
      <span>{cur?.label ?? ''}</span>
    </div>
  );
}
