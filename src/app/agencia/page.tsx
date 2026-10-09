"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Cartao, Rotulo } from "@/components/ui";
import { CLIENTES_AGENCIA } from "@/lib/cliente";
import { PACOTES, reais } from "@/lib/pacotes";

// Painel interno da agência: todos os clientes, o que falta entregar e o que está parado.
export default function Agencia() {
  const [copiado, setCopiado] = useState<string | null>(null);
  const linhas = CLIENTES_AGENCIA.map((c) => {
    const p = PACOTES.find((x) => x.id === c.pacote)!;
    const total = p.videos + p.carrosseis;
    return { ...c, p, total, falta: total - c.entregues };
  }).sort((a, b) => Number(a.falta === 0) - Number(b.falta === 0) || a.prazo.localeCompare(b.prazo));

  const receita = linhas.reduce((s, l) => s + l.p.preco, 0);
  const aProduzir = linhas.reduce((s, l) => s + l.falta, 0);
  const aguardando = linhas.reduce((s, l) => s + l.aprovar, 0);
  const ajustes = linhas.reduce((s, l) => s + l.ajustes, 0);

  return (
    <main className="min-h-dvh bg-off">
      <header className="border-b border-linha bg-preto text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo escuro />
          <span className="rounded-full bg-amarelo px-3 py-1 text-xs font-extrabold text-preto">Equipe</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-3xl">Painel da agência</h1>
        <p className="mt-1 text-cinza">Pedidos de outubro: primeiro os de prazo mais curto, os concluídos no fim.</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Vendido no mês", reais(receita)],
            ["Peças a produzir", aProduzir],
            ["Esperando cliente", aguardando],
            ["Ajustes pedidos", ajustes],
          ].map(([t, v]) => (
            <Cartao key={t} className="p-4">
              <p className="text-2xl font-extrabold tabular-nums">{v}</p>
              <p className="text-xs font-extrabold text-cinza">{t}</p>
            </Cartao>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {linhas.map((l) => {
            const atrasado = l.prazo < "2026-10-09" && l.falta > 0;
            return (
              <Cartao key={l.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold">{l.marca}</p>
                    <p className="text-sm text-cinza">
                      {l.instagram} · Pacote {l.p.nome} · {reais(l.p.preco)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!l.briefing && <span className="rounded-full bg-amarelo px-2.5 py-0.5 text-xs font-extrabold">Sem briefing</span>}
                    {l.ajustes > 0 && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold ring-1 ring-preto">{l.ajustes} ajuste</span>}
                    {l.falta === 0 ? (
                      <span className="rounded-full bg-preto px-2.5 py-0.5 text-xs font-extrabold text-white">Concluído</span>
                    ) : (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${atrasado ? "bg-preto text-amarelo" : "bg-linha"}`}>
                        Prazo {new Date(l.prazo + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-linha">
                    <div className="h-full rounded-full bg-preto" style={{ width: `${(l.entregues / l.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-extrabold tabular-nums">
                    {l.entregues}/{l.total}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {l.aprovar > 0 && <span className="text-cinza">{l.aprovar} esperando aprovação do cliente</span>}
                  <span className="flex-1" />
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`https://criativosrapidos.com.br/briefing/${l.id}`).then(
                        () => setCopiado(l.id),
                        () => setCopiado(null),
                      );
                    }}
                    className="rounded-full bg-off px-3 py-1 text-xs font-extrabold ring-1 ring-linha"
                  >
                    {copiado === l.id ? "Link copiado" : "Copiar link do briefing"}
                  </button>
                  {l.id === "c1" && (
                    <Link href="/cliente" className="rounded-full bg-amarelo px-3 py-1 text-xs font-extrabold">
                      Ver como cliente
                    </Link>
                  )}
                </div>
              </Cartao>
            );
          })}
        </div>

        <Rotulo className="mt-8">Próximo passo</Rotulo>
        <p className="mt-1 text-sm text-cinza">Na versão real, a equipe sobe os arquivos de cada peça aqui e o cliente recebe aviso no WhatsApp.</p>
      </div>
    </main>
  );
}
