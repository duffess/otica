import type * as THREE from 'three';

/** As camadas do óculos que a rolagem anima (desmontar, aproximar etc.). */
export interface GlassesParts {
  root: THREE.Object3D;
  front: THREE.Object3D;
  lenses: THREE.Object3D;
  templeL: THREE.Object3D;
  templeR: THREE.Object3D;
  /** Uma malha da armação e a malha da lente, para calibrar os padrões do shader. */
  frameMesh: THREE.Mesh | null;
  lensMesh: THREE.Mesh | null;
  /** Eixo da dobradiça direita (x > 0) no espaço do óculos; a esquerda é o espelho em x. */
  hinge: THREE.Vector3;
}
