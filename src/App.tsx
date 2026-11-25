import { lazy, Suspense, useEffect } from 'react';
import { lockScroll, ScrollTrigger, startSmoothScroll } from './motion';
import { frameById, lensById } from './options';
import { useStore } from './store';
import { Chapters } from './ui/Chapter';
import { Configurator } from './ui/Configurator';
import { Footer } from './ui/Footer';
import { Hero } from './ui/Hero';
import { Loader } from './ui/Loader';
import { Service } from './ui/Service';

// three/fiber/drei chegam num pedaço separado, depois da tela de abertura
const Experience = lazy(() => import('./scene/Experience'));

export default function App() {
  const ready = useStore((s) => s.ready);
  const frame = useStore((s) => s.frame);
  const lens = useStore((s) => s.lens);

  useEffect(() => startSmoothScroll(), []);

  useEffect(() => {
    lockScroll(!ready);
    if (ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }, [ready]);

  return (
    <>
      <div
        className="stage"
        role="img"
        aria-label={`Óculos em 3D com armação ${frameById(frame).label.toLowerCase()} e lente ${lensById(lens).label.toLowerCase()}, sobre um fundo claro com reflexo suave no chão.`}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </div>

      <a className="skip" href="#configurador">
        Pular para o configurador
      </a>
      <main className="page">
        <Hero />
        <Chapters />
        <Configurator />
        <Service />
      </main>
      <Footer />
      <Loader />
    </>
  );
}
