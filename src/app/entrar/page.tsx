"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, Campo } from "@/components/AuthShell";
import { Botao, Destaque } from "@/components/ui";

export default function Entrar() {
  const router = useRouter();
  return (
    <AuthShell>
      <h1 className="text-4xl">
        Bom te ver de <Destaque>novo.</Destaque>
      </h1>
      <p className="mt-3 text-cinza">Entre pra ver as peças do mês.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/app");
        }}
      >
        <Campo label="E-mail" type="email" placeholder="voce@empresa.com.br" defaultValue="rafa@brasaburger.com.br" required />
        <Campo label="Senha" type="password" defaultValue="demonstracao" required />
        <div className="text-right">
          <span className="text-sm font-extrabold underline">Esqueci a senha</span>
        </div>
        <Botao type="submit" className="w-full" tamanho="lg">
          Entrar
        </Botao>
        <p className="text-center text-sm text-cinza">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-extrabold text-preto underline">
            Criar grátis
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
