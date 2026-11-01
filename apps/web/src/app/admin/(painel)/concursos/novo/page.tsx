import type { Metadata } from "next";
import { EditorConcurso } from "@/components/admin/concursos/EditorConcurso";
import { Cabecalho } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { modeloDeBanco } from "@/lib/admin/concurso-form";
import { todasMaterias } from "@/lib/admin/consultas/concursos";

export const metadata: Metadata = { title: "Novo concurso" };

export default async function NovoConcurso() {
  await exigirPainel("editor", "/admin/concursos/novo");
  const materias = await todasMaterias();
  return (
    <>
      <Cabecalho
        titulo="Novo concurso"
        sub="Cadastro manual, para quando a coleta não pegou. Todo concurso precisa de link oficial."
        voltar={{ href: "/admin/concursos", rotulo: "Concursos" }}
      />
      <EditorConcurso id={null} modeloInicial={modeloDeBanco(null)} publicado={false} seguidores={0} materias={materias} />
    </>
  );
}
