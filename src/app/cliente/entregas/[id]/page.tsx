"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { StatusEntregaBadge, comoPeca } from "@/components/EntregaCard";
import { PecaPreview } from "@/components/PecaPreview";
import { Botao, BotaoLink, Cartao } from "@/components/ui";
import { useCliente } from "@/lib/cliente-store";
import { MARCAS } from "@/lib/mock";

export default function EntregaPage() {
  const { id } = useParams<{ id: string }>();
  const { entregas, aprovar, pedirAjuste } = useCliente();
  const e = entregas.find((x) => x.id === id);
  const [slide, setSlide] = useState(0);
  const [ajustando, setAjustando] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  if (!e) {
    return (
      <div className="py-20 text-center">
        <p className="text-cinza">Peça não encontrada.</p>
        <BotaoLink href="/cliente/entregas" className="mt-4">
          Ver entregas
        </BotaoLink>
      </div>
    );
  }

  const marca = MARCAS.find((m) => m.id === e.marcaId)!;
  const total = e.tipo === "carrossel" ? (e.slides?.length ?? 0) + 1 : 1;
  const tipo = e.tipo === "video" ? "Reel" : "Carrossel";

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/cliente/entregas" className="text-sm font-extrabold">
          ← Entregas
        </Link>
        <StatusEntregaBadge status={e.status} />
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className={`relative mx-auto w-full ${e.formato === "9:16" ? "max-w-[280px]" : "max-w-[340px]"}`}>
          {e.status === "producao" ? (
            <div className={`grid w-full place-items-center rounded-2xl bg-linha p-6 text-center ${e.formato === "9:16" ? "aspect-[9/16]" : "aspect-[4/5]"}`}>
              <div>
                <p className="text-lg font-extrabold">Em produção</p>
                <p className="mt-1 text-sm text-cinza">Você recebe um aviso no WhatsApp quando ficar pronta.</p>
              </div>
            </div>
          ) : (
            <PecaPreview peca={comoPeca(e)} marca={marca} slide={slide} />
          )}
          {total > 1 && e.status !== "producao" && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <button onClick={() => setSlide((s) => Math.max(0, s - 1))} disabled={slide === 0} className="h-9 w-9 rounded-full bg-white font-extrabold ring-1 ring-linha disabled:opacity-30" aria-label="Slide anterior">
                ‹
              </button>
              <span className="text-xs font-extrabold text-cinza tabular-nums">
                {slide + 1} / {total}
              </span>
              <button onClick={() => setSlide((s) => Math.min(total - 1, s + 1))} disabled={slide === total - 1} className="h-9 w-9 rounded-full bg-white font-extrabold ring-1 ring-linha disabled:opacity-30" aria-label="Próximo slide">
                ›
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-extrabold text-cinza">
            {tipo} · {e.formato} · postar{" "}
            {new Date(e.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}, {e.hora}
          </p>
          <h1 className="mt-1 text-3xl">{e.titulo}</h1>

          {aviso && <p className="mt-4 rounded-xl bg-amarelo px-4 py-3 text-sm font-extrabold">{aviso}</p>}

          {e.status !== "producao" && (
            <Cartao className="mt-5 p-4">
              <p className="text-sm font-extrabold">Legenda</p>
              <p className="mt-1.5 whitespace-pre-line">{e.legenda}</p>
              <p className="mt-2 text-sm text-cinza">{e.hashtags.join(" ")}</p>
            </Cartao>
          )}

          {e.comentarios.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-extrabold">Conversa sobre esta peça</p>
              {e.comentarios.map((c, i) => (
                <div key={i} className={`max-w-[85%] rounded-2xl p-3 text-sm ${c.autor === "cliente" ? "ml-auto bg-preto text-white" : "bg-white ring-1 ring-linha"}`}>
                  <p>{c.texto}</p>
                  <p className={`mt-1 text-[11px] ${c.autor === "cliente" ? "text-white/60" : "text-cinza"}`}>
                    {c.autor === "cliente" ? "Você" : "Criativos Rápidos"} · {c.quando}
                  </p>
                </div>
              ))}
            </div>
          )}

          {ajustando && (
            <Cartao className="mt-4 p-4">
              <label className="block" htmlFor="ajuste">
                <span className="text-sm font-extrabold">O que você quer mudar?</span>
                <textarea
                  id="ajuste"
                  rows={3}
                  value={texto}
                  onChange={(ev) => setTexto(ev.target.value)}
                  placeholder="Ex.: troca a música e coloca o preço em destaque no começo"
                  className="mt-1.5 w-full rounded-xl border border-linha bg-off p-3 outline-none focus:border-preto"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <Botao
                  tamanho="sm"
                  disabled={!texto.trim()}
                  onClick={() => {
                    pedirAjuste(e.id, texto.trim());
                    setTexto("");
                    setAjustando(false);
                    setAviso("Pedido de ajuste enviado. A equipe responde por aqui.");
                  }}
                >
                  Enviar pedido de ajuste
                </Botao>
                <Botao tamanho="sm" variante="fantasma" onClick={() => setAjustando(false)}>
                  Cancelar
                </Botao>
              </div>
            </Cartao>
          )}

          {e.status === "aprovar" && !ajustando && (
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Botao
                className="col-span-2"
                onClick={() => {
                  aprovar(e.id);
                  setAviso("Aprovada! Já pode baixar.");
                }}
              >
                Aprovar
              </Botao>
              <Botao variante="contorno" className="col-span-2" onClick={() => setAjustando(true)}>
                Pedir ajuste
              </Botao>
            </div>
          )}

          {e.status === "aprovada" && (
            <Botao variante="secundario" className="mt-6 w-full" onClick={() => setAviso("Na demonstração, nenhum arquivo é baixado.")}>
              Baixar {e.tipo === "video" ? "vídeo (MP4)" : "slides (ZIP)"}
            </Botao>
          )}

          {e.status === "ajuste" && (
            <p className="mt-6 rounded-xl bg-white p-4 text-sm ring-1 ring-linha">
              A equipe está ajustando. A nova versão aparece aqui pra você aprovar.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
