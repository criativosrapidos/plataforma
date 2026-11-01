"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { Resultado } from "@/lib/admin/resultado";
import { Dialogo } from "./Dialogo";
import { useToast } from "./Toasts";
import { botao, campoCls } from "./ui";

export interface EntradaAcao {
  tipo: "texto" | "textarea" | "numero" | "data" | "select";
  rotulo: string;
  obrigatorio?: boolean;
  padrao?: string;
  placeholder?: string;
  opcoes?: { valor: string; rotulo: string }[];
  min?: number;
  max?: number;
  ajuda?: string;
}

/**
 * Botão que chama uma Server Action (já com o id "bindado"), com confirmação opcional,
 * um campo de entrada opcional (motivo, dias, data…) e toast com o resultado.
 */
export function AcaoBotao({
  acao,
  rotulo,
  variante = "sec",
  tamanho = "md",
  confirmar,
  entrada,
  depois,
  desabilitado,
  titulo,
  className,
}: {
  acao: (entrada?: string) => Promise<Resultado<unknown>>;
  rotulo: ReactNode;
  variante?: "primario" | "sec" | "perigo" | "fantasma" | "marca";
  tamanho?: "md" | "sm";
  confirmar?: { titulo: string; texto?: ReactNode; botao?: string; perigo?: boolean };
  entrada?: EntradaAcao;
  /** URL para navegar após sucesso. */
  depois?: string;
  desabilitado?: boolean;
  titulo?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(entrada?.padrao ?? "");
  const [pendente, iniciar] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const precisaDialogo = !!(confirmar || entrada);

  function executar() {
    if (entrada?.obrigatorio && !valor.trim()) {
      toast.erro(`Preencha: ${entrada.rotulo.toLowerCase()}.`);
      return;
    }
    iniciar(async () => {
      try {
        const r = await acao(entrada ? valor : undefined);
        if (toast.resultado(r)) {
          setAberto(false);
          if (depois) router.push(depois);
        }
      } catch {
        toast.erro("Não deu para falar com o servidor. Confira a conexão e tente de novo.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        title={titulo}
        disabled={desabilitado || pendente}
        onClick={() => (precisaDialogo ? setAberto(true) : executar())}
        className={botao(variante, tamanho, className)}
      >
        {pendente && !aberto ? <Girando /> : null}
        {rotulo}
      </button>
      {precisaDialogo && (
        <Dialogo
          aberto={aberto}
          aoFechar={() => !pendente && setAberto(false)}
          titulo={confirmar?.titulo ?? entrada?.rotulo ?? "Confirmar"}
          rodape={
            <>
              <button type="button" className={botao("sec")} onClick={() => setAberto(false)} disabled={pendente}>
                Cancelar
              </button>
              <button
                type="button"
                className={botao(confirmar?.perigo ? "perigo" : "primario")}
                onClick={executar}
                disabled={pendente}
                autoFocus={!entrada}
              >
                {pendente && <Girando />}
                {confirmar?.botao ?? "Confirmar"}
              </button>
            </>
          }
        >
          {confirmar?.texto && <div className="mb-3 leading-relaxed text-tx2">{confirmar.texto}</div>}
          {entrada && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executar();
              }}
            >
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-tx2">{entrada.rotulo}</span>
                {entrada.tipo === "textarea" ? (
                  <textarea
                    autoFocus
                    rows={3}
                    className={campoCls}
                    value={valor}
                    placeholder={entrada.placeholder}
                    onChange={(e) => setValor(e.target.value)}
                  />
                ) : entrada.tipo === "select" ? (
                  <select autoFocus className={campoCls} value={valor} onChange={(e) => setValor(e.target.value)}>
                    {entrada.opcoes?.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.rotulo}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    autoFocus
                    className={campoCls}
                    type={entrada.tipo === "numero" ? "number" : entrada.tipo === "data" ? "date" : "text"}
                    min={entrada.min}
                    max={entrada.max}
                    value={valor}
                    placeholder={entrada.placeholder}
                    onChange={(e) => setValor(e.target.value)}
                  />
                )}
                {entrada.ajuda && <span className="mt-1 block text-[12px] text-tx2">{entrada.ajuda}</span>}
              </label>
            </form>
          )}
        </Dialogo>
      )}
    </>
  );
}

export function Girando() {
  return <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}
