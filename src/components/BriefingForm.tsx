"use client";

import { useState } from "react";
import { BRIEFING_VAZIO, TONS, type Briefing } from "@/lib/cliente";
import { Campo } from "./AuthShell";
import { Botao } from "./ui";

function Area({ id, label, dica, valor, onChange }: { id: string; label: string; dica?: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-extrabold">{label}</span>
      {dica && <span className="block text-xs text-cinza">{dica}</span>}
      <textarea
        id={id}
        rows={3}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-linha bg-white p-4 outline-none transition placeholder:text-cinza/60 focus:border-preto"
      />
    </label>
  );
}

function Secao({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-linha bg-white/60 p-4">
      <legend className="flex items-center gap-2 px-1 text-lg font-extrabold">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-amarelo text-sm">{n}</span>
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

export function BriefingForm({
  inicial,
  onSalvar,
  botao = "Enviar briefing",
}: {
  inicial?: Briefing | null;
  onSalvar: (b: Briefing) => void;
  botao?: string;
}) {
  const [b, setB] = useState<Briefing>(inicial ?? BRIEFING_VAZIO);
  const set = <K extends keyof Briefing>(k: K, v: Briefing[K]) => setB((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar(b);
      }}
    >
      <Secao n={1} titulo="Sobre o negócio">
        <Campo id="b-negocio" label="Nome da marca" value={b.negocio} onChange={(e) => set("negocio", e.target.value)} required />
        <Campo id="b-segmento" label="Segmento" placeholder="Ex.: hamburgueria, clínica" value={b.segmento} onChange={(e) => set("segmento", e.target.value)} required />
        <Area id="b-produtos" label="Produtos ou serviços em destaque" valor={b.produtos} onChange={(v) => set("produtos", v)} />
        <Area id="b-diferencial" label="Por que comprar de você e não do concorrente?" valor={b.diferencial} onChange={(v) => set("diferencial", v)} />
      </Secao>

      <Secao n={2} titulo="Público">
        <Area id="b-publico" label="Quem é o seu cliente?" dica="Idade, região, o que busca, quando compra." valor={b.publico} onChange={(v) => set("publico", v)} />
      </Secao>

      <Secao n={3} titulo="Identidade visual">
        <div>
          <span className="text-sm font-extrabold">Cores da marca</span>
          <div className="mt-1.5 flex flex-wrap gap-3">
            {b.cores.map((c, i) => (
              <label key={i} className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full border border-linha" style={{ background: c }}>
                <input
                  id={`b-cor-${i}`}
                  type="color"
                  value={c}
                  onChange={(e) => set("cores", b.cores.map((x, j) => (j === i ? e.target.value : x)))}
                  className="absolute inset-0 opacity-0"
                  aria-label={`Cor ${i + 1}`}
                />
              </label>
            ))}
            {b.cores.length < 5 && (
              <button type="button" onClick={() => set("cores", [...b.cores, "#CCCCCC"])} className="h-12 w-12 rounded-full border border-dashed border-cinza font-extrabold">
                +
              </button>
            )}
          </div>
        </div>
        <div>
          <span className="text-sm font-extrabold">Logo, fotos e materiais</span>
          <span className="block text-xs text-cinza">Logo em PNG, fotos do produto, da equipe ou do espaço.</span>
          <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-cinza bg-white p-4 text-sm font-extrabold">
            Escolher arquivos
            <input
              id="b-arquivos"
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => set("arquivos", [...b.arquivos, ...Array.from(e.target.files ?? []).map((f) => f.name)])}
            />
          </label>
          {b.arquivos.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {b.arquivos.map((a, i) => (
                <li key={a + i} className="flex items-center gap-1.5 rounded-full bg-off px-3 py-1 text-xs font-extrabold">
                  {a}
                  <button type="button" aria-label={`Remover ${a}`} onClick={() => set("arquivos", b.arquivos.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Secao>

      <Secao n={4} titulo="Jeito de falar">
        <div className="flex flex-wrap gap-2">
          {TONS.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => set("tom", t)}
              className={`rounded-full border px-4 py-2 text-sm font-extrabold ${b.tom === t ? "border-preto bg-preto text-white" : "border-linha bg-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <Area id="b-referencias" label="Perfis que você admira" dica="Concorrentes ou marcas de referência (@)." valor={b.referencias} onChange={(v) => set("referencias", v)} />
        <Area id="b-evitar" label="O que não pode aparecer" valor={b.evitar} onChange={(v) => set("evitar", v)} />
      </Secao>

      <Secao n={5} titulo="Este mês">
        <Area id="b-datas" label="Promoções, lançamentos e datas importantes" valor={b.datas} onChange={(v) => set("datas", v)} />
      </Secao>

      <Botao type="submit" tamanho="lg" className="w-full">
        {botao}
      </Botao>
    </form>
  );
}
