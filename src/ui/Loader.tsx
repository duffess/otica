import { useEffect, useState } from 'react';
import { BRAND } from '../brand';
import { useStore } from '../store';

/** Tela de abertura com o progresso real do download do modelo. */
export function Loader() {
  const progress = useStore((s) => s.progress);
  const ready = useStore((s) => s.ready);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(t);
  }, [ready]);

  if (gone) return null;
  const pct = Math.round(progress * 100);
  const label = progress < 1 ? `${pct}%` : ready ? '' : 'Ajustando a luz';

  return (
    <div className={`loader${ready ? ' is-done' : ''}`} role="status" aria-live="polite">
      <p className="loader__brand">{BRAND.name}</p>
      <div className="loader__track" aria-hidden>
        <div className="loader__bar" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="loader__label">
        <span className="sr-only">Carregando o modelo 3D: </span>
        {label}
      </p>
    </div>
  );
}
