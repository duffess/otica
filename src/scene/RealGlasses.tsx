import { use, useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { modelUrl } from '../loadModel';
import type { Materials } from './materials';
import type { GlassesParts } from './parts';

/**
 * "Glasses 08" (Dokono Kinokoda, CC BY 4.0), otimizado com gltf-transform.
 *
 * O GLB tem 11 malhas separadas por tipo de peça, mas cada malha junta o lado
 * esquerdo e o direito. Aqui elas são reorganizadas em frente / lentes / hastes,
 * e as hastes são cortadas ao meio (pelo X de cada triângulo) em esquerda e direita.
 */

type Role = 'lens' | 'front' | 'pads' | 'temple' | 'tips';

// nomes dos NÓS do GLB (o three usa o nome do nó para a malha)
const ROLES: Record<string, Role> = {
  Object_2: 'lens', // as duas lentes
  Object_3: 'tips', // ponteiras pretas
  Object_4: 'pads', // plaquetas do nariz
  Object_5: 'front', // ponte
  Object_6: 'front', // barra superior
  Object_7: 'temple', // hastes
  Object_8: 'front', // terminais (onde a haste encaixa)
  Object_9: 'front', // aros
  Object_10: 'temple', // meio das hastes
  Object_11: 'front', // dobradiças
  Object_12: 'temple', // núcleo das hastes
};

/** Divide uma geometria indexada em duas (x < 0 e x >= 0), medindo no espaço do modelo. */
function splitByX(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const index = geometry.index;
  const count = index ? index.count : pos.count;
  const get = (i: number) => (index ? index.getX(i) : i);
  const left: number[] = [];
  const right: number[] = [];
  const v = new THREE.Vector3();
  for (let t = 0; t < count; t += 3) {
    let cx = 0;
    for (let k = 0; k < 3; k++) cx += v.fromBufferAttribute(pos, get(t + k)).applyMatrix4(matrix).x;
    (cx < 0 ? left : right).push(get(t), get(t + 1), get(t + 2));
  }
  const make = (ids: number[]) => {
    const g = new THREE.BufferGeometry();
    for (const [name, attr] of Object.entries(geometry.attributes)) g.setAttribute(name, attr);
    g.setIndex(ids);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  };
  return [make(left), make(right)] as const;
}

function build(scene: THREE.Group, m: Materials) {
  scene.updateMatrixWorld(true);
  const root = new THREE.Group();
  const inner = new THREE.Group();
  const front = new THREE.Group();
  const lenses = new THREE.Group();
  const templeL = new THREE.Group();
  const templeR = new THREE.Group();
  front.name = 'front';
  lenses.name = 'lenses';
  templeL.name = 'templeL';
  templeR.name = 'templeR';
  root.add(inner);
  inner.add(front, lenses, templeL, templeR);

  let frameMesh: THREE.Mesh | null = null;
  let lensMesh: THREE.Mesh | null = null;
  const unknown: string[] = [];

  let currentName = '';
  const add = (group: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, matrix: THREE.Matrix4, shadow = true) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = currentName;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(matrix);
    mesh.castShadow = shadow;
    group.add(mesh);
    return mesh;
  };

  scene.traverse((o) => {
    const src = o as THREE.Mesh;
    if (!src.isMesh) return;
    const role = ROLES[src.name];
    currentName = src.name;
    if (!role) unknown.push(src.name);
    const matrix = src.matrixWorld.clone();
    switch (role ?? 'front') {
      case 'lens':
        lensMesh = add(lenses, src.geometry, m.lens, matrix, false);
        break;
      case 'pads':
        add(front, src.geometry, m.pads, matrix, false);
        break;
      case 'tips':
      case 'temple': {
        const mat = role === 'tips' ? m.tips : m.frame;
        const [l, r] = splitByX(src.geometry, matrix);
        add(templeL, l, mat, matrix);
        add(templeR, r, mat, matrix);
        break;
      }
      default: {
        const mesh = add(front, src.geometry, m.frame, matrix);
        if (src.name === 'Object_9') frameMesh = mesh;
      }
    }
  });
  if (unknown.length) console.warn('[óculos] malhas sem papel definido (foram para a frente):', unknown);

  // normaliza: 1.4 unidades de largura (140 mm), centrado na origem
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = 1.4 / size.x;
  // a normalização vai para a matriz de cada malha: assim os grupos (frente, lentes,
  // hastes) ficam no espaço do óculos normalizado e os deslocamentos são em "decímetros"
  const norm = new THREE.Matrix4()
    .makeTranslation(-center.x * s, -center.y * s, -center.z * s)
    .multiply(new THREE.Matrix4().makeScale(s, s, s));
  inner.traverse((o) => (o as THREE.Mesh).isMesh && o.matrix.premultiply(norm));
  root.updateMatrixWorld(true);

  // medido no óculos normalizado (malha das dobradiças, Object_11)
  const hinge = new THREE.Vector3(0.64, 0.03, 0.57);
  const parts: GlassesParts = { root, front, lenses, templeL, templeR, frameMesh, lensMesh, hinge };
  return parts;
}

export function RealGlasses({ materials, partsRef }: { materials: Materials; partsRef: (p: GlassesParts) => void }) {
  const url = use(modelUrl);
  const { scene } = useGLTF(url);
  const parts = useMemo(() => build(scene, materials), [scene, materials]);
  useLayoutEffect(() => partsRef(parts), [parts, partsRef]);
  return <primitive object={parts.root} />;
}
