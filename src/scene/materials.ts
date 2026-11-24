import * as THREE from 'three';
import { gsap } from 'gsap';
import type { FrameFinish, LensTint } from '../options';

/**
 * Dois materiais compartilhados por todas as peças: um da armação e um das lentes.
 * O configurador anima os números deles (cor, rugosidade, metal, transmission...),
 * então a troca é sempre um fade suave, nunca um corte.
 *
 * Padrões que não dependem de UV (tartaruga e degradê) são feitos no shader,
 * a partir da posição do vértice. Assim funcionam igual no óculos em código e no GLB.
 */

const NOISE = /* glsl */ `
varying vec3 vObjPos;
float h3(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z);
}
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=.5; } return s; }
`;

function injectObjPos(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
}

export interface FrameUniforms {
  uTortoise: { value: number };
  uPatternScale: { value: number };
}

export interface LensUniforms {
  uGrad: { value: number };
  uGradColor: { value: THREE.Color };
  uUp: { value: THREE.Vector3 };
  uYMin: { value: number };
  uYMax: { value: number };
  uLite: { value: number };
}

export interface Materials {
  frame: THREE.MeshPhysicalMaterial;
  frameU: FrameUniforms;
  lens: THREE.MeshPhysicalMaterial;
  lensU: LensUniforms;
  /** Ponteiras e peças escuras que não mudam com o configurador. */
  tips: THREE.MeshPhysicalMaterial;
  /** Plaquetas de silicone. */
  pads: THREE.MeshPhysicalMaterial;
  lite: boolean;
}

let current: Materials | null = null;
export const getMaterials = () => current;

