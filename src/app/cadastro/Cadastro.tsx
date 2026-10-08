"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell, Campo } from "@/components/AuthShell";
import { Botao, Destaque } from "@/components/ui";
import { PLANS, brl, precoAnual, type PlanId } from "@/lib/plans";

export function Cadastro() {
  const router = useRouter();
  const inicial = (useSearchParams().get("plano") as PlanId) || "gratis";
  const [plano, setPlano] = useState<PlanId>(PLANS.some((p) => p.id === inicial) ? inicial : "gratis");
  const escolhido = PLANS.find((p) => p.id === plano)!;

  return (
    <AuthShell>
      <h1 className="text-4xl">
        Crie sua conta em <Destaque>1 minuto.</Destaque>
      </h1>
      <p className="mt-3 text-cinza">Depois é só conectar sua marca.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/onboarding");
        }}
      >
        <Campo label="Seu nome" placeholder="Como podemos te chamar?" required />
        <Campo label="E-mail" type="email" placeholder="voce@empresa.com.br" required />
        <Campo label="WhatsApp" type="tel" placeholder="(11) 99999-9999" />
        <Campo label="Senha" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />

        <fieldset>
          <legend className="text-sm font-extrabold">Plano</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPlano(p.id)}
                className={`rounded-xl border px-2 py-3 text-center transition ${
                  plano === p.id ? "border-preto bg-preto text-white" : "border-linha bg-white"
                }`}
              >
                <span className="block text-sm font-extrabold">{p.nome}</span>
                <span className={`block text-xs ${plano === p.id ? "text-white/70" : "text-cinza"}`}>
                  {p.precoMensal ? `${brl(p.precoMensal)}/mês` : "R$ 0"}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-cinza">
            {escolhido.precoMensal
              ? `Cobrança anual: ${brl(precoAnual(escolhido))} no Pix ou 12x de ${brl(escolhido.precoMensal)} no cartão. Pagamento no próximo passo.`
              : "Sem cartão. Você pode mudar de plano quando quiser."}
          </p>
        </fieldset>

        <Botao type="submit" className="w-full" tamanho="lg">
          Criar conta
        </Botao>
        <p className="text-center text-sm text-cinza">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-extrabold text-preto underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
