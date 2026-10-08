"use client";

import { useRouter } from "next/navigation";
import { BotaoLink, Cartao } from "@/components/ui";
import { getPlan } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function Marcas() {
  const router = useRouter();
  const { marcas, marcaAtiva, setMarcaAtiva, pecas, conta } = useStore();
  const plano = getPlan(conta.plano);

  return (
    <>
      <h1 className="text-3xl">Marcas</h1>
      <p className="mt-1 text-cinza">
        {marcas.length} de {plano.marcas} {plano.marcas === 1 ? "marca" : "marcas"} no plano {plano.nome}.
      </p>

      <div className="mt-5 space-y-2">
        {marcas.map((m) => {
          const doMes = pecas.filter((p) => p.marcaId === m.id);
          const aAprovar = doMes.filter((p) => p.status === "a_aprovar").length;
          const ativa = m.id === marcaAtiva.id;
          return (
            <button
              key={m.id}
              className="block w-full text-left"
              onClick={() => {
                setMarcaAtiva(m.id);
                router.push("/app");
              }}
            >
              <Cartao className={`flex items-center gap-3 p-4 transition hover:border-preto ${ativa ? "border-preto ring-1 ring-preto" : ""}`}>
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-extrabold"
                  style={{ background: m.cores[0], color: m.cores[3] }}
                >
                  {m.iniciais}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{m.nome}</p>
                  <p className="truncate text-sm text-cinza">
                    {m.instagram} · {m.segmento}
                  </p>
                </div>
                <div className="text-right">
                  {aAprovar > 0 ? (
                    <span className="rounded-full bg-amarelo px-2.5 py-0.5 text-xs font-extrabold">{aAprovar} a aprovar</span>
                  ) : (
                    <span className="text-xs text-cinza">Em dia</span>
                  )}
                  {ativa && <p className="mt-1 text-xs font-extrabold">Ativa</p>}
                </div>
              </Cartao>
            </button>
          );
        })}
      </div>

      {plano.marcas > marcas.length ? (
        <BotaoLink href="/onboarding" variante="contorno" className="mt-4 w-full">
          + Adicionar marca
        </BotaoLink>
      ) : (
        <Cartao className="mt-4 bg-preto p-5 text-white">
          <p className="font-extrabold">Cuida de mais de uma marca?</p>
          <p className="mt-1 text-sm text-white/70">
            No Profissional você tem até 5 marcas, 3 usuários e link de aprovação pro seu cliente.
          </p>
          <BotaoLink href="/app/plano" tamanho="sm" className="mt-4">
            Conhecer o Profissional
          </BotaoLink>
        </Cartao>
      )}

      {plano.linkAprovacao && (
        <Cartao className="mt-4 p-5">
          <p className="font-extrabold">Link de aprovação do cliente</p>
          <p className="mt-1 text-sm text-cinza">Seu cliente abre, aprova ou pede ajuste sem precisar de conta. Com a sua logo.</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-off p-2 pl-3 text-sm">
            <span className="flex-1 truncate">criativosrapidos.com.br/aprovar/{marcaAtiva.id}-out26</span>
            <span className="rounded-full bg-preto px-3 py-1 text-xs font-extrabold text-white">Copiar</span>
          </div>
        </Cartao>
      )}
    </>
  );
}
