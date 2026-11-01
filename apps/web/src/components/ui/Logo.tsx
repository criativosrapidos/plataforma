import Link from "next/link";
import clsx from "clsx";

/** Símbolo: bolinha de gabarito azul com "!" branco e ponto amarelo de notificação. */
export function Simbolo({
  tamanho = 36,
  escuro = false,
  pulsar = false,
  className,
}: {
  tamanho?: number;
  escuro?: boolean;
  pulsar?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={tamanho}
      height={tamanho}
      aria-hidden="true"
      focusable="false"
      className={clsx("shrink-0", className)}
    >
      <circle cx="46" cy="54" r="38" fill={escuro ? "#3D5AF0" : "#1F3FD1"} />
      <rect x="40" y="30" width="12" height="32" rx="6" fill="#FFFFFF" />
      <circle cx="46" cy="75" r="6.5" fill="#FFFFFF" />
      <circle
        cx="80"
        cy="20"
        r="15"
        fill="#FFE14D"
        stroke={escuro ? "#0F1530" : "#F5F6F1"}
        strokeWidth="6"
        className={pulsar ? "ac-pulso origin-[80px_20px]" : undefined}
      />
    </svg>
  );
}

/** Marca completa: símbolo + "avisoconcurso" (aviso 800, concurso 600). */
export function Logo({
  escuro = false,
  tamanho = "md",
  href = "/",
  className,
}: {
  escuro?: boolean;
  tamanho?: "sm" | "md" | "lg";
  href?: string | null;
  className?: string;
}) {
  const t = { sm: { s: 26, txt: "text-[22px]" }, md: { s: 34, txt: "text-[27px]" }, lg: { s: 44, txt: "text-[36px]" } }[tamanho];
  const conteudo = (
    <>
      <Simbolo tamanho={t.s} escuro={escuro} />
      <span className={clsx("font-display leading-none tracking-[-0.01em]", t.txt, escuro ? "text-white" : "text-tinta")}>
        <span className="font-extrabold">aviso</span>
        <span className={clsx("font-semibold", escuro && "text-[#C9D1FF]")}>concurso</span>
      </span>
    </>
  );
  const cls = clsx("inline-flex items-center gap-2.5 no-underline", className);
  if (href === null) return <span className={cls}>{conteudo}</span>;
  return (
    <Link href={href} className={clsx(cls, "rounded-lg")} aria-label="Aviso Concurso, página inicial">
      {conteudo}
    </Link>
  );
}

/** Fileira de bolinhas do gabarito (A B C D E) com uma marcada. Decorativa. */
export function Gabarito({
  marcada = "C",
  escuro = false,
  cor = "azul",
  className,
}: {
  marcada?: "A" | "B" | "C" | "D" | "E";
  escuro?: boolean;
  cor?: "azul" | "marca";
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-2", className)} aria-hidden="true">
      {(["A", "B", "C", "D", "E"] as const).map((l) => (
        <span
          key={l}
          className={clsx(
            "grid size-9 place-items-center rounded-full border-[2.5px] font-mono text-sm font-bold",
            l === marcada
              ? cor === "marca"
                ? "border-marca bg-marca text-tinta"
                : "border-azul bg-azul text-white"
              : escuro
                ? "border-white/80 text-white"
                : "border-tinta text-tinta",
          )}
        >
          {l}
        </span>
      ))}
    </div>
  );
}
