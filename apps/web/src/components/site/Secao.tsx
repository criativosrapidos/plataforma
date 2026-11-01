import clsx from "clsx";
import type { ReactNode } from "react";

/** Cabeçalho padrão de seção: rótulo em mono, título condensado e texto de apoio. */
export function Cabecalho({
  rotulo,
  titulo,
  texto,
  escuro,
  centro,
  className,
  nivel = 2,
}: {
  rotulo?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  escuro?: boolean;
  centro?: boolean;
  className?: string;
  nivel?: 1 | 2;
}) {
  const H = nivel === 1 ? "h1" : "h2";
  return (
    <div className={clsx("max-w-3xl", centro && "mx-auto text-center", className)}>
      {rotulo ? <p className={clsx("rotulo", escuro ? "text-marca" : "text-azul")}>{rotulo}</p> : null}
      <H
        className={clsx(
          "mt-3",
          nivel === 1 ? "text-[clamp(2.9rem,8vw,5.4rem)]" : "text-[clamp(2.4rem,6vw,4rem)]",
          escuro ? "text-white" : "text-tinta",
        )}
      >
        {titulo}
      </H>
      {texto ? (
        <div className={clsx("mt-5 text-lg leading-relaxed md:text-xl", escuro ? "text-[#D6DCFA]" : "text-tx2")}>{texto}</div>
      ) : null}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>;
}

/** Selo de exemplo ilustrativo, sempre visível nos mockups. */
export function SeloExemplo({ escuro, className }: { escuro?: boolean; className?: string }) {
  return (
    <p className={clsx("font-mono text-[10.5px] font-bold tracking-[0.18em] uppercase", escuro ? "text-white/70" : "text-tx2", className)}>
      Exemplo ilustrativo
    </p>
  );
}
