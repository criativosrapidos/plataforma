"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EntregaLinha } from "@/components/EntregaCard";
import { STATUS_ENTREGA, type StatusEntrega } from "@/lib/cliente";
import { useCliente } from "@/lib/cliente-store";

const ORDEM: StatusEntrega[] = ["aprovar", "ajuste", "producao", "aprovada"];

export function Entregas() {
  const { entregas, contar } = useCliente();
  const inicial = useSearchParams().get("status") as StatusEntrega | null;
  const [filtro, setFiltro] = useState<StatusEntrega | "todas">(inicial && ORDEM.includes(inicial) ? inicial : "todas");
  const lista = entregas.filter((e) => filtro === "todas" || e.status === filtro);

  return (
    <>
      <h1 className="text-3xl">Entregas</h1>
      <p className="mt-1 text-cinza">Aprove ou peça ajuste em cada peça. As aprovadas ficam liberadas pra baixar.</p>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["todas", ...ORDEM] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold ${filtro === s ? "border-preto bg-preto text-white" : "border-linha bg-white"}`}
          >
            {s === "todas" ? `Todas · ${entregas.length}` : `${STATUS_ENTREGA[s]} · ${contar(s)}`}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {lista.map((e) => (
          <EntregaLinha key={e.id} e={e} />
        ))}
        {lista.length === 0 && <p className="py-10 text-center text-cinza">Nenhuma peça aqui.</p>}
      </div>
    </>
  );
}
