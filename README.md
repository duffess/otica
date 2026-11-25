# Ombra · ótica premium em 3D (site conceito da LYSS)

Site demonstrativo: um óculos em 3D como protagonista, câmera guiada pela rolagem e um
configurador de armação e lente. A marca, o endereço, o horário e o WhatsApp são fictícios.

```
npm install
npm run dev      # http://localhost:5190
npm run build
npm run model    # regenera os GLB otimizados a partir de models-src/glasses_08.glb
```

Cenas (uma parada de câmera por seção, em `src/scene/keyframes.ts`): 01 abertura, 02 armação
(close da dobradiça), 03 lentes (por trás da lente, com tabela de exame refratada), 04 leveza
(desmonta em camadas), 05 configurador, 06 serviço.

- `?modelo=codigo` mostra o óculos modelado em código (placeholder) no lugar do GLB.
- `?movimento=reduzido` simula `prefers-reduced-motion`: sem Lenis, sem giro, cenas por corte.
- Celular/toque: modelo leve (19k tri), sem transmission (lentes e cristal por opacidade), DPR até 1.5,
  sem pós-processamento (o pedaço de código nem é baixado).
- Qualidade adaptativa (PerformanceMonitor): se o FPS cai, o DPR baixa e o reflexo e o bloom saem.

## Modelo 3D

"Glasses 08", de Dokono Kinokoda, licença CC BY 4.0
(https://sketchfab.com/3d-models/glasses-08-79436d34fb2b471e8861fa9d002b082f).
Modificado: simplificado (desktop ~56k, celular ~19k triângulos), comprimido com Meshopt,
textura em WebP e materiais trocados. O crédito está no rodapé do site.

O original (6,8 MB) fica em `models-src/`, fora do git.
