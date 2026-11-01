"use client";

// Gráficos do painel em SVG próprio. Cores categóricas fixas por entidade (validadas para daltonismo
// em superfície branca, na ordem abaixo): azul → laranja → teal → violeta. Status usam verde/âmbar/vermelho
// sempre com rótulo. Texto nunca usa a cor da série.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { brl } from "@aviso/shared";
import { COR } from "@/lib/admin/cores";
import { brlFino, compacto } from "@/lib/admin/formato";
import { cx } from "./ui";

/** Formato dos valores (string, porque funções não atravessam do servidor para o cliente). */
export type Formato = "numero" | "brl" | "brlFino";
const FORMATADORES: Record<Formato, (n: number) => string> = {
  numero: (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
  brl: (n) => brl(Math.round(n)),
  brlFino: (n) => brlFino(n),
};
/** Eixos sem centavos e compactos (o valor exato fica no tooltip e na tabela). */
const EIXO: Record<Formato, (n: number) => string> = {
  numero: (n) => compacto(n),
  brl: (n) => `R$ ${compacto(Math.round(n / 100))}`,
  brlFino: (n) => (n >= 100 ? `R$ ${compacto(Math.round(n / 100))}` : `R$ ${(n / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`),
};


export interface Serie {
  chave: string;
  rotulo: string;
  cor: string;
}

function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Ticks "redondos" para o eixo Y. */
function ticks(max: number, n = 4, inteiro = false): number[] {
  if (max <= 0) return [0, 1];
  const bruto = max / n;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const passoBase = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? bruto;
  const passo = inteiro ? Math.max(1, Math.ceil(passoBase)) : passoBase;
  const out: number[] = [];
  for (let v = 0; v <= max + passo * 0.001; v += passo) out.push(+v.toFixed(6));
  if (out[out.length - 1] < max) out.push(+(out[out.length - 1] + passo).toFixed(6));
  return out;
}

/** Retângulo com cantos superiores arredondados (base reta na linha de base). */
function pathColuna(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function Legenda({ series, forma = "quadrado" }: { series: Serie[]; forma?: "quadrado" | "linha" }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-tx2">
      {series.map((s) => (
        <li key={s.chave} className="flex items-center gap-1.5">
          <span aria-hidden className={forma === "linha" ? "h-0.5 w-3.5 rounded-full" : "size-2.5 rounded-[3px]"} style={{ background: s.cor }} />
          {s.rotulo}
        </li>
      ))}
    </ul>
  );
}

export interface PontoColuna {
  x: string; // rótulo do eixo X (ex.: "03/11")
  titulo?: string; // rótulo completo no tooltip (ex.: "03/11/2026")
  v: Record<string, number>;
}

/** Colunas (empilhadas quando há mais de uma série) ao longo do tempo, com tooltip por coluna e tabela. */
export function Colunas({
  dados,
  series,
  formato = "numero",
  altura = 200,
  rotuloTabela,
  referencia,
  tabela = true,
}: {
  dados: PontoColuna[];
  series: Serie[];
  formato?: Formato;
  altura?: number;
  tabela?: boolean;
  rotuloTabela: string;
  referencia?: { valor: number; rotulo: string };
}) {
  const formatar = FORMATADORES[formato];
  const eixo = EIXO[formato];
  const [ref, w] = useLargura<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const totais = dados.map((d) => series.reduce((s, se) => s + (d.v[se.chave] ?? 0), 0));
  const maxV = Math.max(0, ...totais, referencia?.valor ?? 0);
  const ys = ticks(maxV, 4, formato === "numero");
  const topo = ys[ys.length - 1] || 1;
  const larguraEixo = Math.max(28, ...ys.map((t) => eixo(t).length * 6.4 + 8));
  const m = { t: 8, r: 8, b: 22, l: larguraEixo };
  const iw = Math.max(0, w - m.l - m.r);
  const ih = altura - m.t - m.b;
  const banda = dados.length ? iw / dados.length : 0;
  const bw = Math.max(2, Math.min(24, banda * 0.72));
  const y = (v: number) => m.t + ih - (v / topo) * ih;
  const passoX = Math.max(1, Math.ceil(dados.length / Math.max(1, Math.floor(iw / 46))));
  const vazio = totais.every((t) => t === 0);

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-2">
          <Legenda series={series} />
        </div>
      )}
      <div ref={ref} className="relative" style={{ height: altura }} onPointerLeave={() => setHover(null)}>
        {w > 0 && (
          <svg width={w} height={altura} role="img" aria-label={rotuloTabela} className="block overflow-visible">
            {ys.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? COR.eixo : COR.grade} strokeWidth={1} />
                <text x={m.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-tx2 font-mono text-[10.5px] tabular-nums">
                  {eixo(t)}
                </text>
              </g>
            ))}
            {referencia && referencia.valor > 0 && (
              <g>
                <line x1={m.l} x2={w - m.r} y1={y(referencia.valor)} y2={y(referencia.valor)} stroke="#0F1530" strokeWidth={1} strokeDasharray="4 3" opacity={0.55} />
                <text x={w - m.r} y={y(referencia.valor) - 4} textAnchor="end" className="fill-tinta text-[11px] font-semibold">
                  {referencia.rotulo}
                </text>
              </g>
            )}
            {dados.map((d, i) => {
              const cx0 = m.l + banda * i + (banda - bw) / 2;
              let acum = 0;
              const segs = series
                .map((s) => ({ s, v: d.v[s.chave] ?? 0 }))
                .filter((x) => x.v > 0);
              return (
                <g key={i} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {segs.map(({ s, v }, j) => {
                    const y0 = y(acum);
                    acum += v;
                    const y1 = y(acum);
                    const ultimo = j === segs.length - 1;
                    const gap = j > 0 ? 2 : 0; // 2px de respiro entre segmentos
                    const h = Math.max(0, y0 - y1 - gap);
                    return ultimo ? (
                      <path key={s.chave} d={pathColuna(cx0, y1, bw, h, 4)} fill={s.cor} />
                    ) : (
                      <rect key={s.chave} x={cx0} y={y1} width={bw} height={h} fill={s.cor} />
                    );
                  })}
                  {i % passoX === 0 && (
                    <text x={m.l + banda * i + banda / 2} y={altura - 6} textAnchor="middle" className="fill-tx2 font-mono text-[10.5px]">
                      {d.x}
                    </text>
                  )}
                  <rect
                    x={m.l + banda * i}
                    y={m.t}
                    width={banda}
                    height={ih}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${d.titulo ?? d.x}: ${series.map((s) => `${s.rotulo} ${formatar(d.v[s.chave] ?? 0)}`).join(", ")}`}
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="outline-none"
                  />
                </g>
              );
            })}
          </svg>
        )}
        {vazio && w > 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] text-tx2">Sem dados no período.</p>
        )}
        {hover !== null && dados[hover] && w > 0 && (
          <Dica
            x={m.l + banda * hover + banda / 2}
            largura={w}
            titulo={dados[hover].titulo ?? dados[hover].x}
            linhas={[
              ...series.map((s) => ({ cor: s.cor, rotulo: s.rotulo, valor: formatar(dados[hover].v[s.chave] ?? 0) })),
              ...(series.length > 1 ? [{ cor: "", rotulo: "Total", valor: formatar(totais[hover]) }] : []),
            ]}
          />
        )}
      </div>
      {tabela && (
        <TabelaDados
          rotulo={rotuloTabela}
          colunas={["Dia", ...series.map((s) => s.rotulo)]}
          linhas={dados.map((d) => [d.titulo ?? d.x, ...series.map((s) => formatar(d.v[s.chave] ?? 0))])}
        />
      )}
    </div>
  );
}

function Dica({ x, largura, titulo, linhas }: { x: number; largura: number; titulo: string; linhas: { cor: string; rotulo: string; valor: string }[] }) {
  const esquerda = x > largura - 170;
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 min-w-[150px] rounded-lg border border-linha bg-branco px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(15,21,48,.14)]"
      style={esquerda ? { right: largura - x + 10 } : { left: x + 10 }}
    >
      <p className="mb-1 font-mono text-[11px] text-tx2">{titulo}</p>
      {linhas.map((l) => (
        <p key={l.rotulo} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-tx2">
            {l.cor ? <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: l.cor }} /> : <span className="w-3" />}
            {l.rotulo}
          </span>
          <b className="font-mono tabular-nums text-tinta">{l.valor}</b>
        </p>
      ))}
    </div>
  );
}

export function TabelaDados({ rotulo, colunas, linhas }: { rotulo: string; colunas: string[]; linhas: (string | number)[][] }) {
  return (
    <details className="group mt-2">
      <summary className="inline-flex min-h-8 cursor-pointer select-none items-center gap-1 text-[12px] font-semibold text-tx2 hover:text-azul">
        <span className="transition-transform group-open:rotate-90">›</span> Ver tabela
      </summary>
      <div className="mt-1 max-h-56 overflow-auto rounded-lg border border-linha">
        <table className="w-full text-[12px]">
          <caption className="sr-only">{rotulo}</caption>
          <thead>
            <tr>
              {colunas.map((c, i) => (
                <th key={c} className={cx("sticky top-0 bg-[#FAFAF7] px-2 py-1 font-mono text-[10.5px] uppercase text-tx2", i > 0 ? "text-right" : "text-left")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-t border-linha/60">
                {l.map((v, j) => (
                  <td key={j} className={cx("px-2 py-1", j > 0 ? "text-right font-mono tabular-nums" : "font-mono")}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Uma parte do todo, numa barra alta segmentada (≤ 6 partes), com legenda de nomes. */
export function BarraSegmentada({
  partes,
  formato = "numero",
  rotulo,
}: {
  partes: { chave: string; rotulo: string; valor: number; cor: string; textoEscuro?: boolean }[];
  formato?: Formato;
  rotulo: string;
}) {
  const formatar = FORMATADORES[formato];
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const [ref, w] = useLargura<HTMLDivElement>();
  return (
    <div>
      <div ref={ref} role="img" aria-label={`${rotulo}: ${partes.map((p) => `${p.rotulo} ${formatar(p.valor)}`).join(", ")}`} className="flex h-7 w-full gap-[2px]">
        {total === 0 ? (
          <div className="h-full w-full rounded bg-[#EDEFF3]" />
        ) : (
          partes
            .filter((p) => p.valor > 0)
            .map((p) => {
              const frac = p.valor / total;
              const cabe = w * frac > 34;
              return (
                <div
                  key={p.chave}
                  title={`${p.rotulo}: ${formatar(p.valor)} (${Math.round(frac * 100)}%)`}
                  className="flex h-full items-center rounded px-1.5 font-mono text-[11px] font-bold"
                  style={{ width: `${frac * 100}%`, background: p.cor, color: p.textoEscuro ? "#0F1530" : "#fff" }}
                >
                  {cabe ? formatar(p.valor) : ""}
                </div>
              );
            })
        )}
      </div>
      <div className="mt-2">
        <Legenda series={partes.map((p) => ({ chave: p.chave, rotulo: `${p.rotulo} · ${formatar(p.valor)}`, cor: p.cor }))} />
      </div>
    </div>
  );
}

/** Medidor de uma razão contra uma meta (ponto de equilíbrio), com partes empilhadas e marcador da meta. */
export function Medidor({
  partes,
  meta,
  rotuloMeta,
  formato = "numero",
  rotulo,
  rodape,
}: {
  partes: { chave: string; rotulo: string; valor: number; cor: string }[];
  meta: number;
  rotuloMeta: string;
  formato?: Formato;
  rotulo: string;
  rodape?: ReactNode;
}) {
  const formatar = FORMATADORES[formato];
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const escala = Math.max(meta * 1.25, total * 1.08, 1);
  const posMeta = (meta / escala) * 100;
  return (
    <div>
      <div className="relative pt-5">
        <div
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-tinta"
          style={{ left: `${Math.min(88, Math.max(12, posMeta))}%` }}
        >
          {rotuloMeta}
        </div>
        <div role="img" aria-label={`${rotulo}: ${formatar(total)} de ${formatar(meta)}`} className="relative flex h-4 w-full gap-[2px] overflow-hidden rounded-full bg-azul-t">
          {partes
            .filter((p) => p.valor > 0)
            .map((p) => (
              <div key={p.chave} title={`${p.rotulo}: ${formatar(p.valor)}`} className="h-full first:rounded-l-full" style={{ width: `${(p.valor / escala) * 100}%`, background: p.cor }} />
            ))}
        </div>
        <div aria-hidden className="absolute bottom-[-4px] top-4 w-0.5 rounded bg-tinta" style={{ left: `calc(${posMeta}% - 1px)` }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Legenda series={partes.map((p) => ({ chave: p.chave, rotulo: `${p.rotulo} · ${formatar(p.valor)}`, cor: p.cor }))} />
        {rodape}
      </div>
    </div>
  );
}
