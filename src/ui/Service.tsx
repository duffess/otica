import { BRAND } from '../brand';
import { useReveal } from './useReveal';

const SERVICES: [string, string][] = [
  ['Exame de vista', 'Em sala própria, com hora marcada. Sem pressa e sem fila: cerca de 30 minutos.'],
  ['Ajuste', 'Plaquetas e hastes moldadas ao seu rosto na entrega, e de novo sempre que precisar, sem custo.'],
  ['Garantia', 'Dois anos para a armação e um ano para as lentes contra defeitos de fabricação.'],
];

export function Service() {
  const ref = useReveal<HTMLDivElement>(0.15);
  const msg = `Olá! Quero agendar um exame de vista na ${BRAND.name}. Qual o próximo horário livre?`;
  const href = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`;
  return (
    <section className="service" data-scene="servico" aria-labelledby="service-title">
      <div className="service__inner reveal" ref={ref}>
        <h2 id="service-title" className="service__title">
          Cuidado <em>de perto</em>.
        </h2>

        <ul className="service__list">
          {SERVICES.map(([t, d], i) => (
            <li key={t}>
              <span className="service__idx" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ul>

        <div className="service__visit">
          <address>
            <span className="service__label">Endereço</span>
            {BRAND.address}
          </address>
          <p>
            <span className="service__label">Horário</span>
            {BRAND.hours}
          </p>
          <a className="btn" href={href} target="_blank" rel="noopener noreferrer">
            Agendar exame
            <span className="sr-only"> (abre o WhatsApp em uma nova aba)</span>
            <span className="btn__arrow" aria-hidden>
              →
            </span>
          </a>
        </div>
        <p className="service__note">Endereço, horário e WhatsApp são exemplos: a {BRAND.name} é uma marca fictícia.</p>
      </div>
    </section>
  );
}
