import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { GlassesParts } from './parts';
import type { Materials } from './materials';

/**
 * Óculos modelado em código: usado com ?modelo=codigo e como reserva.
 * Medidas em "decímetros" (1 unidade = 100 mm): frente com ~140 mm de largura.
 * Peças separadas em frente / lentes / hastes, igual ao modelo real.
 */

const LENS_W = 0.52;
const LENS_H = 0.4;
const LENS_X = 0.31; // centro de cada lente
const RIM = 0.05; // espessura do aro (acetato)
const DEPTH = 0.055;

/** Superelipse levemente "panto": mais larga em cima, mais redonda embaixo. */
function lensOutline(w: number, h: number, n = 2.6, steps = 96) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    let x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * (w / 2);
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * (h / 2);
    // aperta a parte de baixo, perto do nariz
    if (y < 0) x *= 1 - 0.1 * (-y / (h / 2));
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

function rimGeometry(side: 1 | -1) {
  const outer = lensOutline(LENS_W + RIM * 2, LENS_H + RIM * 2);
  const inner = lensOutline(LENS_W, LENS_H);
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(inner.slice().reverse()));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 4,
    curveSegments: 48,
  });
  g.translate(side * LENS_X, 0, -DEPTH / 2);
  // inclina levemente cada aro para trás nas pontas (curvatura da frente)
  g.rotateY(side * -0.07);
  return g;
}

function lensGeometry(side: 1 | -1) {
  const shape = new THREE.Shape(lensOutline(LENS_W + 0.012, LENS_H + 0.012));
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: false, curveSegments: 48 });
  g.translate(side * LENS_X, 0, -0.009);
  g.rotateY(side * -0.07);
  return g;
}

function bridgeGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.07, 0.11, 0),
    new THREE.Vector3(-0.035, 0.145, 0.004),
    new THREE.Vector3(0, 0.155, 0.006),
    new THREE.Vector3(0.035, 0.145, 0.004),
    new THREE.Vector3(0.07, 0.11, 0),
  ]);
  return new THREE.TubeGeometry(curve, 32, 0.03, 16, false);
}

function endPieceGeometry(side: 1 | -1) {
  const g = new THREE.BoxGeometry(0.06, 0.12, 0.09, 2, 2, 2);
  g.translate(side * (LENS_X + LENS_W / 2 + RIM - 0.005), 0.1, -0.05);
  return g;
}

function templeGeometry(side: 1 | -1) {
  const x = side * (LENS_X + LENS_W / 2 + RIM + 0.012);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x, 0.1, -0.08),
    new THREE.Vector3(x + side * 0.02, 0.1, -0.5),
    new THREE.Vector3(x + side * 0.015, 0.09, -1.05),
    new THREE.Vector3(x + side * 0.0, 0.0, -1.3),
    new THREE.Vector3(x - side * 0.01, -0.16, -1.42),
  ]);
  const g = new THREE.TubeGeometry(curve, 80, 0.022, 12, false);
  return g;
}

export function PlaceholderGlasses({ materials, partsRef }: { materials: Materials; partsRef: (p: GlassesParts) => void }) {
  const geo = useMemo(
    () => ({
      rimL: rimGeometry(-1),
      rimR: rimGeometry(1),
      lensL: lensGeometry(-1),
      lensR: lensGeometry(1),
      bridge: bridgeGeometry(),
      endL: endPieceGeometry(-1),
      endR: endPieceGeometry(1),
      templeL: templeGeometry(-1),
      templeR: templeGeometry(1),
    }),
    [],
  );

  const rootRef = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const byName = (n: string) => root.getObjectByName(n) as THREE.Group;
    const lensMesh = byName('lenses').children[0] as THREE.Mesh;
    const frameMesh = byName('front').children[0] as THREE.Mesh;
    partsRef({ root, front: byName('front'), lenses: byName('lenses'), templeL: byName('templeL'), templeR: byName('templeR'), frameMesh, lensMesh, hinge: new THREE.Vector3(LENS_X + LENS_W / 2 + RIM, 0.1, -0.08) });
  }, [partsRef]);

  return (
    <group ref={rootRef}>
      <group name="front">
        <mesh geometry={geo.rimL} material={materials.frame} castShadow />
        <mesh geometry={geo.rimR} material={materials.frame} castShadow />
        <mesh geometry={geo.bridge} material={materials.frame} castShadow />
        <mesh geometry={geo.endL} material={materials.frame} castShadow />
        <mesh geometry={geo.endR} material={materials.frame} castShadow />
      </group>
      <group name="lenses">
        <mesh geometry={geo.lensL} material={materials.lens} />
        <mesh geometry={geo.lensR} material={materials.lens} />
      </group>
      <group name="templeL">
        <mesh geometry={geo.templeL} material={materials.frame} castShadow />
      </group>
      <group name="templeR">
        <mesh geometry={geo.templeR} material={materials.frame} castShadow />
      </group>
    </group>
  );
}
