"use client";

import { useActionState } from "react";
import { botao, campoCls } from "@/components/admin/ui";
import { entrarNoPainel } from "@/lib/admin/acoes/sessao";

export function FormEntrar({ voltar }: { voltar: string }) {
  const [estado, acao, pendente] = useActionState(entrarNoPainel, null);
  return (
    <form action={acao} className="mt-5 space-y-3">
      <input type="hidden" name="voltar" value={voltar} />
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-tx2">E-mail</span>
        <input name="email" type="email" autoComplete="username" required className={campoCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-tx2">Senha</span>
        <input name="senha" type="password" autoComplete="current-password" required className={campoCls} />
      </label>
      {estado?.erro && (
        <p role="alert" className="text-[13px] font-semibold text-verm">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={pendente} className={botao("primario", "md", "w-full")}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
