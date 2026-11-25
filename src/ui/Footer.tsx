import { BRAND, CREDIT } from '../brand';

/**
 * Rodapé transparente: o fundo escuro é a própria cena 3D, que escurece quando ele entra.
 * O óculos termina girando dentro de .footer__stage (a câmera mede esse espaço).
 */
export function Footer() {
  return (
    <footer className="footer" data-scene="rodape">
      <div className="footer__text">
        <p className="footer__brand">{BRAND.name}</p>
        <p className="footer__lyss">
          Site conceito feito pela <strong>LYSS</strong>. {BRAND.name} é uma marca fictícia; endereço, horário e
          WhatsApp são exemplos.
        </p>
        <p className="footer__credit">
          Modelo 3D “
          <a href={CREDIT.modelUrl} target="_blank" rel="noopener noreferrer">
            {CREDIT.model}
          </a>
          ”, de {CREDIT.author}, licença{' '}
          <a href={CREDIT.licenseUrl} target="_blank" rel="noopener noreferrer">
            {CREDIT.license}
          </a>
          . Modificado: simplificado, comprimido e com materiais trocados.
        </p>
      </div>
      <div className="footer__stage" aria-hidden />
    </footer>
  );
}
