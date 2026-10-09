"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Miniatura } from "@/components/EntregaCard";
import { Botao, BotaoLink, Cartao, Rotulo } from "@/components/ui";
import { useCliente } from "@/lib/cliente-store";
import { MARCAS } from "@/lib/mock";

const LINK_BRIEFING = "criativosrapidos.com.br/briefing/brasa-7k2p";

function Instagram() {
  const { cliente, entregas, conectarInstagram, desconectarInstagram } = useCliente();
  const feed = entregas.filter((e) => e.status === "aprovada").slice(0, 6);
  const [etapa, setEtapa] = useState<"inicio" | "login" | "conectando">("inicio");
  const [usuario, setUsuario] = useState(cliente.instagram);
  const marca = MARCAS.find((m) => m.id === cliente.marcaId)!;

  if (cliente.instagramConectado) {
    return (
      <Cartao className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full font-extrabold" style={{ background: marca.cores[0], color: marca.cores[3] }}>
            {marca.iniciais}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">{cliente.instagram}</p>
            <p className="text-sm text-cinza tabular-nums">{cliente.seguidores.toLocaleString("pt-BR")} seguidores</p>
          </div>
          <span className="rounded-full bg-amarelo px-2.5 py-0.5 text-xs font-extrabold">Conectado</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1">
          {feed.map((e) => (
            <Miniatura key={e.id} e={e} />
          ))}
        </div>
        <p className="mt-3 text-xs text-cinza">Últimas postagens do perfil. A equipe usa pra manter o estilo do seu feed.</p>
        <button onClick={desconectarInstagram} className="mt-3 text-sm font-extrabold underline">
          Desconectar
        </button>
      </Cartao>
    );
  }

  return (
    <Cartao className="p-5">
      <p className="font-extrabold">Conecte o Instagram da marca</p>
      <p className="mt-1 text-sm text-cinza">A equipe vê o seu feed, mantém o estilo e acompanha os resultados. Não postamos nada sem você aprovar.</p>
      {etapa === "inicio" && (
        <Botao className="mt-4 w-full" onClick={() => setEtapa("login")}>
          Conectar Instagram
        </Botao>
      )}
      {etapa === "login" && (
        <form
          className="mt-4 space-y-3 rounded-xl bg-off p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setEtapa("conectando");
            setTimeout(() => conectarInstagram(usuario), 900);
          }}
        >
          <p className="text-xs font-extrabold text-cinza">Na versão real, aqui abre o login oficial do Instagram (Meta).</p>
          <label className="block" htmlFor="ig-usuario">
            <span className="text-sm font-extrabold">Usuário do Instagram</span>
            <input
              id="ig-usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border border-linha bg-white px-4 outline-none focus:border-preto"
            />
          </label>
          <Botao type="submit" className="w-full">
            Autorizar acesso
          </Botao>
        </form>
      )}
      {etapa === "conectando" && <p className="mt-4 animate-pulse text-sm font-extrabold">Conectando…</p>}
    </Cartao>
  );
}

export function Marca() {
  const { cliente } = useCliente();
  const salvo = useSearchParams().get("salvo");
  const [copiado, setCopiado] = useState(false);
  const b = cliente.briefing;

  return (
    <>
      <h1 className="text-3xl">Minha marca</h1>
      {salvo && <p className="mt-4 rounded-xl bg-amarelo px-4 py-3 text-sm font-extrabold">Briefing salvo. A equipe já recebeu.</p>}

      <section className="mt-6">
        <Rotulo>Instagram</Rotulo>
        <div className="mt-2">
          <Instagram />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <Rotulo>Briefing</Rotulo>
          {b && (
            <Link href="/cliente/briefing" className="text-sm font-extrabold underline">
              Editar
            </Link>
          )}
        </div>
        {b ? (
          <Cartao className="mt-2 divide-y divide-linha">
            {[
              ["Segmento", b.segmento],
              ["Destaques", b.produtos],
              ["Público", b.publico],
              ["Diferencial", b.diferencial],
              ["Tom", b.tom],
              ["Evitar", b.evitar],
              ["Este mês", b.datas],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-3 p-4 text-sm">
                  <span className="w-24 shrink-0 text-cinza">{k}</span>
                  <span className="min-w-0 font-extrabold">{v}</span>
                </div>
              ))}
            <div className="flex items-center gap-3 p-4 text-sm">
              <span className="w-24 shrink-0 text-cinza">Cores</span>
              <span className="flex gap-1.5">
                {b.cores.map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full border border-linha" style={{ background: c }} />
                ))}
              </span>
            </div>
            <div className="flex gap-3 p-4 text-sm">
              <span className="w-24 shrink-0 text-cinza">Arquivos</span>
              <span className="flex min-w-0 flex-wrap gap-1.5">
                {b.arquivos.map((a) => (
                  <span key={a} className="rounded-full bg-off px-2.5 py-0.5 text-xs font-extrabold">
                    {a}
                  </span>
                ))}
              </span>
            </div>
          </Cartao>
        ) : (
          <Cartao className="mt-2 p-5">
            <p className="font-extrabold">Briefing ainda não preenchido</p>
            <BotaoLink href="/cliente/briefing" className="mt-3">
              Preencher agora
            </BotaoLink>
          </Cartao>
        )}

        <Cartao className="mt-3 p-4">
          <p className="text-sm font-extrabold">Link do briefing</p>
          <p className="mt-0.5 text-xs text-cinza">Mande pra quem cuida do marketing preencher no seu lugar.</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-off p-2 pl-3 text-sm">
            <span className="min-w-0 flex-1 select-all truncate">{LINK_BRIEFING}</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://${LINK_BRIEFING}`).then(
                  () => setCopiado(true),
                  () => setCopiado(false),
                );
              }}
              className="shrink-0 rounded-full bg-preto px-3 py-1 text-xs font-extrabold text-white"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <Link href="/briefing" className="mt-2 inline-block text-xs font-extrabold underline">
            Ver como o link abre
          </Link>
        </Cartao>
      </section>

      <section className="mt-8">
        <Rotulo>Conta</Rotulo>
        <Cartao className="mt-2 divide-y divide-linha">
          {[
            ["Responsável", cliente.nome],
            ["WhatsApp", "(71) 99999-0000"],
            ["Pagamento", "Pix · pacote Max"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 p-4 text-sm">
              <span className="text-cinza">{k}</span>
              <span className="font-extrabold">{v}</span>
            </div>
          ))}
        </Cartao>
        <Link href="/" className="mt-6 block text-center text-sm font-extrabold underline">
          Sair
        </Link>
      </section>
    </>
  );
}
