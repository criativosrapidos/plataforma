"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell, Campo } from "@/components/AuthShell";
import { Botao, Cartao, Destaque } from "@/components/ui";
import { PACOTES, linkWhatsApp, reais, type Pacote } from "@/lib/pacotes";


type Dados = Record<string, string>;

export function Pedido() {
  const inicial = useSearchParams().get("pacote");
  const [pacoteId, setPacoteId] = useState<Pacote["id"]>(PACOTES.some((p) => p.id === inicial) ? (inicial as Pacote["id"]) : "start");
  const [pagamento, setPagamento] = useState<"Pix" | "Cartão">("Pix");
  const [enviado, setEnviado] = useState<Dados | null>(null);
  const pacote = PACOTES.find((p) => p.id === pacoteId)!;

  if (enviado) {
    const texto = [
      `Olá! Quero o pacote ${pacote.nome} (${pacote.videos} reels + ${pacote.carrosseis} carrosséis) por ${reais(pacote.preco)}.`,
      `Nome: ${enviado.nome}`,
      `Marca: ${enviado.marca} (${enviado.instagram})`,
      `Segmento: ${enviado.segmento}`,
      `O que quero divulgar: ${enviado.objetivo}`,
      `Pagamento: ${pagamento}`,
    ].join("\n");
    const link = linkWhatsApp(texto);
    return (
      <AuthShell>
        <h1 className="text-4xl">
          Falta só o <Destaque>pagamento.</Destaque>
        </h1>
        <p className="mt-3 text-cinza">Confere o resumo. Depois do pagamento, a produção começa.</p>
        <Cartao className="mt-6 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xl font-extrabold">Pacote {pacote.nome}</p>
            <p className="text-xl font-extrabold">{reais(pacote.preco)}</p>
          </div>
          <p className="mt-1 text-sm text-cinza">
            {pacote.videos} {pacote.videos === 1 ? "reel" : "reels"} + {pacote.carrosseis} {pacote.carrosseis === 1 ? "carrossel" : "carrosséis"} ·
            entrega em até {pacote.prazoDiasUteis} dias úteis
          </p>
          <dl className="mt-4 space-y-1.5 border-t border-linha pt-4 text-sm">
            {[
              ["Marca", `${enviado.marca} · ${enviado.instagram}`],
              ["Segmento", enviado.segmento],
              ["Divulgar", enviado.objetivo],
              ["Pagamento", pagamento],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-24 shrink-0 text-cinza">{k}</dt>
                <dd className="min-w-0 break-words font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
        </Cartao>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-full bg-amarelo font-extrabold">
            Enviar pedido no WhatsApp
          </a>
        ) : (
          <p className="mt-6 rounded-xl bg-amarelo p-4 text-sm font-extrabold">
            Demonstração: o número do WhatsApp e o link de pagamento da HyperCash ainda não foram configurados.
          </p>
        )}
        <button onClick={() => setEnviado(null)} className="mt-4 text-sm font-extrabold underline">
          Voltar e editar
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-4xl">
        Bora criar o seu <Destaque>conteúdo.</Destaque>
      </h1>
      <p className="mt-3 text-cinza">Escolha o pacote e conte um pouco da sua marca.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setEnviado(Object.fromEntries(new FormData(e.currentTarget)) as Dados);
          window.scrollTo(0, 0);
        }}
      >
        <fieldset>
          <legend className="text-sm font-extrabold">Pacote</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {PACOTES.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPacoteId(p.id)}
                className={`rounded-xl border px-2 py-3 text-center transition ${pacoteId === p.id ? "border-preto bg-preto text-white" : "border-linha bg-white"}`}
              >
                <span className="block text-sm font-extrabold">{p.nome}</span>
                <span className={`block text-xs ${pacoteId === p.id ? "text-white/70" : "text-cinza"}`}>{reais(p.preco)}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-cinza">
            {pacote.videos} {pacote.videos === 1 ? "reel" : "reels"} + {pacote.carrosseis} {pacote.carrosseis === 1 ? "carrossel" : "carrosséis"} · entrega em até{" "}
            {pacote.prazoDiasUteis} dias úteis
          </p>
        </fieldset>

        <Campo id="nome" name="nome" label="Seu nome" placeholder="Como podemos te chamar?" required />
        <Campo id="whatsapp" name="whatsapp" label="WhatsApp" type="tel" placeholder="(71) 99999-9999" required />
        <Campo id="marca" name="marca" label="Nome da marca" placeholder="Ex.: Brasa Burger" required />
        <Campo id="instagram" name="instagram" label="Instagram da marca" placeholder="@suamarca" required />
        <Campo id="segmento" name="segmento" label="Segmento" placeholder="Ex.: hamburgueria, clínica, loja de roupa" required />
        <label className="block">
          <span className="text-sm font-extrabold">O que você quer divulgar?</span>
          <textarea
            id="objetivo"
            name="objetivo"
            rows={3}
            required
            placeholder="Ex.: o combo novo, a promoção de terça e mostrar a cozinha"
            className="mt-1.5 w-full rounded-xl border border-linha bg-white p-4 outline-none transition placeholder:text-cinza/60 focus:border-preto"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-extrabold">Pagamento</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["Pix", "Cartão"] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setPagamento(f)}
                className={`h-12 rounded-xl border text-sm font-extrabold ${pagamento === f ? "border-preto bg-preto text-white" : "border-linha bg-white"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </fieldset>

        <Botao type="submit" className="w-full" tamanho="lg">
          Continuar · {reais(pacote.preco)}
        </Botao>
        <p className="text-center text-xs text-cinza">
          Reembolso integral em até 7 dias, antes da entrega. <Link href="/" className="font-extrabold underline">Voltar ao site</Link>
        </p>
      </form>
    </AuthShell>
  );
}
