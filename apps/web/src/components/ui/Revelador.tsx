"use client";

import { useEffect } from "react";

/**
 * Liga as animações de "revelar ao rolar" ([data-revelar]) depois da hidratação.
 * Sem JS, ou com prefers-reduced-motion, tudo fica visível normalmente.
 */
export function Revelador() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const raiz = document.documentElement;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-visto", "");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
    );
    const procurar = () => {
      document.querySelectorAll("[data-revelar]:not([data-visto]):not([data-obs])").forEach((el) => {
        el.setAttribute("data-obs", "");
        io.observe(el);
      });
    };
    procurar();
    raiz.classList.add("ac-js");
    const mo = new MutationObserver(procurar);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      raiz.classList.remove("ac-js");
    };
  }, []);
  return null;
}
