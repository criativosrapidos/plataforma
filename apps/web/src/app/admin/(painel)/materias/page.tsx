import type { Metadata } from "next";
import { numeroBR } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { FiltroBusca, FiltrosForm } from "@/components/admin/FiltrosForm";
import { FormMateria } from "@/components/admin/materias/FormMateria";
import { Cabecalho, Cartao, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { apagarMateriaAcao, mesclarMateriasAcao } from "@/lib/admin/acoes/coleta";
import { exigirPainel } from "@/lib/admin/auth";
import { listarMaterias } from "@/lib/admin/consultas/coleta";
import { str, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Matérias" };

export default async function Materias({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("editor", "/admin/materias");
  const sp = await searchParams;
  const q = str(sp, "q");
  const [materias, todas] = await Promise.all([listarMaterias(q), q ? listarMaterias() : null]);
  const opcoes = (todas ?? materias).map((m) => ({ valor: m.id, rotulo: m.nome }));

  return (
    <>
      <Cabecalho
        titulo="Matérias"
        sub="Nomes canônicos com sinônimos: é assim que “Noções de Direito Constitucional” e “Constitucional” viram a mesma matéria em “Matérias em comum”."
      />
      <Cartao titulo="Nova matéria" className="mb-4">
        <FormMateria id={null} />
      </Cartao>

      <div className="mb-3">
        <FiltrosForm acao="/admin/materias">
          <FiltroBusca valor={q} placeholder="Nome ou sinônimo" />
        </FiltrosForm>
      </div>

      <Cartao corpo={false}>
        {materias.length === 0 ? (
          <Vazio titulo="Nenhuma matéria" texto={q ? `Nada com “${q}”.` : "Cadastre a primeira matéria canônica."} />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Matéria</Th>
                <Th>Sinônimos</Th>
                <Th num>Concursos</Th>
                <Th num>Usos</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <Tr key={m.id}>
                  <Td className="min-w-[200px] font-semibold">
                    {m.nome}
                    <p className="font-mono text-[11px] font-normal text-tx2">{m.slug}</p>
                  </Td>
                  <Td className="max-w-[520px]">
                    {m.sinonimos.length ? (
                      <span className="flex flex-wrap gap-1">
                        {m.sinonimos.map((x) => (
                          <span key={x} className="rounded-md bg-papel px-1.5 py-0.5 text-[12px] text-tx2">
                            {x}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[12px] text-tx2">—</span>
                    )}
                  </Td>
                  <Td num>{numeroBR(m.concursos)}</Td>
                  <Td num className="text-tx2">
                    {numeroBR(m.usos)}
                  </Td>
                  <Td className="whitespace-nowrap text-right">
                    <FormMateria id={m.id} nome={m.nome} sinonimos={m.sinonimos} />
                    <AcaoBotao
                      acao={mesclarMateriasAcao.bind(null, m.id)}
                      rotulo="Mesclar"
                      tamanho="sm"
                      variante="fantasma"
                      confirmar={{
                        titulo: `Mesclar “${m.nome}” em outra matéria`,
                        texto: (
                          <>
                            Os {m.usos} usos de “{m.nome}” passam para a matéria escolhida (somando questões quando o mesmo cargo já tem as duas). “{m.nome}” e seus
                            sinônimos viram sinônimos do destino e esta matéria é apagada.
                          </>
                        ),
                        botao: "Mesclar",
                        perigo: true,
                      }}
                      entrada={{
                        tipo: "select",
                        rotulo: "Mesclar em",
                        obrigatorio: true,
                        padrao: "",
                        opcoes: [{ valor: "", rotulo: "Escolha a matéria de destino…" }, ...opcoes.filter((o) => o.valor !== m.id)],
                      }}
                    />
                    <AcaoBotao
                      acao={apagarMateriaAcao.bind(null, m.id)}
                      rotulo="Apagar"
                      tamanho="sm"
                      variante="fantasma"
                      className="text-verm hover:bg-verm-t"
                      desabilitado={m.usos > 0}
                      titulo={m.usos > 0 ? "Em uso: mescle em vez de apagar" : undefined}
                      confirmar={{ titulo: `Apagar “${m.nome}”?`, texto: "A matéria não está em uso em nenhum concurso.", botao: "Apagar", perigo: true }}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Cartao>
    </>
  );
}
