"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { PLANO_INFO, TRIAL_DAYS, brl, type Ciclo, type Plano } from "@aviso/shared";
import { BotaoLink } from "@/components/ui/Botao";
import { precoCurto } from "./conteudo";
import { Icone } from "@/components/ui/Icone";

export function SeletorCiclo({ ciclo, aoMudar, escuro }: { ciclo: Ciclo; aoMudar: (c: Ciclo) => void; escuro?: boolean }) {
  return (
    <div
      role="group"
      aria-label="Forma de cobrança"
      className={clsx(
        "inline-flex rounded-full border p-1",
        escuro ? "border-white/20 bg-white/10" : "border-linha bg-branco",
      )}
    >
      {(["mensal", "anual"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={ciclo === c}
          onClick={() => aoMudar(c)}
          className={clsx(
            "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-bold transition-colors",
            ciclo === c ? (escuro ? "bg-white text-tinta" : "bg-tinta text-white") : escuro ? "text-white" : "text-tinta hover:bg-tinta/5",
          )}
        >
          {c === "mensal" ? "Mensal" : "Anual"}
          {c === "anual" ? (
            <span className={clsx("rounded-full px-2 py-0.5 font-mono text-[10.5px] font-bold", "bg-marca text-tinta")}>2 MESES GRÁTIS</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Preço grande do plano, para o ciclo escolhido. */
export function PrecoPlano({ plano, ciclo, escuro }: { plano: Plano; ciclo: Ciclo; escuro?: boolean }) {
  const p = PLANO_INFO[plano];
  const centavos = ciclo === "anual" ? p.precoAnualCentavos : p.precoMensalCentavos;
  const [inteiro, decimais] = precoCurto(centavos).replace("R$", "").trim().split(",");
  return (
    <div>
      <p className="flex items-start gap-1 font-display leading-none font-extrabold">
        <span className="mt-1.5 text-2xl">R$</span>
        <span className="text-[64px] tracking-[-0.02em]" style={{ fontVariantNumeric: "tabular-nums" }}>
          {inteiro}
          {decimais ? <span className="text-[40px]">,{decimais}</span> : null}
        </span>
        <span className={clsx("mt-auto mb-2 ml-1 font-sans text-base font-medium", escuro ? "text-white/75" : "text-tx2")}>
          /{ciclo === "anual" ? "ano" : "mês"}
        </span>
      </p>
      <p className={clsx("mt-2 min-h-6 text-[15px]", escuro ? "text-white/80" : "text-tx2")}>
        {TRIAL_DAYS} dias grátis
        {ciclo === "anual" ? <> · sai {brl(Math.floor(p.precoAnualCentavos / 12))} por mês</> : <> · ou {precoCurto(p.precoAnualCentavos)} por ano</>}
      </p>
    </div>
  );
}

export function ListaInclui({ plano, escuro }: { plano: Plano; escuro?: boolean }) {
  return (
    <ul className="grid gap-2.5 text-[15.5px]">
      {PLANO_INFO[plano].inclui.map((item, i) => (
        <li key={item} className="flex gap-3">
          <span
            className={clsx(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
              escuro ? "bg-marca text-tinta" : "bg-azul text-white",
            )}
          >
            <Icone nome="check" tamanho={12} strokeWidth={3.5} />
          </span>
          <span className={clsx(plano === "aprovado" && i === 0 && "font-bold")}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CartaoPlano({
  plano,
  ciclo,
  acao,
  rodape,
  className,
}: {
  plano: Plano;
  ciclo: Ciclo;
  acao?: ReactNode;
  rodape?: ReactNode;
  className?: string;
}) {
  const escuro = plano === "aprovado";
  const p = PLANO_INFO[plano];
  return (
    <div
      className={clsx(
        "relative flex flex-col gap-6 rounded-[28px] p-6 sm:p-8",
        escuro
          ? "bg-tinta text-white shadow-[0_30px_60px_-30px_rgb(15_21_48/0.6)]"
          : "border-2 border-azul bg-branco shadow-[0_30px_60px_-34px_rgb(31_63_209/0.45)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-[40px] leading-none font-extrabold uppercase">{p.nome}</h3>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide",
            escuro ? "bg-white/12 text-white ring-1 ring-white/25" : "bg-marca text-tinta",
          )}
        >
          {escuro ? "COMPLETO" : "MAIS ESCOLHIDO"}
        </span>
      </div>
      <PrecoPlano plano={plano} ciclo={ciclo} escuro={escuro} />
      {acao}
      <ListaInclui plano={plano} escuro={escuro} />
      {rodape}
    </div>
  );
}

/** Planos com seletor mensal/anual. Cada botão leva ao cadastro com o plano escolhido. */
export function TabelaPlanos({ base = "/cadastro" }: { base?: string }) {
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  return (
    <div>
      <SeletorCiclo ciclo={ciclo} aoMudar={setCiclo} />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:max-w-[920px]">
        {(["aviso", "aprovado"] as const).map((plano) => (
          <CartaoPlano
            key={plano}
            plano={plano}
            ciclo={ciclo}
            acao={
              <BotaoLink
                href={`${base}?plano=${plano}&ciclo=${ciclo}`}
                variante={plano === "aprovado" ? "marca" : "primario"}
                tamanho="lg"
                larguraTotal
                iconeDepois="setaDireita"
              >
                Testar {TRIAL_DAYS} dias grátis
              </BotaoLink>
            }
          />
        ))}
      </div>
    </div>
  );
}
