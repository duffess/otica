/**
 * Paradas da câmera, uma por seção da página (na mesma ordem do DOM: data-scene).
 * pos/target: câmera e para onde ela olha. fit: largura mínima (em unidades) que
 * precisa caber na tela; em telas estreitas a câmera recua até caber.
 * screen: onde o alvo aparece, em fração da tela a partir do centro (+x direita, +y cima).
 * spin: 1 = óculos girando sozinho; 0 = parado no ângulo rotY.
 * explode: 0 montado, 1 desmontado em camadas. chart: 0 a 1, tabela de exame ao fundo.
 */
export interface Keyframe {
  pos: [number, number, number];
  target: [number, number, number];
  fit: number;
  screen: [number, number];
  spin: number;
  rotY: number;
  explode: number;
  chart: number;
  /** 0 a 1: hastes abrem para fora na dobradiça de mola. */
  flex: number;
}

type V3 = [number, number, number];
type KF = Record<string, Keyframe>;

const O = 0.45; // altura em que o óculos flutua

/**
 * Pontos medidos no óculos normalizado (1,4 de largura, frente para +z).
 * Dobradiça direita, centro da lente direita.
 */
const HINGE: V3 = [0.64, 0.03, 0.57];
const LENS_R: V3 = [0.29, 0, 0.676];

/** Ponto do óculos (espaço do modelo) no mundo, com o óculos girado em rotY. */
function world(p: V3, rotY: number): V3 {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  return [p[0] * c + p[2] * s, p[1] + O, -p[0] * s + p[2] * c];
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Tabela de exame: fica à frente do óculos, onde o rosto "olha". */
export const CHART_POS: V3 = [LENS_R[0], O + 0.02, 2.6];

const base = { spin: 0, explode: 0, chart: 0, flex: 0 };

// 2. armação: perto da dobradiça direita, girada para a câmera
const ROT_HINGE = -0.55;
const hinge = world(HINGE, ROT_HINGE);
// 3. lentes: atrás da lente direita, olhando para a frente, através dela
const lens = world(LENS_R, 0);
// 4. leveza: três quartos de cima, desmontado
const ROT_LIGHT = 0.02;

const desktop: KF = {
  abertura: { ...base, pos: [0, O + 0.3, 3.6], target: [0, O, 0], fit: 2.2, screen: [0, 0.06], spin: 1, rotY: 0 },
  armacao: { ...base, pos: add(hinge, [0.78, 0.2, 0.62]), target: hinge, fit: 0.2, screen: [0.14, 0], rotY: ROT_HINGE },
  lentes: { ...base, pos: add(lens, [0.05, 0.24, -0.92]), target: lens, fit: 0.2, screen: [0.2, 0], rotY: 0, chart: 1, flex: 1 },
  leveza: { ...base, pos: [-1.35, O + 0.95, 2.5], target: [0, O, 0.05], fit: 3.8, screen: [0.2, 0.03], rotY: ROT_LIGHT, explode: 1 },
  configurador: { ...base, pos: [-0.3, O + 0.22, 3.1], target: [0, O, 0], fit: 4.4, screen: [-0.21, 0.03], rotY: -0.42 },
};
desktop.rodape = desktop.configurador;

const mobile: KF = {
  abertura: { ...base, pos: [0, O + 0.34, 4.2], target: [0, O, 0], fit: 1.9, screen: [0, 0.1], spin: 1, rotY: 0 },
  armacao: { ...base, pos: add(hinge, [0.55, 0.2, 0.6]), target: hinge, fit: 0.55, screen: [0, 0.2], rotY: ROT_HINGE },
  lentes: { ...base, pos: add(lens, [0.02, 0.03, -1.0]), target: lens, fit: 0.62, screen: [0, 0.18], rotY: 0, chart: 1, flex: 1 },
  leveza: { ...base, pos: [-1.2, O + 1.0, 2.6], target: [-0.08, O, 0.05], fit: 2.05, screen: [0, 0.22], rotY: ROT_LIGHT, explode: 1 },
  // óculos no terço de cima da tela, painel embaixo
  configurador: { ...base, pos: [-0.2, O + 0.3, 3.6], target: [0, O, 0], fit: 2.0, screen: [0, 0.26], rotY: -0.42 },
};
mobile.rodape = mobile.configurador;

export const FLOAT_Y = O;
export const getKeyframes = (narrow: boolean) => (narrow ? mobile : desktop);
