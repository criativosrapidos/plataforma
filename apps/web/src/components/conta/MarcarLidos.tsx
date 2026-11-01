"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Botao } from "@/components/ui/Botao";

export function MarcarLidos({ quantidade }: { quantidade: number }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const { enviando, erro, enviar } = useEnvio();
  if (!quantidade) return null;
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Botao
        variante="secundario"
        icone="check"
        carregando={enviando || pendente}
        onClick={async () => {
          const r = await enviar(() => api("/api/v1/avisos", { corpo: { todos: true } }));
          if (r) iniciar(() => router.refresh());
        }}
      >
        Marcar {quantidade === 1 ? "como lido" : `os ${quantidade} como lidos`}
      </Botao>
      {erro ? <p className="text-sm font-semibold text-[#A8232A]">{erro}</p> : null}
    </div>
  );
}
