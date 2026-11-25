import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import fontUrl from '@fontsource/bodoni-moda/files/bodoni-moda-latin-400-normal.woff?url';
import { CHART_POS } from './keyframes';
import { rig } from './rig';

/**
 * 3. Lentes: tabela de exame de vista em Bodoni, à frente do óculos.
 * Vista por trás da lente, ela aparece refratada e ampliada pela curvatura simulada.
 * O material é opaco (o passe de transmission só enxerga objetos opacos); para sumir,
 * a cor vai até a cor do fundo e o objeto é escondido.
 */
const BG = new THREE.Color('#EEEBE6');
const INK = new THREE.Color('#1A1A1A');
const ROWS: [string, number][] = [
  ['E', 0.42],
  ['F     P', 0.22],
  ['T    O    Z', 0.15],
  ['L   P   E   D', 0.105],
  ['P  E  C  F  D', 0.075],
  ['E  D  F  C  Z  P', 0.055],
  ['F  E  L  O  P  Z  D', 0.04],
];

export function EyeChart() {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: BG, toneMapped: false, fog: false, side: THREE.DoubleSide }),
    [],
  );
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.chart > 0.01;
    // o troika marca o texto como transparente; opaco (com alphaTest) ele entra no passe de
    // transmission e aparece refratado através da lente
    for (const c of g.children) {
      const m = (c as THREE.Mesh).material as THREE.Material | undefined;
      if (m && m.transparent) {
        m.transparent = false;
        m.alphaTest = 0.5;
        m.needsUpdate = true;
      }
    }
    mat.color.copy(BG).lerp(INK, THREE.MathUtils.smoothstep(rig.chart, 0.2, 1));
  });

  let y = 0.78;
  return (
    // gira 180° para a frente do texto encarar o óculos
    <group ref={group} position={CHART_POS} rotation-y={Math.PI} visible={false}>
      {ROWS.map(([txt, size]) => {
        y -= size * 1.35;
        return (
          <Text key={txt} font={fontUrl} fontSize={size} position={[0, y + size * 0.6, 0]} anchorX="center" anchorY="middle" material={mat}>
            {txt}
          </Text>
        );
      })}
    </group>
  );
}
