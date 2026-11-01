"use client";

import { useEffect, useRef } from "react";

/**
 * Número que conta de 0 até o valor quando aparece na tela.
 * O HTML já vem com o valor final (sem JS e para leitores de tela); se já estiver visível ao carregar, não anima.
 */
export function Contagem({ ate, duracao = 1200, className }: { ate: number; duracao?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.textContent = "0";
    let quadro = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          const suave = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(ate * suave));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(quadro);
      el.textContent = String(ate);
    };
  }, [ate, duracao]);
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {ate}
    </span>
  );
}
