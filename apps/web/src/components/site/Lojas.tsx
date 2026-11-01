import clsx from "clsx";
import { BotaoLink } from "@/components/ui/Botao";

/** Links das lojas (configuráveis por env). Sem eles, o site leva para o cadastro. */
export const LOJAS = {
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL || null,
  playStore: process.env.NEXT_PUBLIC_PLAY_STORE_URL || null,
};
export const temLojas = Boolean(LOJAS.appStore || LOJAS.playStore);

function SimboloApple() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7zM14.1 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  );
}

function SimboloPlay() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 3.2v17.6c0 .4.4.6.7.4l9.6-9.2L4.7 2.8c-.3-.2-.7 0-.7.4z" fill="#3DDC84" />
      <path d="m14.3 12 2.9 2.8 3.5-2c.4-.2.4-.8 0-1.1l-3.5-2z" fill="#FFE14D" />
      <path d="M4.7 2.8 14.3 12l2.9-2.8L5.5 2.6c-.3-.1-.6 0-.8.2z" fill="#7AB8FF" />
      <path d="M4.7 21.2c.2.2.5.3.8.2l11.7-6.6-2.9-2.8z" fill="#FF7A7A" />
    </svg>
  );
}

function BotaoLoja({ href, tipo, claro }: { href: string; tipo: "apple" | "play"; claro?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "inline-flex min-h-14 items-center gap-3 rounded-2xl px-5 py-2 no-underline transition-transform active:translate-y-px",
        claro ? "bg-white text-tinta ring-1 ring-linha hover:ring-tinta" : "bg-tinta text-white hover:bg-[#1c2448]",
      )}
    >
      {tipo === "apple" ? <SimboloApple /> : <SimboloPlay />}
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[11px] font-medium opacity-80">{tipo === "apple" ? "Baixar na" : "Disponível no"}</span>
        <span className="text-[17px] font-bold">{tipo === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

/**
 * Botões das lojas. Sem links configurados, mostra o botão de teste grátis (cadastro pelo site).
 */
export function BotoesLojas({
  className,
  claro,
  textoFallback = "Testar 3 dias grátis",
  hrefFallback = "/cadastro",
  varianteFallback = "primario",
  tamanho = "lg",
}: {
  className?: string;
  claro?: boolean;
  textoFallback?: string;
  hrefFallback?: string;
  varianteFallback?: "primario" | "marca" | "escuro" | "branco";
  tamanho?: "md" | "lg";
}) {
  if (!temLojas) {
    return (
      <div className={clsx("flex flex-wrap gap-3", className)}>
        <BotaoLink href={hrefFallback} variante={varianteFallback} tamanho={tamanho} iconeDepois="setaDireita">
          {textoFallback}
        </BotaoLink>
      </div>
    );
  }
  return (
    <div className={clsx("flex flex-wrap gap-3", className)}>
      {LOJAS.appStore ? <BotaoLoja href={LOJAS.appStore} tipo="apple" claro={claro} /> : null}
      {LOJAS.playStore ? <BotaoLoja href={LOJAS.playStore} tipo="play" claro={claro} /> : null}
    </div>
  );
}
