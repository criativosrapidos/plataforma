// Roteador em memória para a demonstração publicada (sem URL: funciona dentro de qualquer página).
import { createContext, useContext, useState, type ReactNode } from "react";

type Router = { caminho: string; ir: (href: string) => void };
const Ctx = createContext<Router>({ caminho: "/", ir: () => {} });

export function RouterProvider({ inicial, children }: { inicial: string; children: ReactNode }) {
  const [caminho, setCaminho] = useState(inicial);
  const ir = (href: string) => {
    const [rota, ancora] = href.split("#");
    if (!rota) {
      document.getElementById(ancora)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (ancora) {
      setCaminho(rota);
      setTimeout(() => document.getElementById(ancora)?.scrollIntoView(), 50);
      return;
    }
    setCaminho(href);
    window.scrollTo(0, 0);
  };
  return <Ctx.Provider value={{ caminho, ir }}>{children}</Ctx.Provider>;
}

export function useRouterDemo() {
  return useContext(Ctx);
}
