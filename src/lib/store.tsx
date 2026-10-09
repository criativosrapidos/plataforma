"use client";

// Estado da demonstração, só em memória. Será trocado por chamadas ao backend.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CONTA, MARCAS, PECAS, type Conta, type Peca, type StatusPeca } from "./mock";
import { CUSTO_CREDITOS, getPlan, type Ciclo, type PlanId } from "./plans";

type Store = {
  conta: Conta;
  marcas: typeof MARCAS;
  marcaAtiva: (typeof MARCAS)[number];
  setMarcaAtiva: (id: string) => void;
  pecas: Peca[];
  pecasDaMarca: Peca[];
  setStatus: (id: string, status: StatusPeca) => void;
  setLegenda: (id: string, legenda: string) => void;
  regenerar: (id: string) => boolean;
  setPlano: (plano: PlanId) => void;
  setCiclo: (ciclo: Ciclo) => void;
  creditosTotais: number;
  comprarCreditos: (qtd: number) => void;
  creditosRestantes: number;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [conta, setConta] = useState<Conta>(CONTA);
  const [pecas, setPecas] = useState<Peca[]>(PECAS);
  const [marcaId, setMarcaId] = useState(MARCAS[0].id);

  const plano = getPlan(conta.plano);
  const marcasVisiveis = MARCAS.slice(0, plano.marcas);
  const marcaAtiva = marcasVisiveis.find((m) => m.id === marcaId) ?? marcasVisiveis[0];
  // Sobra do mês anterior só vale no anual de plano pago.
  const acumulados = conta.ciclo === "anual" && plano.precoMensal > 0 ? conta.creditosAcumulados : 0;
  const creditosTotais = plano.creditosMes + acumulados + conta.creditosExtras;
  const creditosRestantes = Math.max(0, creditosTotais - conta.creditosUsados);

  const value = useMemo<Store>(
    () => ({
      conta,
      marcas: marcasVisiveis,
      marcaAtiva,
      setMarcaAtiva: setMarcaId,
      pecas,
      pecasDaMarca: pecas.filter((p) => p.marcaId === marcaAtiva.id).sort((a, b) => a.data.localeCompare(b.data)),
      setStatus: (id, status) => setPecas((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p))),
      setLegenda: (id, legenda) => setPecas((ps) => ps.map((p) => (p.id === id ? { ...p, legenda } : p))),
      regenerar: (id) => {
        const peca = pecas.find((p) => p.id === id);
        if (!peca) return false;
        const custo = CUSTO_CREDITOS[peca.tipo];
        if (creditosRestantes < custo) return false;
        setConta((c) => ({ ...c, creditosUsados: c.creditosUsados + custo }));
        setPecas((ps) => ps.map((p) => (p.id === id ? { ...p, status: "a_aprovar" } : p)));
        return true;
      },
      setPlano: (plano) => setConta((c) => ({ ...c, plano })),
      setCiclo: (ciclo) => setConta((c) => ({ ...c, ciclo })),
      creditosTotais,
      comprarCreditos: (qtd) => setConta((c) => ({ ...c, creditosExtras: c.creditosExtras + qtd })),
      creditosRestantes,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conta, pecas, marcaAtiva.id, creditosRestantes, creditosTotais],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore fora do StoreProvider");
  return ctx;
}
