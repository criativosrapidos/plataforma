"use client";

import clsx from "clsx";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Icone } from "./Icone";

const base =
  "w-full min-h-12 rounded-xl border-[1.5px] bg-branco px-4 py-3 text-base text-tinta outline-none transition-colors placeholder:text-[#8A90A6] focus:border-azul focus-visible:outline-none focus:ring-4 focus:ring-azul/15 disabled:bg-papel disabled:text-tx2";

function Moldura({
  id,
  rotulo,
  dica,
  erro,
  opcional,
  children,
  className,
  rotuloOculto,
}: {
  id: string;
  rotulo: ReactNode;
  dica?: ReactNode;
  erro?: string | null;
  opcional?: boolean;
  children: ReactNode;
  className?: string;
  rotuloOculto?: boolean;
}) {
  return (
    <div className={clsx("min-w-0", className)}>
      <label htmlFor={id} className={clsx("mb-1.5 block text-sm font-bold text-tinta", rotuloOculto && "sr-only")}>
        {rotulo}
        {opcional ? <span className="font-medium text-tx2"> (opcional)</span> : null}
      </label>
      {children}
      {dica && !erro ? (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-tx2">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={`${id}-erro`} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-[#A8232A]">
          <Icone nome="alerta" tamanho={16} className="mt-0.5 shrink-0" />
          {erro}
        </p>
      ) : null}
    </div>
  );
}

type PropsCampo = {
  rotulo: ReactNode;
  dica?: ReactNode;
  erro?: string | null;
  opcional?: boolean;
  rotuloOculto?: boolean;
  classeMoldura?: string;
} & ComponentProps<"input">;

export function Campo({ rotulo, dica, erro, opcional, rotuloOculto, classeMoldura, id, className, ...resto }: PropsCampo) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <Moldura id={cid} rotulo={rotulo} dica={dica} erro={erro} opcional={opcional} className={classeMoldura} rotuloOculto={rotuloOculto}>
      <input
        id={cid}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${cid}-erro` : dica ? `${cid}-dica` : undefined}
        className={clsx(base, erro ? "border-verm" : "border-linha", className)}
        {...resto}
      />
    </Moldura>
  );
}

export function CampoSenha({ rotulo, dica, erro, opcional, classeMoldura, id, className, ...resto }: PropsCampo) {
  const auto = useId();
  const cid = id ?? auto;
  const [ver, setVer] = useState(false);
  return (
    <Moldura id={cid} rotulo={rotulo} dica={dica} erro={erro} opcional={opcional} className={classeMoldura}>
      <div className="relative">
        <input
          id={cid}
          type={ver ? "text" : "password"}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${cid}-erro` : dica ? `${cid}-dica` : undefined}
          className={clsx(base, "pr-14", erro ? "border-verm" : "border-linha", className)}
          {...resto}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-lg text-tx2 hover:text-tinta"
          aria-label={ver ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={ver}
        >
          <Icone nome={ver ? "olhoFechado" : "olho"} tamanho={20} />
        </button>
      </div>
    </Moldura>
  );
}

export function Selecao({
  rotulo,
  dica,
  erro,
  opcional,
  rotuloOculto,
  classeMoldura,
  id,
  className,
  children,
  ...resto
}: Omit<PropsCampo, keyof ComponentProps<"input">> & ComponentProps<"select">) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <Moldura id={cid} rotulo={rotulo} dica={dica} erro={erro} opcional={opcional} className={classeMoldura} rotuloOculto={rotuloOculto}>
      <div className="relative">
        <select
          id={cid}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${cid}-erro` : dica ? `${cid}-dica` : undefined}
          className={clsx(base, "cursor-pointer appearance-none pr-11", erro ? "border-verm" : "border-linha", className)}
          {...resto}
        >
          {children}
        </select>
        <Icone nome="chevronBaixo" tamanho={18} className="pointer-events-none absolute inset-y-0 right-4 my-auto text-tx2" />
      </div>
    </Moldura>
  );
}

/** Caixa de seleção com área de toque ≥ 44px. */
export function Marcar({
  children,
  erro,
  id,
  className,
  ...resto
}: { children: ReactNode; erro?: string | null } & Omit<ComponentProps<"input">, "type" | "children">) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={cid} className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-[15px] leading-snug">
        <input
          id={cid}
          type="checkbox"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${cid}-erro` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-azul"
          {...resto}
        />
        <span>{children}</span>
      </label>
      {erro ? (
        <p id={`${cid}-erro`} className="ml-8 text-sm font-semibold text-[#A8232A]">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/** Interruptor liga/desliga (role="switch"). */
export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  descricao,
  desabilitado,
  id,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  rotulo: ReactNode;
  descricao?: ReactNode;
  desabilitado?: boolean;
  id?: string;
}) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={`${cid}-rotulo`} className="font-bold leading-snug">
          {rotulo}
        </p>
        {descricao ? (
          <div id={`${cid}-desc`} className="mt-1 text-sm leading-relaxed text-tx2">
            {descricao}
          </div>
        ) : null}
      </div>
      <button
        id={cid}
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={`${cid}-rotulo`}
        aria-describedby={descricao ? `${cid}-desc` : undefined}
        disabled={desabilitado}
        onClick={() => aoMudar(!ligado)}
        className="group relative -my-1 grid min-h-11 shrink-0 place-items-center px-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={clsx(
            "relative block h-7 w-12 rounded-full transition-colors",
            ligado ? "bg-azul" : "bg-[#C7CBD6]",
          )}
        >
          <span
            className={clsx(
              "absolute top-1 left-1 block size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
              ligado && "translate-x-5",
            )}
          />
        </span>
      </button>
    </div>
  );
}

/** Botão que liga/desliga um valor de uma lista (aria-pressed). */
export function Chip({
  ativo,
  children,
  className,
  ...resto
}: { ativo: boolean; children: ReactNode } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition-colors",
        ativo ? "border-azul bg-azul text-white" : "border-linha bg-branco text-tinta hover:border-tinta",
        className,
      )}
      {...resto}
    >
      {ativo ? <Icone nome="check" tamanho={16} strokeWidth={3} /> : null}
      {children}
    </button>
  );
}
