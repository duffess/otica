import { Bloom, EffectComposer, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Pós-processamento leve, só no computador (pedaço separado: o celular nem baixa).
 * Em aparelho lento (low) o bloom sai e fica só tone mapping + SMAA.
 */
export default function Effects({ low }: { low: boolean }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.1} intensity={low ? 0 : 0.22} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
    </EffectComposer>
  );
}
