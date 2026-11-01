import clsx from "clsx";
import { TRIAL_DAYS, dataBR } from "@aviso/shared";

/** Linha do tempo do teste grátis: hoje → aviso 1 dia antes → cobrança no 4º dia. */
export function LinhaTeste({
  inicio,
  valor,
  escuro,
  className,
}: {
  /** Quando informado, mostra as datas reais (ex.: no /assinar). */
  inicio?: Date;
  valor?: string;
  escuro?: boolean;
  className?: string;
}) {
  const dia = (n: number) => (inicio ? dataBR(new Date(inicio.getTime() + n * 86_400_000)) : null);
  const etapas = [
    { quando: inicio ? `Hoje, ${dia(0)}` : "Hoje", titulo: "Começa o teste", texto: "Tudo do plano liberado. Você não paga nada agora." },
    {
      quando: inicio ? dia(TRIAL_DAYS - 1)! : `Dia ${TRIAL_DAYS}`,
      titulo: "A gente avisa",
      texto: "Notificação 1 dia antes da primeira cobrança. Sem surpresa.",
    },
    {
      quando: inicio ? dia(TRIAL_DAYS)! : `Dia ${TRIAL_DAYS + 1}`,
      titulo: "Primeira cobrança",
      texto: valor ? `${valor}, só se você não cancelar antes.` : "Só se você não cancelar antes. Pix automático ou cartão.",
    },
  ];
  return (
    <ol className={clsx("relative grid gap-5", className)}>
      <span
        aria-hidden="true"
        className={clsx("absolute top-3 bottom-3 left-[11px] w-0.5", escuro ? "bg-white/20" : "bg-linha")}
      />
      {etapas.map((e, i) => (
        <li key={e.titulo} className="relative grid grid-cols-[24px_1fr] gap-4">
          <span
            aria-hidden="true"
            className={clsx(
              "relative mt-0.5 grid size-6 place-items-center rounded-full border-[2.5px]",
              i === 0 ? "border-azul bg-azul" : escuro ? "border-white/70 bg-tinta" : "border-tinta bg-branco",
            )}
          >
            {i === 0 ? <span className="size-2 rounded-full bg-marca" /> : null}
          </span>
          <div>
            <p className={clsx("font-mono text-[12px] font-bold tracking-[0.1em] uppercase", escuro ? "text-marca" : "text-azul")}>{e.quando}</p>
            <p className="mt-0.5 font-bold">{e.titulo}</p>
            <p className={clsx("text-[15px]", escuro ? "text-white/75" : "text-tx2")}>{e.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
