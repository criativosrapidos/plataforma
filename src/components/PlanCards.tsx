"use client";

import { useState } from "react";
import { CICLOS, PLANS, brl, economiaAnual, mensalNoAnual, type Ciclo } from "@/lib/plans";
import { BotaoLink } from "./ui";

function Check({ ok = true }: { ok?: boolean }) {
  return ok ? (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#FFD400" />
      <path d="M6 10.5l2.5 2.5L14 7.5" stroke="#101216" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#E3E5E9" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="#5B6068" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SeletorCiclo({ ciclo, onChange }: { ciclo: Ciclo; onChange: (c: Ciclo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-off p-1.5 ring-1 ring-linha">
      {(["anual", "mensal"] as const).map((c) => (
        <button
          type="button"
          key={c}
          onClick={() => onChange(c)}
          className={`rounded-xl px-4 py-2.5 text-left transition ${ciclo === c ? "bg-preto text-white shadow-sm" : "text-preto"}`}
        >
          <span className="block text-sm font-extrabold">{CICLOS[c].nome}</span>
          <span
            className={`mt-0.5 inline-block rounded-full px-2 text-[11px] font-extrabold ${
              c === "anual" ? "bg-amarelo text-preto" : ciclo === c ? "bg-white/15" : "bg-linha text-cinza"
            }`}
          >
            {CICLOS[c].selo}
          </span>
        </button>
      ))}
    </div>
  );
}

export function PlanCards() {
  const [ciclo, setCiclo] = useState<Ciclo>("anual");
  const outro: Ciclo = ciclo === "anual" ? "mensal" : "anual";

  return (
    <>
      <div className="mx-auto mb-4 max-w-md">
        <SeletorCiclo ciclo={ciclo} onChange={setCiclo} />
      </div>

      {/* o que muda no ciclo escolhido */}
      <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-linha bg-white p-4">
        <p className="text-sm font-extrabold">
          No {CICLOS[ciclo].nome.toLowerCase()}, os planos pagos têm:
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {CICLOS[ciclo].beneficios.map((b, i) => (
            <li key={b} className="flex gap-2">
              <Check ok={ciclo === "anual" || i === 0 || i === 4} /> {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const destaque = p.destaque;
          const pago = p.precoMensal > 0;
          const valor = ciclo === "anual" ? mensalNoAnual(p) : p.precoMensal;
          const [reais, centavos] = valor.toFixed(2).split(".");
          const apoio = destaque ? "text-white/70" : "text-cinza";
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${destaque ? "border-preto bg-preto text-white" : "border-linha bg-white"}`}
            >
              {destaque && (
                <span className="absolute -top-3 left-6 rounded-full bg-amarelo px-3 py-1 text-xs font-extrabold text-preto">
                  Mais escolhido
                </span>
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-2xl">{p.nome}</h3>
                {pago && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      ciclo === "anual" ? "bg-amarelo text-preto" : destaque ? "bg-white/15" : "bg-off"
                    }`}
                  >
                    {ciclo === "anual" ? `Economize ${brl(economiaAnual(p))}` : "Sem fidelidade"}
                  </span>
                )}
              </div>
              <p className={`mt-1 text-sm ${apoio}`}>{p.paraQuem}</p>

              <div className="mt-5 flex items-end gap-1">
                {pago && ciclo === "anual" && (
                  <span className={`pb-1.5 pr-1 text-sm line-through ${apoio}`}>{brl(p.precoMensal)}</span>
                )}
                <span className="pb-1.5 text-sm font-extrabold">R$</span>
                <span className="text-5xl font-extrabold tracking-tight">{reais}</span>
                <span className="pb-1.5 text-lg font-extrabold">,{centavos}</span>
                <span className={`pb-1.5 text-sm ${apoio}`}>/mês</span>
              </div>
              <p className={`mt-1 min-h-10 text-xs ${apoio}`}>
                {!pago
                  ? "Grátis pra sempre. Sem cartão."
                  : ciclo === "anual"
                    ? `Cobrado ${brl(p.precoAnual)} por ano: à vista no Pix ou 12x de ${brl(mensalNoAnual(p))} no cartão.`
                    : `Cobrado ${brl(p.precoMensal)} todo mês. Cancela quando quiser.`}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {p.inclui.map((i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check /> {i}
                  </li>
                ))}
                {pago && ciclo === "anual" && (
                  <li className="flex gap-2.5 font-extrabold">
                    <Check /> Créditos que sobram acumulam
                  </li>
                )}
                {p.naoInclui?.map((i) => (
                  <li key={i} className={`flex gap-2.5 ${destaque ? "text-white/50" : "text-cinza"}`}>
                    <Check ok={false} /> {i}
                  </li>
                ))}
              </ul>

              <BotaoLink
                href={pago ? `/cadastro?plano=${p.id}&ciclo=${ciclo}` : "/cadastro?plano=gratis"}
                variante={destaque ? "primario" : "secundario"}
                className="mt-6 w-full"
              >
                {!pago ? "Começar grátis" : `Assinar ${p.nome} ${CICLOS[ciclo].nome.toLowerCase()}`}
              </BotaoLink>
              {pago && (
                <button onClick={() => setCiclo(outro)} className={`mt-3 text-xs font-extrabold underline ${apoio}`}>
                  {ciclo === "anual" ? `Prefere mensal? ${brl(p.precoMensal)}/mês` : `No anual sai ${brl(mensalNoAnual(p))}/mês`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* comparativo */}
      <div className="mt-10 overflow-x-auto rounded-2xl border border-linha bg-white">
        <table className="w-full text-left text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-linha">
              <th className="p-3 sm:p-4" />
              <th className="p-3 sm:p-4">
                <span className="block text-base font-extrabold">Anual</span>
                <span className="mt-1 inline-block rounded-full bg-amarelo px-2 py-0.5 text-[11px] font-extrabold">2 meses grátis</span>
              </th>
              <th className="p-3 align-top text-base font-extrabold sm:p-4">Mensal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {[
              ["Básico por mês", brl(mensalNoAnual(PLANS[1])), brl(PLANS[1].precoMensal)],
              ["Profissional por mês", brl(mensalNoAnual(PLANS[2])), brl(PLANS[2].precoMensal)],
              ["Como paga", "Pix à vista ou 12x", "Todo mês"],
              ["Fidelidade", "12 meses", "Nenhuma"],
              ["Créditos que sobram", "Acumulam", "Expiram"],
              ["Créditos extras", "15% de desconto", "Preço cheio"],
              ["Preço", "Congelado 12 meses", "Pode mudar"],
            ].map(([t, a, m]) => (
              <tr key={t}>
                <td className="p-3 pr-2 text-cinza sm:p-4">{t}</td>
                <td className="p-3 font-extrabold sm:p-4">{a}</td>
                <td className="p-3 sm:p-4">{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
