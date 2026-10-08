"use client";

import { useState } from "react";
import { PLANS, brl, mensalNoAnual, mesesGratis } from "@/lib/plans";
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

export function PlanCards({ escuro = false }: { escuro?: boolean }) {
  const [ciclo, setCiclo] = useState<"anual" | "mensal">("anual");
  return (
    <>
    <div className="mb-10 flex justify-center">
      <div className="inline-flex rounded-full bg-off p-1 ring-1 ring-linha">
        {(["anual", "mensal"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCiclo(c)}
            className={`rounded-full px-5 py-2 text-sm font-extrabold transition ${ciclo === c ? "bg-preto text-white" : "text-cinza"}`}
          >
            {c === "anual" ? "Anual · 2 meses grátis" : "Mensal"}
          </button>
        ))}
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((p) => {
        const destaque = p.destaque;
        const valor = ciclo === "anual" ? mensalNoAnual(p) : p.precoMensal;
        const [reais, centavos] = valor.toFixed(2).split(".");
        return (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              destaque ? "border-preto bg-preto text-white" : escuro ? "border-white/15 bg-white/5 text-white" : "border-linha bg-white"
            }`}
          >
            {destaque && (
              <span className="absolute -top-3 left-6 rounded-full bg-amarelo px-3 py-1 text-xs font-extrabold text-preto">
                Mais escolhido
              </span>
            )}
            <h3 className="text-2xl">{p.nome}</h3>
            <p className={`mt-1 text-sm ${destaque || escuro ? "text-white/70" : "text-cinza"}`}>{p.paraQuem}</p>

            <div className="mt-5 flex items-end gap-1">
              <span className="pb-1.5 text-sm font-extrabold">R$</span>
              <span className="text-5xl font-extrabold tracking-tight">{reais}</span>
              <span className="pb-1.5 text-lg font-extrabold">,{centavos}</span>
              <span className={`pb-1.5 text-sm ${destaque || escuro ? "text-white/70" : "text-cinza"}`}>/mês</span>
            </div>
            <p className={`mt-1 h-10 text-xs ${destaque || escuro ? "text-white/70" : "text-cinza"}`}>
              {p.precoMensal === 0
                ? "Grátis pra sempre. Sem cartão."
                : ciclo === "anual"
                  ? `${brl(p.precoAnual)} por ano no Pix ou 12x de ${brl(mensalNoAnual(p))} no cartão. ${mesesGratis(p)} meses grátis.`
                  : `Cobrado todo mês. No anual sai ${brl(mensalNoAnual(p))}/mês.`}
            </p>

            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {p.inclui.map((i) => (
                <li key={i} className="flex gap-2.5">
                  <Check /> {i}
                </li>
              ))}
              {p.naoInclui?.map((i) => (
                <li key={i} className={`flex gap-2.5 ${destaque || escuro ? "text-white/50" : "text-cinza"}`}>
                  <Check ok={false} /> {i}
                </li>
              ))}
            </ul>

            <BotaoLink
              href={`/cadastro?plano=${p.id}&ciclo=${ciclo}`}
              variante={destaque ? "primario" : escuro ? "primario" : "secundario"}
              className="mt-6 w-full"
            >
              {p.precoMensal === 0 ? "Começar grátis" : `Assinar ${p.nome}`}
            </BotaoLink>
          </div>
        );
      })}
    </div>
    </>
  );
}
