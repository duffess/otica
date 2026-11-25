import { useEffect, useRef } from 'react';

/** Adiciona .is-in quando o elemento entra na tela (uma vez). Use com a classe .reveal. */
export function useReveal<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && el.classList.add('is-in'), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}
