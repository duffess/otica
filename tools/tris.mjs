import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRTextureTransform } from '@gltf-transform/extensions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
let t = 0; const per = [];
for (const m of doc.getRoot().listMeshes()) { let s = 0; for (const p of m.listPrimitives()) s += (p.getIndices()?.getCount() ?? 0) / 3; per.push(`${m.getName()}:${s}`); t += s; }
console.log(process.argv[2], 'total tris', t, '|', per.join(' '));
