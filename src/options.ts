/** Opções do configurador. Os números alimentam os materiais em scene/materials.ts. */

export type FrameId = 'preto' | 'tartaruga' | 'champanhe' | 'cristal';
export type LensId = 'transparente' | 'fume' | 'degrade' | 'espelhada';

export interface FrameFinish {
  id: FrameId;
  label: string;
  /** Cor da amostra no botão. */
  swatch: string;
  color: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  /** 0 a 1: quanto do padrão de tartaruga aparece. */
  tortoise: number;
  /** 0 a 1: acetato transparente (no celular vira opacidade). */
  crystal: number;
}

export interface LensTint {
  id: LensId;
  label: string;
  swatch: string;
  color: string;
  /** 0 a 1: degradê de cima para baixo. */
  gradient: number;
  metalness: number;
  roughness: number;
  iridescence: number;
  /** Opacidade usada só no celular (sem transmission). */
  mobileOpacity: number;
}

export const FRAMES: FrameFinish[] = [
  { id: 'preto', label: 'Preto fosco', swatch: '#1b1b1b', color: '#141414', roughness: 0.62, metalness: 0.15, clearcoat: 0, tortoise: 0, crystal: 0 },
  { id: 'tartaruga', label: 'Tartaruga', swatch: 'radial-gradient(circle at 30% 35%, #c4813f 0 18%, #5a3a22 42%, #2a170c 75%)', color: '#ffffff', roughness: 0.2, metalness: 0, clearcoat: 1, tortoise: 1, crystal: 0 },
  { id: 'champanhe', label: 'Champanhe', swatch: 'linear-gradient(135deg, #e6d4b0, #c8b08a 55%, #9c845e)', color: '#d8bf93', roughness: 0.24, metalness: 1, clearcoat: 0, tortoise: 0, crystal: 0 },
  { id: 'cristal', label: 'Cristal', swatch: 'linear-gradient(135deg, #ffffff, #dcd8d1)', color: '#f4f1ec', roughness: 0.05, metalness: 0, clearcoat: 1, tortoise: 0, crystal: 1 },
];

export const LENSES: LensTint[] = [
  { id: 'transparente', label: 'Transparente', swatch: 'linear-gradient(135deg, #ffffff, #e7ecef)', color: '#ffffff', gradient: 0, metalness: 0, roughness: 0.02, iridescence: 0.12, mobileOpacity: 0.16 },
  { id: 'fume', label: 'Fumê', swatch: '#4b4b49', color: '#55534f', gradient: 0, metalness: 0, roughness: 0.03, iridescence: 0.1, mobileOpacity: 0.72 },
  { id: 'degrade', label: 'Degradê marrom', swatch: 'linear-gradient(180deg, #5a3a22, #c9a27e 70%, #efe6dc)', color: '#ffffff', gradient: 1, metalness: 0, roughness: 0.03, iridescence: 0.1, mobileOpacity: 0.5 },
  { id: 'espelhada', label: 'Espelhada', swatch: 'linear-gradient(135deg, #f4f6f8, #9aa3ad 50%, #d9c7a8)', color: '#d9dde2', gradient: 0, metalness: 1, roughness: 0.04, iridescence: 0.4, mobileOpacity: 0.96 },
];

export const frameById = (id: FrameId) => FRAMES.find((f) => f.id === id)!;
export const lensById = (id: LensId) => LENSES.find((l) => l.id === id)!;
