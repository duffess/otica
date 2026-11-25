import { BRAND } from '../brand';
import { FRAMES, LENSES, frameById, lensById, type FrameId, type LensId } from '../options';
import { store, useStore } from '../store';
import { useReveal } from './useReveal';
import { isLite } from '../device';

interface Option {
  id: string;
  label: string;
  swatch: string;
}

function Choice({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = options.find((o) => o.id === value)!;
  return (
    <fieldset className="choice">
      <legend className="choice__legend">
        <span className="choice__name">{legend}</span>
        <span className="choice__current" aria-hidden>
          {current.label}
        </span>
      </legend>
      <div className="choice__row">
        {options.map((o) => (
          <label key={o.id} className="choice__opt">
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={o.id === value}
              onChange={() => onChange(o.id)}
            />
            <span className="choice__swatch" style={{ background: o.swatch }} aria-hidden />
            <span className="choice__label">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Configurator() {
  const frame = useStore((s) => s.frame);
  const lens = useStore((s) => s.lens);
  const panel = useReveal<HTMLDivElement>();
  const f = frameById(frame);
  const l = lensById(lens);

  const summary = `Armação ${f.label.toLowerCase()} com lente ${l.label.toLowerCase()}`;
  const message =
    `Olá! Vi o site da ${BRAND.name} e quero experimentar na loja: ` +
    `armação ${f.label.toLowerCase()} com lente ${l.label.toLowerCase()}. Quando posso passar aí?`;
  const href = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <section id="configurador" className="config" data-scene="configurador" data-index="05" data-label="Configurador" aria-labelledby="config-title">
      <div className="config__panel reveal" ref={panel}>
        <h2 id="config-title" className="config__title">
          Monte o <em>seu</em>.
        </h2>
        <p className="config__intro">Escolha o acabamento e a lente. O óculos muda na hora.</p>
        <p className="config__drag">
          <span aria-hidden>↻</span> {isLite ? 'Toque no óculos e arraste para girar.' : 'Arraste o óculos para girar.'}
        </p>

        <Choice
          name="armacao"
          legend="Armação"
          options={FRAMES}
          value={frame}
          onChange={(id) => store.set({ frame: id as FrameId })}
        />
        <Choice
          name="lente"
          legend="Lente"
          options={LENSES}
          value={lens}
          onChange={(id) => store.set({ lens: id as LensId })}
        />

        <p className="config__summary" aria-live="polite">
          {summary}.
        </p>
        <a className="btn" href={href} target="_blank" rel="noopener noreferrer">
          Quero experimentar na loja
          <span className="sr-only"> (abre o WhatsApp em uma nova aba)</span>
          <span className="btn__arrow" aria-hidden>
            →
          </span>
        </a>
        <p className="config__note">WhatsApp de exemplo. A mensagem já vai com a sua escolha.</p>
      </div>
    </section>
  );
}
