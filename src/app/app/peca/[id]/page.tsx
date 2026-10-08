"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PecaPreview } from "@/components/PecaPreview";
import { StatusBadge } from "@/components/StatusBadge";
import { Botao, BotaoLink, Cartao } from "@/components/ui";
import { MARCAS, TIPO_LABEL } from "@/lib/mock";
import { CUSTO_CREDITOS, getPlan } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function PecaPage() {
  const { id } = useParams<{ id: string }>();
  const { pecas, conta, setStatus, setLegenda, regenerar, creditosRestantes } = useStore();
  const peca = pecas.find((p) => p.id === id);
  const [slide, setSlide] = useState(0);
  const [ajustando, setAjustando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  if (!peca) {
    return (
      <div className="py-20 text-center">
        <p className="text-cinza">Peça não encontrada.</p>
        <BotaoLink href="/app" className="mt-4">
          Voltar ao painel
        </BotaoLink>
      </div>
    );
  }

  const marca = MARCAS.find((m) => m.id === peca.marcaId)!;
  const plano = getPlan(conta.plano);
  const bloqueada = (peca.tipo === "video" && !plano.videos) || (peca.tipo === "anuncio" && !plano.anuncios);
  const custo = CUSTO_CREDITOS[peca.tipo];
  const totalSlides = peca.tipo === "carrossel" ? (peca.slides?.length ?? 0) + 1 : 1;

  function gerarDeNovo(msg: string) {
    setGerando(true);
    setTimeout(() => {
      setGerando(false);
      const ok = regenerar(peca!.id);
      setAviso(ok ? msg : "Seus créditos acabaram. Compre um pacote extra pra continuar.");
      setAjustando(false);
      setSlide(0);
    }, 1200);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm font-extrabold">
          ← Painel
        </Link>
        <StatusBadge status={peca.status} />
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <div className={`relative mx-auto ${peca.formato === "9:16" ? "max-w-[280px]" : "max-w-[340px]"}`}>
            <div className={gerando || bloqueada ? "blur-sm" : ""}>
              <PecaPreview peca={peca} marca={marca} slide={slide} marcaDagua={plano.marcaDagua} />
            </div>
            {gerando && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="animate-pulse rounded-full bg-amarelo px-4 py-2 text-sm font-extrabold">Gerando…</span>
              </div>
            )}
            {bloqueada && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="font-extrabold">{TIPO_LABEL[peca.tipo]} é do plano Básico pra cima</p>
                  <BotaoLink href="/app/plano" tamanho="sm" className="mt-3">
                    Ver planos
                  </BotaoLink>
                </div>
              </div>
            )}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={() => setSlide((s) => Math.max(0, s - 1))}
                  disabled={slide === 0}
                  className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white font-extrabold shadow disabled:opacity-0"
                  aria-label="Slide anterior"
                >
                  ‹
                </button>
                <button
                  onClick={() => setSlide((s) => Math.min(totalSlides - 1, s + 1))}
                  disabled={slide === totalSlides - 1}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white font-extrabold shadow disabled:opacity-0"
                  aria-label="Próximo slide"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {totalSlides > 1 && (
            <p className="mt-2 text-center text-xs font-extrabold text-cinza">
              Slide {slide + 1} de {totalSlides}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-extrabold text-cinza">
            {TIPO_LABEL[peca.tipo]} · {peca.formato} ·{" "}
            {new Date(peca.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}, {peca.hora}
          </p>
          <h1 className="mt-1 text-3xl">{peca.titulo}</h1>

          {aviso && (
            <div className="mt-4 rounded-xl bg-amarelo px-4 py-3 text-sm font-extrabold">
              {aviso}
              <button onClick={() => setAviso(null)} className="float-right">
                ✕
              </button>
            </div>
          )}

          <label className="mt-5 block">
            <span className="text-sm font-extrabold">Legenda</span>
            <textarea
              value={peca.legenda}
              onChange={(e) => setLegenda(peca.id, e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-linha bg-white p-4 outline-none focus:border-preto"
            />
          </label>
          <p className="mt-2 text-sm text-cinza">{peca.hashtags.join(" ")}</p>

          {ajustando && (
            <Cartao className="mt-4 p-4">
              <label className="block">
                <span className="text-sm font-extrabold">O que você quer mudar?</span>
                <textarea
                  rows={3}
                  placeholder="Ex.: troca o título por algo mais curto e coloca o preço em destaque"
                  className="mt-1.5 w-full rounded-xl border border-linha bg-off p-3 outline-none focus:border-preto"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <Botao tamanho="sm" onClick={() => gerarDeNovo("Pronto! Ajuste aplicado.")}>
                  Aplicar ajuste · {custo} crédito{custo > 1 ? "s" : ""}
                </Botao>
                <Botao tamanho="sm" variante="fantasma" onClick={() => setAjustando(false)}>
                  Cancelar
                </Botao>
              </div>
            </Cartao>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Botao
              className="col-span-2"
              disabled={bloqueada || peca.status !== "a_aprovar"}
              onClick={() => {
                setStatus(peca.id, "aprovada");
                setAviso("Peça aprovada. Agora é só baixar.");
              }}
            >
              {peca.status === "a_aprovar" ? "Aprovar" : "Aprovada ✓"}
            </Botao>
            <Botao variante="contorno" disabled={bloqueada || gerando} onClick={() => setAjustando(true)}>
              Ajustar
            </Botao>
            <Botao variante="contorno" disabled={bloqueada || gerando} onClick={() => gerarDeNovo("Nova versão gerada.")}>
              Gerar de novo
            </Botao>
            <Botao
              variante="secundario"
              className="col-span-2"
              disabled={bloqueada}
              onClick={() => {
                setStatus(peca.id, "baixada");
                setAviso(
                  plano.marcaDagua
                    ? "Download feito (com marca d'água no plano Grátis). Na demonstração, nenhum arquivo é gerado."
                    : "Download feito. Na demonstração, nenhum arquivo é gerado.",
                );
              }}
            >
              Baixar {peca.tipo === "video" ? "vídeo (MP4)" : peca.tipo === "carrossel" ? "slides (ZIP)" : "imagem (PNG)"}
            </Botao>
          </div>
          <p className="mt-3 text-center text-xs text-cinza">
            Ajustar ou gerar de novo usa {custo} crédito{custo > 1 ? "s" : ""}. Você tem {creditosRestantes}.
          </p>
        </div>
      </div>
    </>
  );
}
