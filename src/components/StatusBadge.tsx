import { STATUS_LABEL, type StatusPeca } from "@/lib/mock";

const estilos: Record<StatusPeca, string> = {
  a_aprovar: "bg-amarelo text-preto",
  aprovada: "bg-preto text-white",
  baixada: "bg-linha text-cinza",
};

export function StatusBadge({ status, className = "" }: { status: StatusPeca; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold ${estilos[status]} ${className}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
