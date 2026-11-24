// Gera public/models/glasses-desktop.glb (~56k tri) e glasses-mobile.glb (~19k tri)
// a partir de models-src/glasses_08.glb. Mantém as malhas separadas (sem join/flatten),
// porque a cena separa frente, lentes e hastes pelo nome do nó.
import { execSync } from 'node:child_process';
const src = 'models-src/glasses_08.glb';
const jobs = [
  { out: 'public/models/glasses-desktop.glb', ratio: 0.27, error: 0.0015, tex: 1024 },
  { out: 'public/models/glasses-mobile.glb', ratio: 0.09, error: 0.006, tex: 512 },
];
for (const j of jobs) {
  execSync(
    `npx gltf-transform optimize ${src} ${j.out} --compress meshopt --texture-compress webp --texture-size ${j.tex} ` +
      `--join false --flatten false --palette false --instance false --simplify-ratio ${j.ratio} --simplify-error ${j.error}`,
    { stdio: 'inherit' },
  );
  execSync(`node tools/tris.mjs ${j.out}`, { stdio: 'inherit' });
}
