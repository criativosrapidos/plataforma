"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icone } from "./Icone";

/** Diálogo modal com <dialog> nativo: foco preso, Esc fecha, fundo escurecido. */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  children,
  acoes,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: ReactNode;
  children: ReactNode;
  acoes?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tid = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={tid}
      onClose={aoFechar}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar();
      }}
      className="ac-dialogo m-auto w-[min(520px,calc(100vw-32px))] rounded-[24px] border border-linha bg-branco p-0 text-tinta shadow-2xl"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id={tid} className="text-[28px] leading-none sm:text-3xl">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-tx2 hover:bg-papel hover:text-tinta"
            aria-label="Fechar"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>
        <div className="mt-4 text-[15px] leading-relaxed text-tinta/85">{children}</div>
        {acoes ? <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{acoes}</div> : null}
      </div>
    </dialog>
  );
}
