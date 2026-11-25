import type { ReactNode } from 'react';
import { useReveal } from './useReveal';

interface Props {
  scene: string;
  number: string;
  label: string;
  title: ReactNode;
  children: ReactNode;
  specs: [string, string][];
  /** Lado do texto no computador (o óculos fica do outro lado). */
  side: 'left' | 'right';
}

/** Uma parada da câmera: o texto fica preso na tela enquanto o óculos está em cena. */
export function Chapter({ scene, number, label, title, children, specs, side }: Props) {
  const copy = useReveal<HTMLDivElement>(0.25);
  const id = `cap-${scene}`;
  return (
    <section
      className={`chapter chapter--${side} chapter--${scene}`}
      data-scene={scene}
      data-index={number}
      data-label={label}
      aria-labelledby={id}
    >
      <div className="chapter__sticky">
        <div className="chapter__copy reveal" ref={copy}>
          <h2 id={id} className="chapter__title">
            {title}
          </h2>
          <p className="chapter__text">{children}</p>
          <dl className="chapter__specs">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Chapters() {
  return (
    <>
      <Chapter
        scene="armacao"
        number="02"
        label="Armação"
        side="left"
        title={
          <>
            Titânio, <em>à mão</em>.
          </>
        }
        specs={[
          ['Material', 'Titânio beta'],
          ['Acabamento', 'Polido e escovado à mão'],
          ['Dobradiça', 'Mola de cinco tempos'],
        ]}
      >
        Leve, flexível e sem níquel. A dobradiça com mola abre, fecha e volta ao lugar sozinha, ano após ano.
      </Chapter>
      <Chapter
        scene="lentes"
        number="03"
        label="Lentes"
        side="left"
        title={
          <>
            Nitidez <em>sem reflexo</em>.
          </>
        }
        specs={[
          ['Antirreflexo', 'Sete camadas'],
          ['Luz azul', 'Filtro para telas'],
          ['Proteção', 'UV400'],
        ]}
      >
        Antirreflexo em camadas e filtro de luz azul: menos cansaço no fim do dia e uma imagem limpa em qualquer luz.
      </Chapter>
      <Chapter
        scene="leveza"
        number="04"
        label="Leveza"
        side="left"
        title={
          <>
            Quase <em>nada</em>.
          </>
        }
        specs={[
          ['Peças', 'Frente, lentes e hastes'],
          ['Peso', '14 gramas'],
          ['Ajuste', 'Feito no seu rosto'],
        ]}
      >
        Três camadas pensadas para pesar o mínimo. No rosto, você esquece que está usando.
      </Chapter>
    </>
  );
}
