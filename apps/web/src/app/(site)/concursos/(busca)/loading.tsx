import { Container } from "@/components/site/Secao";

export default function CarregandoConcursos() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando concursos...</span>
      <Container className="pt-10 pb-8 md:pt-16 md:pb-12">
        <div className="ac-esqueleto h-4 w-40" />
        <div className="ac-esqueleto mt-4 h-14 w-full max-w-xl" />
        <div className="ac-esqueleto mt-4 h-5 w-full max-w-2xl" />
      </Container>
      <Container className="grid gap-4 py-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <div className="ac-esqueleto hidden h-96 lg:block" />
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ac-esqueleto h-64 rounded-[24px]" />
          ))}
        </div>
      </Container>
    </div>
  );
}
