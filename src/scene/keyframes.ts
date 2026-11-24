/**
 * Paradas da câmera, uma por seção da página (na mesma ordem do DOM: data-scene).
 * pos/target: câmera e para onde ela olha. fit: largura mínima (em unidades) que
 * precisa caber na tela; em telas estreitas a câmera recua até caber.
 * screen: onde o óculos aparece, em fração da tela a partir do centro (+x direita, +y cima).
 * spin: 1 = óculos girando sozinho; 0 = parado no ângulo rotY.
 */
export interface Keyframe {
  pos: [number, number, number];
  target: [number, number, number];
  fit: number;
  screen: [number, number];
  spin: number;
  rotY: number;
  /** 0 a 1, usado na fase 2 (desmontar em camadas). */
  explode: number;
}

type KF = Record<string, Keyframe>;

const O = 0.45; // altura em que o óculos flutua

const desktop: KF = {
  abertura: { pos: [0, O + 0.3, 3.6], target: [0, O, 0], fit: 2.2, screen: [0, 0.06], spin: 1, rotY: 0, explode: 0 },
  configurador: { pos: [-0.3, O + 0.22, 3.1], target: [0, O, 0], fit: 4.4, screen: [-0.21, 0.03], spin: 0, rotY: -0.42, explode: 0 },
};
desktop.rodape = desktop.configurador;

const mobile: KF = {
  abertura: { pos: [0, O + 0.34, 4.2], target: [0, O, 0], fit: 1.9, screen: [0, 0.1], spin: 1, rotY: 0, explode: 0 },
  // óculos no terço de cima da tela, painel embaixo
  configurador: { pos: [-0.2, O + 0.3, 3.6], target: [0, O, 0], fit: 2.0, screen: [0, 0.26], spin: 0, rotY: -0.42, explode: 0 },
};
mobile.rodape = mobile.configurador;

export const FLOAT_Y = O;
export const getKeyframes = (narrow: boolean) => (narrow ? mobile : desktop);
