"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CLIENTE, ENTREGAS, type Briefing, type Cliente, type Entrega, type StatusEntrega } from "./cliente";

type Store = {
  cliente: Cliente;
  entregas: Entrega[];
  aprovar: (id: string) => void;
  pedirAjuste: (id: string, texto: string) => void;
  salvarBriefing: (b: Briefing) => void;
  conectarInstagram: (usuario: string) => void;
  desconectarInstagram: () => void;
  contar: (s: StatusEntrega) => number;
};

const Ctx = createContext<Store | null>(null);

function agora() {
  return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState(CLIENTE);
  const [entregas, setEntregas] = useState(ENTREGAS);

  const value = useMemo<Store>(
    () => ({
      cliente,
      entregas,
      aprovar: (id) => setEntregas((es) => es.map((e) => (e.id === id ? { ...e, status: "aprovada" } : e))),
      pedirAjuste: (id, texto) =>
        setEntregas((es) =>
          es.map((e) =>
            e.id === id ? { ...e, status: "ajuste", comentarios: [...e.comentarios, { autor: "cliente", texto, quando: agora() }] } : e,
          ),
        ),
      salvarBriefing: (briefing) => setCliente((c) => ({ ...c, briefing })),
      conectarInstagram: (usuario) =>
        setCliente((c) => ({ ...c, instagram: usuario.startsWith("@") ? usuario : `@${usuario}`, instagramConectado: true })),
      desconectarInstagram: () => setCliente((c) => ({ ...c, instagramConectado: false })),
      contar: (s) => entregas.filter((e) => e.status === s).length,
    }),
    [cliente, entregas],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCliente() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCliente fora do ClienteProvider");
  return ctx;
}
