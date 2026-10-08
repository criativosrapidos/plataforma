"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell, Campo } from "@/components/AuthShell";
import { Botao, Destaque } from "@/components/ui";

const ETAPAS = ["Lendo seu Instagram", "Encontrando suas cores e logo", "Entendendo seu tom de voz", "Montando o perfil da marca"];

export default function Onboarding() {
  const router = useRouter();
  const [lendo, setLendo] = useState(false);
  const [etapa, setEtapa] = useState(0);

  useEffect(() => {
    if (!lendo) return;
    if (etapa >= ETAPAS.length) {
      router.push("/onboarding/perfil");
      return;
    }
    const t = setTimeout(() => setEtapa((e) => e + 1), 700);
    return () => clearTimeout(t);
  }, [lendo, etapa, router]);

  return (
    <AuthShell>
      <p className="text-sm font-extrabold text-cinza">Passo 1 de 2</p>
      <h1 className="mt-2 text-4xl">
        Conecte sua <Destaque>marca.</Destaque>
      </h1>
      <p className="mt-3 text-cinza">Informe seu Instagram e/ou site. A gente lê e monta o perfil da sua marca.</p>

      {!lendo ? (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setLendo(true);
          }}
        >
          <Campo label="Instagram" placeholder="@suamarca" defaultValue="@brasaburger" />
          <Campo label="Site (opcional)" placeholder="suamarca.com.br" defaultValue="brasaburger.com.br" />
          <Botao type="submit" className="w-full" tamanho="lg">
            Ler minha marca
          </Botao>
        </form>
      ) : (
        <ul className="mt-8 space-y-3">
          {ETAPAS.map((t, i) => (
            <li key={t} className={`flex items-center gap-3 rounded-xl border border-linha bg-white p-4 transition ${i > etapa ? "opacity-40" : ""}`}>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold ${
                  i < etapa ? "bg-preto text-white" : "bg-amarelo"
                } ${i === etapa ? "animate-pulse" : ""}`}
              >
                {i < etapa ? "✓" : i + 1}
              </span>
              <span className="font-extrabold">{t}</span>
            </li>
          ))}
        </ul>
      )}
    </AuthShell>
  );
}
