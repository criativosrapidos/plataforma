"use client";

import Link from "next/link";
import { Cartao } from "@/components/ui";
import { getPlan } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function Conta() {
  const { conta } = useStore();
  const plano = getPlan(conta.plano);
  const itens = [
    { t: "Dados pessoais", d: `${conta.nome} · ${conta.email}` },
    { t: "Usuários", d: `1 de ${plano.usuarios} ${plano.usuarios === 1 ? "usuário" : "usuários"}` },
    { t: "Pagamento", d: plano.precoMensal ? `Cartão final 4242 · ${conta.ciclo}` : "Nenhum (plano Grátis)" },
    { t: "Notas fiscais", d: "Enviadas por e-mail" },
    { t: "Ajuda no WhatsApp", d: plano.id === "profissional" ? "Suporte prioritário" : "Seg a sex, 9h às 18h" },
  ];
  if (plano.whiteLabel) itens.splice(2, 0, { t: "Sua logo na plataforma", d: "Aparece no lugar da nossa pro seu cliente" });

  return (
    <>
      <h1 className="text-3xl">Conta</h1>
      <Cartao className="mt-5 divide-y divide-linha">
        {itens.map((i) => (
          <div key={i.t} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-extrabold">{i.t}</p>
              <p className="truncate text-sm text-cinza">{i.d}</p>
            </div>
            <span className="text-cinza">›</span>
          </div>
        ))}
      </Cartao>
      <Link href="/" className="mt-6 block text-center text-sm font-extrabold underline">
        Sair
      </Link>
    </>
  );
}
