"use client";

import { useState } from "react";
import { Botao, Cartao, Rotulo } from "@/components/ui";
import { MES_ATUAL } from "@/lib/mock";
import { CUSTO_CREDITOS, PACOTES_CREDITOS, PLANS, brl, getPlan, mensalNoAnual } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function Plano() {
  const { conta, setPlano, comprarCreditos, creditosRestantes, pecas, marcas } = useStore();
  const plano = getPlan(conta.plano);
  const [comprado, setComprado] = useState<string | null>(null);
  const total = plano.creditosMes + conta.creditosExtras;
  const pct = Math.min(100, Math.round((conta.creditosUsados / total) * 100));
  const renova = new Date(conta.renovaEm + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  const idsMarcas = new Set(marcas.map((m) => m.id));
  const doMes = pecas.filter((p) => idsMarcas.has(p.marcaId));
  const porTipo = Object.keys(CUSTO_CREDITOS).map((t) => ({ t, n: doMes.filter((p) => p.tipo === t).length }));

  return (
    <>
      <h1 className="text-3xl">Plano e uso</h1>

      <Cartao className="mt-5 bg-preto p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <Rotulo className="!text-white/60">Plano atual</Rotulo>
            <p className="mt-1 text-3xl font-extrabold">{plano.nome}</p>
          </div>
          <span className="rounded-full bg-amarelo px-3 py-1 text-xs font-extrabold text-preto">
            {plano.precoMensal ? `${brl(plano.precoAnual)}/ano` : "Grátis"}
          </span>
        </div>
        {plano.precoMensal > 0 && (
          <p className="mt-2 text-sm text-white/70">Anual · 12x de {brl(mensalNoAnual(plano))} · renova em outubro de 2027</p>
        )}

        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span>
              {conta.creditosUsados} de {total} créditos usados em {MES_ATUAL.nome.toLowerCase()}
            </span>
            <span className="font-extrabold">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-amarelo" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/70">
            {creditosRestantes} sobrando · {plano.creditosMes} do plano renovam em {renova}
            {conta.creditosExtras > 0 && ` · ${conta.creditosExtras} extras não expiram`}
          </p>
        </div>
      </Cartao>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
        {porTipo.map(({ t, n }) => (
          <Cartao key={t} className="p-3">
            <p className="text-xl font-extrabold">{n}</p>
            <p className="text-xs text-cinza">{{ post: "posts", anuncio: "anúncios", stories: "stories", carrossel: "carrosséis", video: "vídeos" }[t]}</p>
          </Cartao>
        ))}
      </div>

      <h2 className="mt-8 text-2xl">Comprar créditos</h2>
      {plano.comprarCreditos ? (
        <>
          <p className="mt-1 text-cinza">Pagamento no Pix ou cartão. Créditos extras não expiram.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PACOTES_CREDITOS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  comprarCreditos(p.creditos);
                  setComprado(`+${p.creditos} créditos adicionados.`);
                }}
                className={`relative rounded-xl border p-4 text-left transition hover:border-preto ${p.destaque ? "border-preto bg-white" : "border-linha bg-white"}`}
              >
                {p.destaque && (
                  <span className="absolute -top-2.5 left-3 rounded-full bg-amarelo px-2 text-[10px] font-extrabold">Melhor preço</span>
                )}
                <p className="text-2xl font-extrabold">+{p.creditos}</p>
                <p className="text-xs text-cinza">créditos</p>
                <p className="mt-2 text-sm font-extrabold">{brl(p.preco)}</p>
              </button>
            ))}
          </div>
          {comprado && <p className="mt-3 rounded-xl bg-amarelo px-4 py-3 text-sm font-extrabold">{comprado} (demonstração)</p>}
        </>
      ) : (
        <p className="mt-1 text-cinza">No plano Grátis não dá pra comprar créditos extras. Mude pro Básico e libere.</p>
      )}

      <h2 className="mt-8 text-2xl">Mudar de plano</h2>
      <p className="mt-1 text-cinza">Na demonstração, a troca é na hora pra você ver como cada plano funciona.</p>
      <div className="mt-4 space-y-2">
        {PLANS.map((p) => (
          <Cartao key={p.id} className={`flex items-center gap-3 p-4 ${p.id === plano.id ? "border-preto ring-1 ring-preto" : ""}`}>
            <div className="flex-1">
              <p className="font-extrabold">
                {p.nome} <span className="font-medium text-cinza">· {p.precoMensal ? `${brl(p.precoAnual)}/ano` : "R$ 0"}</span>
              </p>
              <p className="text-sm text-cinza">
                {p.creditosMes} créditos/mês · {p.marcas} {p.marcas === 1 ? "marca" : "marcas"} · {p.usuarios}{" "}
                {p.usuarios === 1 ? "usuário" : "usuários"}
              </p>
            </div>
            {p.id === plano.id ? (
              <span className="text-sm font-extrabold">Atual</span>
            ) : (
              <Botao tamanho="sm" variante={p.precoMensal > plano.precoMensal ? "primario" : "contorno"} onClick={() => setPlano(p.id)}>
                {p.precoMensal > plano.precoMensal ? "Fazer upgrade" : "Mudar"}
              </Botao>
            )}
          </Cartao>
        ))}
      </div>
    </>
  );
}
