"use client";

import Link from "next/link";
import { EntregaLinha } from "@/components/EntregaCard";
import { BotaoLink, Cartao, Rotulo } from "@/components/ui";
import { useCliente } from "@/lib/cliente-store";
import { PACOTES, reais } from "@/lib/pacotes";

function Barra({ feito, total, rotulo }: { feito: number; total: number; rotulo: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-extrabold">{rotulo}</span>
        <span className="tabular-nums text-cinza">
          {feito} de {total}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-amarelo" style={{ width: `${(feito / total) * 100}%` }} />
      </div>
    </div>
  );
}

export default function Inicio() {
  const { cliente, entregas, contar } = useCliente();
  const pacote = PACOTES.find((p) => p.id === cliente.pacote)!;
  const entregues = (t: "video" | "carrossel") => entregas.filter((e) => e.tipo === t && e.status !== "producao").length;
  const paraAprovar = entregas.filter((e) => e.status === "aprovar");
  const proximas = entregas.filter((e) => e.status === "aprovada" && e.data >= "2026-10-09").slice(0, 3);
  const pendencias = [
    !cliente.briefing && { t: "Preencha o briefing", d: "Sem ele a produção não começa.", href: "/cliente/briefing" },
    !cliente.instagramConectado && { t: "Conecte o Instagram", d: "Pra gente acompanhar o perfil e os resultados.", href: "/cliente/marca" },
  ].filter(Boolean) as { t: string; d: string; href: string }[];

  return (
    <>
      <p className="text-sm font-extrabold text-cinza">Olá, {cliente.nome.split(" ")[0]}</p>
      <h1 className="text-3xl">Seu conteúdo de outubro</h1>

      {pendencias.map((p) => (
        <Link key={p.t} href={p.href} className="mt-4 flex items-center gap-3 rounded-xl bg-amarelo p-4">
          <div className="flex-1">
            <p className="font-extrabold">{p.t}</p>
            <p className="text-sm">{p.d}</p>
          </div>
          <span className="font-extrabold">→</span>
        </Link>
      ))}

      <Cartao className="mt-5 space-y-4 bg-preto p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <Rotulo className="!text-white/60">Pacote {pacote.nome}</Rotulo>
            <p className="mt-1 text-2xl font-extrabold">
              {entregues("video") + entregues("carrossel")} de {pacote.videos + pacote.carrosseis} peças entregues
            </p>
          </div>
        </div>
        <Barra feito={entregues("video")} total={pacote.videos} rotulo="Reels" />
        <Barra feito={entregues("carrossel")} total={pacote.carrosseis} rotulo="Carrosséis" />
        <p className="text-xs text-white/70">
          Comprado em {new Date(cliente.compradoEm + "T12:00").toLocaleDateString("pt-BR")} · entrega completa em até {pacote.prazoDiasUteis} dias úteis
        </p>
      </Cartao>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ["aprovar", "Para aprovar"],
            ["ajuste", "Em ajuste"],
            ["aprovada", "Aprovadas"],
          ] as const
        ).map(([s, t]) => (
          <Link
            key={s}
            href={`/cliente/entregas?status=${s}`}
            className={`rounded-xl border p-3 ${s === "aprovar" && contar(s) > 0 ? "border-amarelo bg-amarelo" : "border-linha bg-white"}`}
          >
            <span className="block text-2xl font-extrabold tabular-nums">{contar(s)}</span>
            <span className="block text-xs font-extrabold">{t}</span>
          </Link>
        ))}
      </div>

      {paraAprovar.length > 0 && (
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl">Esperando você</h2>
            <Link href="/cliente/entregas?status=aprovar" className="text-sm font-extrabold underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {paraAprovar.map((e) => (
              <EntregaLinha key={e.id} e={e} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl">Próximas postagens</h2>
          <Link href="/cliente/calendario" className="text-sm font-extrabold underline">
            Calendário
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {proximas.length ? proximas.map((e) => <EntregaLinha key={e.id} e={e} />) : <p className="text-cinza">Nada aprovado pra os próximos dias.</p>}
        </div>
      </section>

      <Cartao className="mt-8 p-5">
        <p className="font-extrabold">Quer mais conteúdo?</p>
        <p className="mt-1 text-sm text-cinza">
          Renove ou troque de pacote. O Max sai a {reais(PACOTES[2].preco / (PACOTES[2].videos + PACOTES[2].carrosseis))} por peça.
        </p>
        <BotaoLink href="/pedido?pacote=max" tamanho="sm" className="mt-4">
          Comprar novo pacote
        </BotaoLink>
      </Cartao>
    </>
  );
}
