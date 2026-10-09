import Link from "next/link";
import type { Entrega, StatusEntrega } from "@/lib/cliente";
import { STATUS_ENTREGA } from "@/lib/cliente";
import { MARCAS, type Peca } from "@/lib/mock";
import { PecaPreview } from "./PecaPreview";
import { Cartao } from "./ui";

const ESTILO: Record<StatusEntrega, string> = {
  producao: "bg-linha text-cinza",
  aprovar: "bg-amarelo text-preto",
  ajuste: "bg-white text-preto ring-1 ring-preto",
  aprovada: "bg-preto text-white",
};

export function StatusEntregaBadge({ status }: { status: StatusEntrega }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${ESTILO[status]}`}>{STATUS_ENTREGA[status]}</span>;
}

export function comoPeca(e: Entrega) {
  return { ...e, status: "a_aprovar" } as unknown as Peca;
}

export function Miniatura({ e }: { e: Entrega }) {
  const marca = MARCAS.find((m) => m.id === e.marcaId)!;
  if (e.status === "producao") {
    return (
      <div className="grid aspect-[4/5] w-full place-items-center rounded-md bg-linha text-[9px] font-extrabold text-cinza">
        <span className="animate-pulse">●</span>
      </div>
    );
  }
  return <PecaPreview peca={{ ...comoPeca(e), formato: "4:5" }} marca={marca} tamanho="mini" />;
}

export function dataCurta(data: string) {
  return new Date(data + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function EntregaLinha({ e }: { e: Entrega }) {
  return (
    <Link href={`/cliente/entregas/${e.id}`} className="block">
      <Cartao className="flex items-center gap-3 p-3 transition hover:border-preto">
        <div className="w-14 shrink-0">
          <Miniatura e={e} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-cinza">
            {e.tipo === "video" ? "Reel" : "Carrossel"} · postar {dataCurta(e.data)}
          </p>
          <p className="truncate font-extrabold">{e.titulo}</p>
        </div>
        <StatusEntregaBadge status={e.status} />
      </Cartao>
    </Link>
  );
}
