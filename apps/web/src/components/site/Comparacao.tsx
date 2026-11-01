import { Icone } from "@/components/ui/Icone";
import { COMPARACAO } from "./conteudo";

/** Procurar sozinho × Aviso Concurso. Tabela no desktop, lista no celular. */
export function Comparacao() {
  return (
    <>
      <div className="relative hidden overflow-hidden rounded-[24px] border border-linha bg-branco md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Comparação entre procurar concursos sozinho e usar o Aviso Concurso</caption>
          <thead>
            <tr className="border-b border-linha">
              <th scope="col" className="w-[26%] px-6 py-4">
                <span className="sr-only">Item</span>
              </th>
              <th scope="col" className="px-6 py-4 font-mono text-[12px] font-bold tracking-[0.12em] text-tx2 uppercase">
                Procurar sozinho
              </th>
              <th scope="col" className="bg-azul-t px-6 py-4 font-mono text-[12px] font-bold tracking-[0.12em] text-azul-2 uppercase">
                Aviso Concurso
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARACAO.map((l) => (
              <tr key={l.item} className="border-b border-linha last:border-0">
                <th scope="row" className="px-6 py-4 font-bold">
                  {l.item}
                </th>
                <td className="px-6 py-4 text-tx2">
                  <span className="inline-flex items-center gap-2">
                    <Icone nome="fechar" tamanho={16} className="shrink-0 text-[#A8232A]" />
                    {l.sozinho}
                  </span>
                </td>
                <td className="bg-azul-t/60 px-6 py-4 font-bold text-tinta">
                  <span className="inline-flex items-center gap-2">
                    <Icone nome="check" tamanho={16} strokeWidth={3} className="shrink-0 text-azul" />
                    {l.aviso}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {COMPARACAO.map((l) => (
          <li key={l.item} className="rounded-[20px] border border-linha bg-branco p-4">
            <p className="font-bold">{l.item}</p>
            <p className="mt-2 flex items-start gap-2 text-[15px] text-tx2">
              <Icone nome="fechar" tamanho={16} className="mt-1 shrink-0 text-[#A8232A]" />
              <span>
                <span className="sr-only">Procurar sozinho: </span>
                {l.sozinho}
              </span>
            </p>
            <p className="mt-1 flex items-start gap-2 text-[15px] font-bold">
              <Icone nome="check" tamanho={16} strokeWidth={3} className="mt-1 shrink-0 text-azul" />
              <span>
                <span className="sr-only">Aviso Concurso: </span>
                {l.aviso}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
