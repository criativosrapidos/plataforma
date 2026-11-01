"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Resultado } from "@/lib/admin/resultado";
import { cx } from "./ui";

type TipoToast = "ok" | "erro" | "info";
interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

interface ApiToast {
  ok: (texto: string) => void;
  erro: (texto: string) => void;
  info: (texto: string) => void;
  /** Mostra o resultado de uma Server Action (sucesso ou erro) e devolve se deu certo. */
  resultado: (r: Resultado<unknown>, padraoOk?: string) => boolean;
}

const Ctx = createContext<ApiToast | null>(null);

export function useToast(): ApiToast {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast fora do ToastProvider");
  return c;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remover = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const add = useCallback(
    (tipo: TipoToast, texto: string) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-3), { id, tipo, texto }]);
      setTimeout(() => remover(id), tipo === "erro" ? 8000 : 4000);
    },
    [remover],
  );

  const api = useMemo<ApiToast>(
    () => ({
      ok: (t) => add("ok", t),
      erro: (t) => add("erro", t),
      info: (t) => add("info", t),
      resultado: (r, padraoOk = "Feito.") => {
        if (r.ok) add("ok", r.msg ?? padraoOk);
        else add("erro", r.erro);
        return r.ok;
      },
    }),
    [add],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "erro" ? "alert" : "status"}
            className={cx(
              "pointer-events-auto flex w-full items-start gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-[0_8px_30px_rgba(15,21,48,.25)]",
              "animate-[aparecer_.18s_ease-out]",
              t.tipo === "erro" ? "bg-[#7E1F24]" : "bg-tinta",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "mt-1 size-2.5 shrink-0 rounded-full",
                t.tipo === "ok" && "bg-[#3DD68C]",
                t.tipo === "erro" && "bg-[#FF8A8F]",
                t.tipo === "info" && "bg-marca",
              )}
            />
            <span className="flex-1 leading-snug">{t.texto}</span>
            <button type="button" onClick={() => remover(t.id)} className="-m-1 p-1 text-white/60 hover:text-white" aria-label="Fechar aviso">
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
