import { MODEL_URL, usePlaceholder } from './device';
import { store } from './store';

/**
 * Baixa o GLB com progresso real (bytes lidos / Content-Length) assim que a página abre,
 * antes mesmo do código 3D chegar. A cena usa a URL local (blob) que sai daqui.
 */
async function download(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`modelo: ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.byteLength;
    // sem Content-Length (servidor comprimindo), estima pelo tamanho conhecido do arquivo
    store.set({ progress: Math.min(0.99, got / (total || 330_000)) });
  }
  store.set({ progress: 1 });
  return URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'model/gltf-binary' }));
}

export const modelUrl: Promise<string> = usePlaceholder
  ? (store.set({ progress: 1 }), Promise.resolve(''))
  : download(MODEL_URL).catch((e) => {
      console.error(e);
      store.set({ progress: 1 });
      return MODEL_URL; // tenta de novo pelo carregador normal
    });
