import "@/components/ui/movimento.css";
import Link from "next/link";
import { Gabarito, Logo } from "@/components/ui/Logo";
import { BotaoLink } from "@/components/ui/Botao";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center px-4 sm:h-[72px] sm:px-6">
        <Logo />
      </header>
      <main id="conteudo" className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <Gabarito marcada="E" />
        <p className="rotulo mt-8 text-azul">Erro 404</p>
        <h1 className="mt-4 max-w-3xl text-[clamp(3rem,9vw,6rem)]">
          Página <span className="grifo">não encontrada</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-tx2">
          Esse endereço não existe ou mudou de lugar. Diferente de um prazo de inscrição, este dá para recuperar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotaoLink href="/">Ir para o início</BotaoLink>
          <BotaoLink href="/concursos" variante="secundario" icone="lupa">
            Buscar concursos
          </BotaoLink>
        </div>
        <p className="mt-10 text-sm text-tx2">
          Já tem conta?{" "}
          <Link href="/conta" className="font-bold text-azul">
            Ir para a minha conta
          </Link>
        </p>
      </main>
    </div>
  );
}
