import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { isLite, reducedMotion, usePlaceholder } from '../device';
import { frameById, lensById } from '../options';
import { store } from '../store';
import { applyFrame, applyLens, calibrate, createMaterials, type Materials } from './materials';
import { BlobShadow } from './BlobShadow';
import type { GlassesParts } from './parts';
import { PlaceholderGlasses } from './PlaceholderGlasses';
import { RealGlasses } from './RealGlasses';
import { EyeChart } from './EyeChart';
import { FLOAT_Y } from './keyframes';
import { rig, setupRig } from './rig';

const Effects = lazy(() => import('./Effects'));

const BG = '#EEEBE6';
const TAU = Math.PI * 2;

/** Câmera segue o "rig" da rolagem. Em telas estreitas recua até a largura `fit` caber. */
function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => setupRig(), []);
  useFrame(() => {
    target.set(rig.tx, rig.ty, rig.tz);
    dir.set(rig.px, rig.py, rig.pz).sub(target);
    const len = dir.length();
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
    const need = rig.fit / 2 / Math.tan(hfov / 2);
    const dist = Math.max(len, need);
    pos.copy(target).addScaledVector(dir.normalize(), dist);
    camera.position.copy(pos);
    camera.lookAt(target);
    // desloca câmera e alvo juntos para o óculos cair na posição de tela pedida
    const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const w = h * camera.aspect;
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(right, -rig.sx * w).addScaledVector(up, -rig.sy * h);
  });
  return null;
}

/** Troca de material com fade quando o visitante escolhe no configurador. */
function useMaterialSync(m: Materials) {
  useEffect(() => {
    let { frame, lens } = store.get();
    applyFrame(m, frameById(frame), true);
    applyLens(m, lensById(lens), true);
    return store.subscribe(() => {
      const s = store.get();
      if (s.frame !== frame) applyFrame(m, frameById((frame = s.frame)), reducedMotion);
      if (s.lens !== lens) applyLens(m, lensById((lens = s.lens)), reducedMotion);
    });
  }, [m]);
}

/** Gira a haste em torno do eixo da dobradiça (side = 1 direita, -1 esquerda) e depois desloca. */
const _pivot = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
function placeTemple(t: THREE.Object3D, hinge: THREE.Vector3, side: 1 | -1, angle: number, dx: number, dz: number) {
  _pivot.set(hinge.x * side, hinge.y, hinge.z);
  _q.setFromAxisAngle(_up, angle);
  t.quaternion.copy(_q);
  // posição = pivô - R·pivô (gira em volta do pivô) + deslocamento
  t.position.copy(_pivot).sub(_pivot.clone().applyQuaternion(_q));
  t.position.x += dx;
  t.position.z += dz;
}

function Glasses({ materials, low }: { materials: Materials; low: boolean }) {
  const holder = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const parts = useRef<GlassesParts | null>(null);
  const angle = useRef(0.35);
  // reflexo: uma cópia espelhada (escala y = -1) sob um chão quase opaco da cor do fundo
  const mirrorInner = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Group>(null);
  const [mirror, setMirror] = useState<{ root: THREE.Object3D; pairs: [THREE.Object3D, THREE.Object3D][] } | null>(null);

  const onParts = useCallback(
    (p: GlassesParts) => {
      if (parts.current === p) return;
      parts.current = p;
      calibrate(materials, p.root, p.frameMesh, p.lensMesh, p.lenses);
      const copy = p.root.clone(true);
      const a: THREE.Object3D[] = [];
      const b: THREE.Object3D[] = [];
      p.root.traverse((o) => a.push(o));
      copy.traverse((o) => {
        b.push(o);
        o.matrixAutoUpdate = false;
        o.castShadow = false;
        o.renderOrder = -2; // desenha antes do chão translúcido
      });
      setMirror({ root: copy, pairs: a.map((o, i) => [o, b[i]]) });
    },
    [materials],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const h = holder.current;
    const s = spinner.current;
    if (!h || !s) return;

    // giro: livre na abertura, assentando no ângulo da parada nas outras cenas
    const nearest = rig.rotY + TAU * Math.round((angle.current - rig.rotY) / TAU);
    // só em desenvolvimento: window.__snap = true pula direto para o ângulo final (testes com a aba oculta)
    const snap = import.meta.env.DEV && (window as unknown as { __snap?: boolean }).__snap;
    if (reducedMotion || snap) {
      angle.current = rig.spin > 0.5 ? 0.35 : nearest;
    } else {
      angle.current += dt * 0.32 * rig.spin;
      angle.current = THREE.MathUtils.damp(angle.current, nearest, 2.6 * (1 - rig.spin), dt);
    }
    s.rotation.y = angle.current;
    if (shadow.current) shadow.current.rotation.y = angle.current;

    // flutuação e um leve acompanhamento do mouse (só no computador)
    const t = state.clock.elapsedTime;
    h.position.y = FLOAT_Y + (reducedMotion ? 0 : Math.sin(t * 0.9) * 0.025);
    // nos closes (fit pequeno) o mouse quase não mexe, senão a dobradiça sai do quadro
    const follow = isLite || reducedMotion ? 0 : THREE.MathUtils.clamp(rig.fit / 2.2, 0.15, 1);
    const px = state.pointer.x * follow;
    const py = state.pointer.y * follow;
    h.rotation.x = THREE.MathUtils.damp(h.rotation.x, -0.04 - py * 0.06, 3, dt);
    h.rotation.z = THREE.MathUtils.damp(h.rotation.z, -px * 0.04, 3, dt);

    // 4. leveza: as lentes saem para a frente primeiro, depois as hastes para trás e para fora
    const p = parts.current;
    if (p) {
      const e = rig.explode;
      const a = THREE.MathUtils.smoothstep(e, 0, 0.65);
      const b = THREE.MathUtils.smoothstep(e, 0.3, 1);
      p.lenses.position.set(0, 0.04 * a, 0.5 * a);
      p.front.position.set(0, 0.02 * a, 0.14 * a);
      // 3. lentes: as hastes abrem na dobradiça de mola (e saem do caminho da câmera)
      const f = THREE.MathUtils.smoothstep(rig.flex, 0, 1) * 0.35;
      placeTemple(p.templeR, p.hinge, 1, -(f + 0.14 * b), 0.12 * b, -0.3 * b);
      placeTemple(p.templeL, p.hinge, -1, f + 0.14 * b, -0.12 * b, -0.3 * b);
    }

    if (mirror && mirrorInner.current) {
      s.updateWorldMatrix(true, false);
      mirrorInner.current.matrix.copy(s.matrixWorld);
      for (const [src, dst] of mirror.pairs) {
        if (src.matrixAutoUpdate) src.updateMatrix();
        dst.matrix.copy(src.matrix);
      }
    }
  });

  return (
    <>
      <group ref={holder} position-y={FLOAT_Y}>
        <group ref={spinner}>
          {usePlaceholder ? (
            <PlaceholderGlasses materials={materials} partsRef={onParts} />
          ) : (
            <RealGlasses materials={materials} partsRef={onParts} />
          )}
        </group>
      </group>
      <BlobShadow ref={shadow} />
      {mirror && !low && (
        <group scale-y={-1}>
          <group ref={mirrorInner} matrixAutoUpdate={false}>
            <primitive object={mirror.root} />
          </group>
        </group>
      )}
    </>
  );
}

