// Lista cada malha do GLB: nó, material, triângulos e caixa (para saber o que é armação, lente, haste).
import { NodeIO } from '@gltf-transform/core';
import { getBounds } from '@gltf-transform/core';
const io = new NodeIO();
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const path = []; let p = node; while (p) { path.unshift(p.getName()); p = p.getParentNode?.() ?? null; }
  const b = getBounds(node);
  for (const prim of mesh.listPrimitives()) {
    const tris = (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
    const m = prim.getMaterial();
    const f = (v) => v.map((x) => x.toFixed(2)).join(',');
    console.log(`${mesh.getName().padEnd(10)} ${path.join('/').padEnd(60)} mat=${(m?.getName()??'').padEnd(11)} color=${m?f(m.getBaseColorFactor()):''} rough=${m?.getRoughnessFactor()} metal=${m?.getMetallicFactor()} tris=${tris} min=[${f(b.min)}] max=[${f(b.max)}]`);
  }
}
