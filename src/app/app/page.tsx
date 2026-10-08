"use client";

import Link from "next/link";
import { useState } from "react";
import { PecaPreview } from "@/components/PecaPreview";
import { StatusBadge } from "@/components/StatusBadge";
import { Cartao } from "@/components/ui";
import { MES_ATUAL, STATUS_LABEL, TIPO_LABEL, type StatusPeca } from "@/lib/mock";
import { getPlan } from "@/lib/plans";
import { useStore } from "@/lib/store";

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export default function Painel() {
  const { pecasDaMarca, marcaAtiva, conta, creditosRestantes } = useStore();
  const [visao, setVisao] = useState<"calendario" | "lista">("calendario");
  const [filtro, setFiltro] = useState<StatusPeca | "todas">("todas");
  const plano = getPlan(conta.plano);

  const { ano, mes, nome } = MES_ATUAL;
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const celulas = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];

  const porDia = new Map<number, typeof pecasDaMarca>();
  for (const p of pecasDaMarca) {
    const d = Number(p.data.slice(8, 10));
    porDia.set(d, [...(porDia.get(d) ?? []), p]);
  }

  const conta_ = (s: StatusPeca) => pecasDaMarca.filter((p) => p.status === s).length;
  const lista = pecasDaMarca.filter((p) => filtro === "todas" || p.status === filtro);
  const usoPct = Math.min(100, Math.round((conta.creditosUsados / (plano.creditosMes + conta.creditosExtras)) * 100));

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-extrabold text-cinza">{marcaAtiva.nome}</p>
          <h1 className="text-3xl">
            {nome} {ano}
          </h1>
        </div>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-linha">
          {(["calendario", "lista"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${visao === v ? "bg-preto text-white" : "text-cinza"}`}
            >
              {v === "calendario" ? "Calendário" : "Lista"}
            </button>
          ))}
        </div>
      </div>

      {/* resumo */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {(["a_aprovar", "aprovada", "baixada"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setFiltro(filtro === s ? "todas" : s);
              setVisao("lista");
            }}
            className={`rounded-xl border p-3 text-left transition ${
              filtro === s ? "border-preto bg-preto text-white" : s === "a_aprovar" ? "border-amarelo bg-amarelo" : "border-linha bg-white"
            }`}
          >
            <span className="block text-2xl font-extrabold">{conta_(s)}</span>
            <span className="block text-xs font-extrabold">{s === "a_aprovar" ? "A aprovar" : s === "aprovada" ? "Aprovadas" : "Baixadas"}</span>
          </button>
        ))}
      </div>

      {/* uso */}
      <Link href="/app/plano" className="mt-3 block">
        <Cartao className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-extrabold">Plano {plano.nome}</span>
            <span className="text-cinza">{creditosRestantes} créditos sobrando</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-linha">
            <div className="h-full rounded-full bg-preto" style={{ width: `${usoPct}%` }} />
          </div>
        </Cartao>
      </Link>

      {visao === "calendario" ? (
        <Cartao className="mt-5 p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-cinza">
            {DIAS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celulas.map((dia, i) => {
              const pecas = dia ? porDia.get(dia) : undefined;
              const p = pecas?.[0];
              return (
                <div key={i} className={`min-h-16 rounded-md p-0.5 ${dia ? "bg-off" : ""}`}>
                  {dia && <span className="block px-0.5 text-[10px] font-extrabold text-cinza">{dia}</span>}
                  {p && (
                    <Link href={`/app/peca/${p.id}`} className="relative mt-0.5 block">
                      <PecaPreview peca={{ ...p, formato: "4:5" }} marca={marcaAtiva} tamanho="mini" />
                      <span
                        className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                          p.status === "a_aprovar" ? "bg-amarelo" : p.status === "aprovada" ? "bg-preto" : "bg-linha"
                        }`}
                      />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 px-1 text-xs text-cinza">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amarelo" /> A aprovar</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-preto" /> Aprovada</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-linha" /> Baixada</span>
          </div>
        </Cartao>
      ) : (
        <div className="mt-5 space-y-2">
          {filtro !== "todas" && (
            <button onClick={() => setFiltro("todas")} className="text-sm font-extrabold underline">
              Mostrando: {STATUS_LABEL[filtro]} · ver todas
            </button>
          )}
          {lista.map((p) => (
            <Link key={p.id} href={`/app/peca/${p.id}`}>
              <Cartao className="mb-2 flex items-center gap-3 p-3 transition hover:border-preto">
                <div className="w-14 shrink-0">
                  <PecaPreview peca={{ ...p, formato: "4:5" }} marca={marcaAtiva} tamanho="mini" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-cinza">
                    {new Date(p.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} · {p.hora} ·{" "}
                    {TIPO_LABEL[p.tipo]}
                  </p>
                  <p className="truncate font-extrabold">{p.titulo}</p>
                </div>
                <StatusBadge status={p.status} />
              </Cartao>
            </Link>
          ))}
          {lista.length === 0 && <p className="py-10 text-center text-cinza">Nenhuma peça aqui.</p>}
        </div>
      )}
    </>
  );
}
