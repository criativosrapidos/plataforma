"use client";

import { useState, useTransition } from "react";
import { dataHoraBR } from "@aviso/shared";
import { restaurarConfigAcao, salvarConfigAcao, salvarConfigBrutaAcao } from "@/lib/admin/acoes/sistema";
import type { DefConfig } from "@/lib/admin/config-defs";
import { centavosParaInput, inputParaCentavos } from "@/lib/admin/formato";
import { AcaoBotao, Girando } from "../AcaoBotao";
import { useToast } from "../Toasts";
import { botao, campoCls, cx, Etiqueta } from "../ui";

type DefSemSchema = Omit<DefConfig, "schema">;

function paraTexto(def: DefSemSchema, v: unknown) {
  if (def.tipo === "centavos") return centavosParaInput(typeof v === "number" ? v : Number(v));
  if (def.tipo === "numero") return String(v ?? "").replace(".", ",");
  return String(v ?? "");
}

/** Uma linha de configuração conhecida, com o editor certo para o tipo. */
export function LinhaConfig({ def, valor, atualizado, noBanco }: { def: DefSemSchema; valor: unknown; atualizado: string | null; noBanco: boolean }) {
  const [bool, setBool] = useState(valor === true);
  const [texto, setTexto] = useState(paraTexto(def, valor));
  const [pendente, iniciar] = useTransition();
  const toast = useToast();
  const sujo = def.tipo === "booleano" ? bool !== (valor === true) : texto !== paraTexto(def, valor);

  function salvar() {
    let v: unknown = texto;
    if (def.tipo === "booleano") v = bool;
    if (def.tipo === "numero") v = Number(texto.replace(",", "."));
    if (def.tipo === "centavos") v = inputParaCentavos(texto);
    iniciar(async () => {
      toast.resultado(await salvarConfigAcao(def.chave, v));
    });
  }

  return (
    <div className="grid gap-3 border-b border-linha/70 px-4 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {def.rotulo}
          {def.tipo === "booleano" && valor === true && <Etiqueta tom="verm">Ligado</Etiqueta>}
          {!noBanco && <Etiqueta>Padrão</Etiqueta>}
        </p>
        <p className="mt-0.5 text-[13px] text-tx2">{def.ajuda}</p>
        <p className="mt-1 font-mono text-[11px] text-tx2">
          {def.chave}
          {atualizado && ` · alterado ${dataHoraBR(atualizado)}`}
        </p>
      </div>
      <div className="flex items-start gap-2">
        {def.tipo === "booleano" ? (
          <button
            type="button"
            role="switch"
            aria-checked={bool}
            aria-label={def.rotulo}
            onClick={() => setBool(!bool)}
            className={cx("relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors", bool ? "bg-verm" : "bg-[#C9CCD6]")}
          >
            <span className={cx("absolute top-1 size-5 rounded-full bg-white shadow transition-all", bool ? "left-6" : "left-1")} />
          </button>
        ) : (
          <input
            className={cx(campoCls, "font-mono")}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            inputMode={def.tipo === "hora" ? "numeric" : "decimal"}
            placeholder={paraTexto(def, def.padrao)}
            aria-label={def.rotulo}
          />
        )}
        <button type="button" className={botao("primario", "md", "shrink-0")} disabled={!sujo || pendente} onClick={salvar}>
          {pendente && <Girando />} Salvar
        </button>
        {noBanco && (
          <AcaoBotao
            acao={restaurarConfigAcao.bind(null, def.chave)}
            rotulo="Padrão"
            variante="fantasma"
            titulo={`Voltar para ${paraTexto(def, def.padrao) || String(def.padrao)}`}
            confirmar={{ titulo: "Voltar ao valor padrão?", texto: `O valor passa a ser ${def.tipo === "booleano" ? (def.padrao ? "ligado" : "desligado") : paraTexto(def, def.padrao)}.`, botao: "Restaurar" }}
          />
        )}
      </div>
    </div>
  );
}

/** Chave livre (JSON). */
export function NovaChave() {
  const [chave, setChave] = useState("");
  const [valor, setValor] = useState("");
  const [pendente, iniciar] = useTransition();
  const toast = useToast();
  return (
    <form
      className="flex flex-wrap items-end gap-2 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          if (toast.resultado(await salvarConfigBrutaAcao(chave, valor))) {
            setChave("");
            setValor("");
          }
        });
      }}
    >
      <label className="flex-1">
        <span className="mb-1 block text-[12px] font-semibold text-tx2">Chave</span>
        <input className={cx(campoCls, "font-mono")} value={chave} onChange={(e) => setChave(e.target.value)} placeholder="limite_envios_hora" />
      </label>
      <label className="flex-1">
        <span className="mb-1 block text-[12px] font-semibold text-tx2">Valor (JSON)</span>
        <input className={cx(campoCls, "font-mono")} value={valor} onChange={(e) => setValor(e.target.value)} placeholder='500 ou "texto" ou {"a": 1}' />
      </label>
      <button type="submit" className={botao("sec")} disabled={pendente || !chave || !valor}>
        {pendente && <Girando />} Salvar chave
      </button>
    </form>
  );
}