/** Avisa a interface quando o modelo está na tela (os shaders são compilados antes). */
function ReadySignal() {
  const { gl, scene, camera } = useThree();
  useLayoutEffect(() => {
    let raf = 0;
    gl.compileAsync(scene, camera)
      .catch(() => {})
      .finally(() => {
        raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => store.set({ ready: true }))));
      });
    return () => cancelAnimationFrame(raf);
  }, [gl, scene, camera]);
  return null;
}

function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#cfc9c0']} />
      {/* softbox de cima: o brilho longo nas hastes */}
      <Lightformer form="rect" intensity={2.6} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
      {/* faixas laterais: recortam o contorno do aro */}
      <Lightformer form="rect" intensity={2.2} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[1.2, 7, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[5, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[1.2, 7, 1]} />
      {/* anel na frente: reflexo redondo e discreto nas lentes */}
      <Lightformer form="ring" intensity={1.6} position={[1.5, 1.5, 5]} scale={1.6} />
      {/* luz quente de chão, cor champanhe */}
      <Lightformer form="rect" color="#C8B08A" intensity={0.9} position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[10, 4, 1]} />
    </Environment>
  );
}

/** Chão da mesma cor do fundo: some no horizonte e deixa ver só um pouco do reflexo. */
function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} renderOrder={-1}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial color={BG} transparent opacity={isLite ? 0.9 : 0.87} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

function Scene() {
  const materials = useMemo(() => createMaterials(isLite), []);
  useMaterialSync(materials);
  // queda de desempenho medida em tempo real: baixa o DPR e tira reflexo e bloom
  const [low, setLow] = useState(false);
  const setDpr = useThree((s) => s.setDpr);
  return (
    <>
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          setLow(true);
          setDpr(isLite ? 1 : 1.25);
        }}
        onFallback={() => {
          setLow(true);
          setDpr(1);
        }}
      />
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 5, 13]} />
      <Studio />
      <CameraRig />
      <Suspense fallback={null}>
        <EyeChart />
      </Suspense>
      <Suspense fallback={null}>
        <Glasses materials={materials} low={low} />
        <ReadySignal />
      </Suspense>
      <Floor />
      {!isLite && (
        <Suspense fallback={null}>
          <Effects low={low} />
        </Suspense>
      )}
    </>
  );
}

export default function Experience() {
  return (
    <Canvas
      className="stage__canvas"
      dpr={isLite ? [1, 1.5] : [1, 2]}
      gl={{ antialias: isLite, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 30, near: 0.05, far: 40, position: [0, 0.78, 3.7] }}
      onCreated={({ gl, scene, camera }) => {
        if (import.meta.env.DEV) Object.assign(window, { __scene: scene, __gl: gl, __camera: camera });
        // no computador o tone mapping é feito no pós-processamento
        gl.toneMapping = isLite ? THREE.NeutralToneMapping : THREE.NoToneMapping;
      }}
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
      aria-hidden
    >
      <Scene />
    </Canvas>
  );
}
