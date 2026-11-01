"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salvarFonteAcao } from "@/lib/admin/acoes/coleta";
import { FONTE_TIPO_ROTULO, FONTE_TIPOS } from "@/lib/admin/formato";
import { Girando } from "../AcaoBotao";
import { useToast } from "../Toasts";
import { botao, Campo, campoCls, cx } from "../ui";

const FREQS = [
  { v: 60, r: "1 h" },
  { v: 180, r: "3 h" },
  { v: 360, r: "6 h" },
  { v: 1440, r: "1 dia" },
];

export function FormFonte({
  id,
  inicial,
}: {
  id: string | null;
  inicial: { nome: string; slug: string; tipo: string; url: string; frequencia_min: number; ativo: boolean; config: string };
}) {
  const [f, setF] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();
  const toast = useToast();
  const router = useRouter();

  let erroJson: string | null = null;
  try {
    const v = JSON.parse(f.config || "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) erroJson = "Precisa ser um objeto { … }";
  } catch (e) {
    erroJson = e instanceof Error ? e.message : "JSON inválido";
  }
  const sujo = JSON.stringify(f) !== JSON.stringify(inicial);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (erroJson) return toast.erro("Corrija o JSON da configuração.");
    iniciar(async () => {
      const r = await salvarFonteAcao(id, {
        nome: f.nome,
        slug: id ? undefined : f.slug || undefined,
        tipo: f.tipo,
        url: f.url.trim() || null,
        frequencia_min: Number(f.frequencia_min),
        ativo: f.ativo,
        config: f.config,
      });
      setErros(r.ok ? {} : r.campos ?? {});
      if (toast.resultado(r) && r.ok && !id && r.dados) router.push(`/admin/fontes/${r.dados.id}`);
    });
  }

  return (
    <form onSubmit={salvar} className="space-y-3">
      <fieldset disabled={pendente} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Campo rotulo="Nome" erro={erros.nome} className="col-span-2">
          <input className={campoCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required />
        </Campo>
        {id ? (
          <Campo rotulo="Identificador" ajuda="Usado pelos jobs; não muda.">
            <input className={cx(campoCls, "font-mono")} value={f.slug} disabled />
          </Campo>
        ) : (
          <Campo rotulo="Identificador (opcional)" erro={erros.slug}>
            <input className={cx(campoCls, "font-mono")} value={f.slug} placeholder="diario-sp" onChange={(e) => setF({ ...f, slug: e.target.value })} />
          </Campo>
        )}
        <Campo rotulo="Tipo" erro={erros.tipo}>
          <select className={campoCls} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            {FONTE_TIPOS.map((t) => (
              <option key={t} value={t}>
                {FONTE_TIPO_ROTULO[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="URL" erro={erros.url} className="col-span-2 sm:col-span-4">
          <input type="url" className={cx(campoCls, "font-mono text-[12.5px]")} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        </Campo>
        <Campo rotulo="Frequência (minutos)" erro={erros.frequencia_min} className="col-span-2 sm:col-span-3">
          <div className="flex gap-1.5">
            <input
              type="number"
              min={5}
              className={cx(campoCls, "w-28 font-mono")}
              value={f.frequencia_min}
              onChange={(e) => setF({ ...f, frequencia_min: Number(e.target.value) })}
            />
            {FREQS.map((x) => (
              <button
                key={x.v}
                type="button"
                onClick={() => setF({ ...f, frequencia_min: x.v })}
                className={cx("min-h-10 whitespace-nowrap rounded-lg border px-2.5 font-mono text-[12px]", f.frequencia_min === x.v ? "border-tinta bg-tinta text-white" : "border-linha hover:border-tinta/40")}
              >
                {x.r}
              </button>
            ))}
          </div>
        </Campo>
        <label className="col-span-2 flex min-h-10 items-center gap-2 self-end text-[13px] sm:col-span-1">
          <input type="checkbox" className="size-4 accent-azul" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} />
          Ativa (coleta no horário)
        </label>
        <div className="col-span-2 sm:col-span-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-tx2">Configuração (JSON)</span>
            <button
              type="button"
              className={botao("fantasma", "sm")}
              disabled={!!erroJson}
              onClick={() => setF({ ...f, config: JSON.stringify(JSON.parse(f.config || "{}"), null, 2) })}
            >
              Formatar
            </button>
          </div>
          <textarea
            rows={10}
            spellCheck={false}
            className={cx(campoCls, "font-mono text-[12px] leading-relaxed", erroJson && "border-verm focus:border-verm")}
            value={f.config}
            onChange={(e) => setF({ ...f, config: e.target.value })}
            aria-invalid={!!erroJson}
          />
          <p className={cx("mt-1 text-[12px]", erroJson || erros.config ? "font-semibold text-verm" : "text-tx2")}>
            {erroJson ?? erros.config ?? "JSON válido. Ex.: seções do DOU, termos de busca, seletores da página da banca."}
          </p>
        </div>
      </fieldset>
      <div className="flex justify-end gap-2">
        {sujo && id && (
          <button type="button" className={botao("sec")} onClick={() => setF(inicial)} disabled={pendente}>
            Descartar
          </button>
        )}
        <button type="submit" className={botao("primario")} disabled={pendente || !!erroJson || (!!id && !sujo)}>
          {pendente && <Girando />} {id ? "Salvar fonte" : "Criar fonte"}
        </button>
      </div>
    </form>
  );
}
