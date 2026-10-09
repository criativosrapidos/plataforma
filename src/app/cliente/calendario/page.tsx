"use client";

import Link from "next/link";
import { Miniatura } from "@/components/EntregaCard";
import { Cartao } from "@/components/ui";
import type { Entrega } from "@/lib/cliente";
import { useCliente } from "@/lib/cliente-store";

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const COR = { producao: "bg-linha", aprovar: "bg-amarelo", ajuste: "bg-white ring-1 ring-preto", aprovada: "bg-preto" };

export default function Calendario() {
  const { entregas } = useCliente();
  const ano = 2026;
  const mes = 10;
  const primeiro = new Date(ano, mes - 1, 1).getDay();
  const dias = new Date(ano, mes, 0).getDate();
  const celulas = [...Array(primeiro).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  const porDia = new Map<number, Entrega[]>();
  for (const e of entregas) {
    const d = Number(e.data.slice(8, 10));
    porDia.set(d, [...(porDia.get(d) ?? []), e]);
  }

  return (
    <>
      <h1 className="text-3xl">Outubro 2026</h1>
      <p className="mt-1 text-cinza">Dia e horário sugeridos pra postar cada peça.</p>

      <Cartao className="mt-5 p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-cinza">
          {DIAS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            const es = dia ? porDia.get(dia) : undefined;
            return (
              <div key={i} className={`min-h-16 rounded-md p-0.5 ${dia ? "bg-off" : ""}`}>
                {dia && (
                  <span className={`block px-0.5 text-[10px] font-extrabold ${dia === 9 ? "text-preto underline" : "text-cinza"}`}>{dia}</span>
                )}
                {es?.slice(0, 1).map((e) => (
                  <Link key={e.id} href={`/cliente/entregas/${e.id}`} className="relative mt-0.5 block">
                    <Miniatura e={e} />
                    <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${COR[e.status]}`} />
                    {es.length > 1 && (
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] font-extrabold text-white">+{es.length - 1}</span>
                    )}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 px-1 text-xs text-cinza">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amarelo" /> Para aprovar</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-preto" /> Aprovada</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-white ring-1 ring-preto" /> Em ajuste</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-linha" /> Em produção</span>
        </div>
      </Cartao>
    </>
  );
}
