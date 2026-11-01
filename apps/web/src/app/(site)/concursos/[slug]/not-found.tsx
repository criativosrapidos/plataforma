import { Container } from "@/components/site/Secao";
import { BotaoLink } from "@/components/ui/Botao";

export default function ConcursoNaoEncontrado() {
  return (
    <Container className="py-20 md:py-28">
      <p className="rotulo text-azul">Erro 404</p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.6rem,7vw,4.6rem)]">
        Esse concurso <span className="grifo">não está aqui</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg text-tx2">
        O endereço pode ter mudado ou o concurso saiu da nossa base. Busque pelo órgão ou pelo cargo.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <BotaoLink href="/concursos" icone="lupa">
          Buscar concursos
        </BotaoLink>
        <BotaoLink href="/" variante="secundario">
          Página inicial
        </BotaoLink>
      </div>
    </Container>
  );
}
