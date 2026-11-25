import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rig } from './rig';

/**
 * Sombra de contato pintada: duas manchas suaves (frente mais escura, hastes mais leves)
 * que giram junto com o óculos. Substitui o ContactShadows do drei, que deixava um anel
 * serrilhado no chão claro, e custa quase nada no celular.
 */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(58,46,36,1)');
  grd.addColorStop(0.45, 'rgba(58,46,36,0.45)');
  grd.addColorStop(1, 'rgba(58,46,36,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const BlobShadow = forwardRef<THREE.Group>(function BlobShadow(_, ref) {
  const map = useMemo(blobTexture, []);
  const front = useRef<THREE.MeshBasicMaterial>(null);
  const back = useRef<THREE.MeshBasicMaterial>(null);
  // nos closes (dobradiça, lente) a sombra vista de perto vira uma mancha: some aos poucos
  useFrame(() => {
    const k = THREE.MathUtils.smoothstep(rig.fit, 0.7, 2);
    if (front.current) front.current.opacity = 0.34 * k;
    if (back.current) back.current.opacity = 0.12 * k;
  });
  const mat = (ref: React.RefObject<THREE.MeshBasicMaterial | null>, opacity: number) => (
    <meshBasicMaterial ref={ref} map={map} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} />
  );
  return (
    <group ref={ref} position-y={0.003}>
      {/* frente: aros e ponte */}
      <mesh rotation-x={-Math.PI / 2} position-z={0.62} scale={[1.75, 0.42, 1]} renderOrder={1}>
        <planeGeometry />
        {mat(front, 0.34)}
      </mesh>
      {/* hastes */}
      <mesh rotation-x={-Math.PI / 2} position-z={-0.1} scale={[1.7, 1.9, 1]} renderOrder={1}>
        <planeGeometry />
        {mat(back, 0.12)}
      </mesh>
    </group>
  );
});