export function createMaterials(lite: boolean): Materials {
  if (current) return current;

  const frameU: FrameUniforms = { uTortoise: { value: 0 }, uPatternScale: { value: 6 } };
  const frame = new THREE.MeshPhysicalMaterial({
    color: '#d8bf93',
    roughness: 0.24,
    metalness: 1,
    clearcoatRoughness: 0.08,
    ior: 1.5,
    thickness: 0.08,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
  });
  frame.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, frameU);
    injectObjPos(s);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTortoise; uniform float uPatternScale;\n${NOISE}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        if (uTortoise > 0.001) {
          vec3 p = vObjPos * uPatternScale;
          float n = fbm(p + 1.6 * fbm(p * 0.45 + 3.1));
          // cores em espaço linear: âmbar, mel escuro e quase preto
          vec3 tc = mix(vec3(0.60, 0.25, 0.06), vec3(0.09, 0.035, 0.01), smoothstep(0.38, 0.52, n));
          tc = mix(tc, vec3(0.008, 0.004, 0.0015), smoothstep(0.52, 0.66, n));
          diffuseColor.rgb = mix(diffuseColor.rgb, tc, uTortoise);
        }`,
      );
  };
  frame.customProgramCacheKey = () => 'ombra-frame';

  const lensU: LensUniforms = {
    uGrad: { value: 0 },
    uGradColor: { value: new THREE.Color('#5a3a22') },
    uUp: { value: new THREE.Vector3(0, 1, 0) },
    uYMin: { value: -0.2 },
    uYMax: { value: 0.2 },
    uLite: { value: lite ? 1 : 0 },
  };
  const lens = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.02,
    metalness: 0,
    ior: 1.52,
    thickness: 0.025,
    transmission: lite ? 0 : 1,
    transparent: lite,
    opacity: lite ? 0.16 : 1,
    depthWrite: !lite,
    iridescence: 0.12,
    iridescenceIOR: 1.6,
    iridescenceThicknessMinimum: 180,
    iridescenceThicknessMaximum: 420,
    specularIntensity: 1,
    envMapIntensity: 1.25,
    side: THREE.DoubleSide,
  });
  lens.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, lensU);
    injectObjPos(s);
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uGrad; uniform vec3 uGradColor; uniform vec3 uUp; uniform float uYMin; uniform float uYMax; uniform float uLite;\nvarying vec3 vObjPos;`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        float gy = clamp((dot(vObjPos, uUp) - uYMin) / max(uYMax - uYMin, 1e-4), 0.0, 1.0);
        float g = smoothstep(0.1, 0.95, gy);
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(1.0), uGradColor, g), uGrad);
        diffuseColor.a = mix(diffuseColor.a, mix(0.1, 0.86, g), uGrad * uLite);`,
      );
  };
  lens.customProgramCacheKey = () => 'ombra-lens';

  const tips = new THREE.MeshPhysicalMaterial({ color: '#121110', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const pads = new THREE.MeshPhysicalMaterial({
    color: '#f1ede6',
    roughness: 0.25,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  current = { frame, frameU, lens, lensU, tips, pads, lite };
  return current;
}

const EASE = 'power2.inOut';

export function applyFrame(m: Materials, f: FrameFinish, instant = false) {
  const duration = instant ? 0 : 1.1;
  const c = new THREE.Color(f.color);
  gsap.to(m.frame, { roughness: f.roughness, metalness: f.metalness, clearcoat: f.clearcoat, duration, ease: EASE, overwrite: 'auto' });
  gsap.to(m.frame.color, { r: c.r, g: c.g, b: c.b, duration, ease: EASE, overwrite: 'auto' });
  gsap.to(m.frameU.uTortoise, { value: f.tortoise, duration, ease: EASE, overwrite: 'auto' });

  if (!m.lite) {
    gsap.to(m.frame, { transmission: f.crystal, duration, ease: EASE });
  } else {
    // Celular: sem transmission. Cristal vira acetato translúcido com opacidade.
    if (f.crystal > 0 && !m.frame.transparent) {
      m.frame.transparent = true;
      m.frame.needsUpdate = true;
    }
    gsap.to(m.frame, {
      opacity: 1 - 0.55 * f.crystal,
      duration,
      ease: EASE,
      onComplete: () => {
        if (f.crystal === 0 && m.frame.transparent) {
          m.frame.transparent = false;
          m.frame.needsUpdate = true;
        }
      },
    });
  }
}

export function applyLens(m: Materials, l: LensTint, instant = false) {
  const duration = instant ? 0 : 1.1;
  const c = new THREE.Color(l.color);
  gsap.to(m.lens.color, { r: c.r, g: c.g, b: c.b, duration, ease: EASE, overwrite: 'auto' });
  gsap.to(m.lens, {
    metalness: l.metalness,
    roughness: l.roughness,
    iridescence: l.iridescence,
    // lente espelhada reflete quase tudo; as outras deixam a luz passar
    ...(m.lite ? { opacity: l.mobileOpacity } : { transmission: l.metalness > 0.5 ? 0.25 : 1 }),
    duration,
    ease: EASE,
    overwrite: 'auto',
  });
  gsap.to(m.lensU.uGrad, { value: l.gradient, duration, ease: EASE, overwrite: 'auto' });
}

/**
 * Ajusta os uniforms que dependem da geometria: escala do padrão de tartaruga e
 * o eixo "para cima" do degradê, ambos medidos no espaço do óculos normalizado.
 */
export function calibrate(m: Materials, root: THREE.Object3D, frameMesh: THREE.Mesh | null, lensMesh: THREE.Mesh | null) {
  root.updateWorldMatrix(true, true);
  const rootInv = root.matrixWorld.clone().invert();
  if (frameMesh) {
    const rel = rootInv.clone().multiply(frameMesh.matrixWorld);
    // ~3 ciclos de ruído por unidade de cena (o óculos tem 1.4 de largura): manchas de ~1 cm
    m.frameU.uPatternScale.value = 3 * rel.getMaxScaleOnAxis();
  }
  if (lensMesh) {
    const rel = rootInv.clone().multiply(lensMesh.matrixWorld);
    const toLocal = rel.clone().invert();
    const up = new THREE.Vector3(0, 1, 0).transformDirection(toLocal);
    const pos = lensMesh.geometry.attributes.position as THREE.BufferAttribute;
    let min = Infinity;
    let max = -Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const d = v.fromBufferAttribute(pos, i).dot(up);
      if (d < min) min = d;
      if (d > max) max = d;
    }
    m.lensU.uUp.value.copy(up);
    m.lensU.uYMin.value = min;
    m.lensU.uYMax.value = max;
  }
}
