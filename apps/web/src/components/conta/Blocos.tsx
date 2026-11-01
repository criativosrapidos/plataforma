import clsx from "clsx";
import type { ReactNode } from "react";

export function CabecalhoConta({ rotulo, titulo, texto, acao }: { rotulo?: string; titulo: ReactNode; texto?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {rotulo ? <p className="rotulo text-azul">{rotulo}</p> : null}
        <h1 className="mt-2 text-[clamp(2.4rem,6vw,3.6rem)]">{titulo}</h1>
        {texto ? <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tx2">{texto}</p> : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}

/** Cartão de seção da área do cliente. */
export function Painel({
  titulo,
  descricao,
  children,
  className,
  acao,
  id,
  perigo,
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
  className?: string;
  acao?: ReactNode;
  id?: string;
  perigo?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id && titulo ? `${id}-t` : undefined}
      className={clsx("scroll-mt-28 rounded-[24px] border bg-branco p-5 sm:p-7", perigo ? "border-[#F3C3C5]" : "border-linha", className)}
    >
      {titulo || acao ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo ? (
              <h2 id={id ? `${id}-t` : undefined} className="font-sans text-xl leading-snug font-extrabold tracking-normal normal-case">
                {titulo}
              </h2>
            ) : null}
            {descricao ? <div className="mt-1 text-[15px] leading-relaxed text-tx2">{descricao}</div> : null}
          </div>
          {acao}
        </div>
      ) : null}
      {children ? <div className={titulo || acao ? "mt-5" : undefined}>{children}</div> : null}
    </section>
  );
}

export function Vazio({ icone, titulo, texto, acao }: { icone: ReactNode; titulo: ReactNode; texto?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#C7CBD6] bg-branco px-6 py-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-azul-t text-azul">{icone}</span>
      <p className="mt-4 text-lg font-extrabold">{titulo}</p>
      {texto ? <p className="mx-auto mt-1 max-w-md text-tx2">{texto}</p> : null}
      {acao ? <div className="mt-5 flex flex-wrap justify-center gap-3">{acao}</div> : null}
    </div>
  );
}
