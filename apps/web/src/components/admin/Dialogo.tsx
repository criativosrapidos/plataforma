"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./ui";

/** Modal acessível sobre <dialog> nativo (foco preso, Esc fecha). */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  children,
  rodape,
  largura = "md",
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: ReactNode;
  children?: ReactNode;
  rodape?: ReactNode;
  largura?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar();
      }}
      className={cx(
        "m-auto w-[calc(100%-2rem)] rounded-2xl border border-linha bg-branco p-0 text-tinta shadow-[0_20px_60px_rgba(15,21,48,.3)] backdrop:bg-tinta/40",
        largura === "md" ? "max-w-md" : "max-w-2xl",
      )}
    >
      {aberto && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-linha px-5 py-4">
            <h2 className="font-sans text-base font-bold normal-case tracking-normal">{titulo}</h2>
            <button type="button" onClick={aoFechar} className="-m-2 grid size-9 place-items-center rounded-lg text-xl text-tx2 hover:bg-papel" aria-label="Fechar">
              ×
            </button>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4 text-sm">{children}</div>}
          {rodape && <div className="flex flex-wrap justify-end gap-2 border-t border-linha px-5 py-3">{rodape}</div>}
        </div>
      )}
    </dialog>
  );
}
