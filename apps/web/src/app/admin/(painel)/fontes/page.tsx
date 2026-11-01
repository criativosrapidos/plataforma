import type { Metadata } from "next";
import Link from "next/link";
import { numeroBR } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { botao, Cabecalho, Cartao, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { alternarFonteAcao, rodarFonteAcao } from "@/lib/admin/acoes/coleta";
import { exigirPainel } from "@/lib/admin/auth";
import { listarFontes } from "@/lib/admin/consultas/coleta";
import { duracao, FONTE_TIPO_ROTULO, idade, RUN_STATUS_ROTULO, RUN_STATUS_TOM } from "@/lib/admin/formato";

export const metadata: Metadata = { title: "Fontes" };

export default async function Fontes() {
  await exigirPainel("editor", "/admin/fontes");
  const fontes = await listarFontes();
  const agora = new Date();

  return (
    <>
      <Cabecalho titulo="Fontes" sub="De onde vêm os concursos: DOU (INLABS), Querido Diário, diários estaduais e sites das bancas.">
        <Link href="/admin/fontes/nova" className={botao("primario")}>
          + Nova fonte
        </Link>
      </Cabecalho>
      <Cartao corpo={false}>
        {fontes.length === 0 ? (
          <Vazio titulo="Nenhuma fonte" texto="Cadastre a primeira fonte de coleta." />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Fonte</Th>
                <Th>Frequência</Th>
                <Th>Última execução</Th>
                <Th num>Docs novos 7d</Th>
                <Th num>Erros 7d</Th>
                <Th>Ativa</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {fontes.map((f) => {
                const atrasada =
                  f.ativo && f.ultimo && agora.getTime() - new Date(f.ultimo.iniciado_em).getTime() > f.frequencia_min * 2 * 60_000 + 15 * 60_000;
                return (
                  <Tr key={f.id} className={f.ativo ? undefined : "opacity-60"}>
                    <Td className="min-w-[220px]">
                      <Link href={`/admin/fontes/${f.id}`} className="font-semibold hover:text-azul">
                        {f.nome}
                      </Link>
                      <p className="text-[12px] text-tx2">
                        {FONTE_TIPO_ROTULO[f.tipo]} · <span className="font-mono">{f.slug}</span>
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12.5px]">a cada {duracao(f.frequencia_min)}</Td>
                    <Td className="min-w-[200px]">
                      {f.ultimo ? (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Etiqueta tom={RUN_STATUS_TOM[f.ultimo.status]}>{RUN_STATUS_ROTULO[f.ultimo.status]}</Etiqueta>
                            <span className="font-mono text-[12px]">{idade(f.ultimo.iniciado_em, agora)}</span>
                            {atrasada && <Etiqueta tom="ambar">Atrasada</Etiqueta>}
                          </span>
                          {f.ultimo.erro && <p className="mt-0.5 max-w-xs truncate font-mono text-[11px] text-verm">{f.ultimo.erro}</p>}
                        </>
                      ) : (
                        <span className="text-[12.5px] text-tx2">nunca rodou</span>
                      )}
                    </Td>
                    <Td num>{numeroBR(f.docs_7d)}</Td>
                    <Td num className={f.erros_7d ? "text-verm" : undefined}>
                      {f.erros_7d} <span className="text-tx2">/ {f.runs_7d}</span>
                    </Td>
                    <Td>
                      <AcaoBotao
                        acao={alternarFonteAcao.bind(null, f.id, !f.ativo)}
                        rotulo={f.ativo ? "Ligada" : "Desligada"}
                        tamanho="sm"
                        variante={f.ativo ? "sec" : "sec"}
                        className={f.ativo ? "border-verde/40 text-verde" : "text-tx2"}
                        titulo={f.ativo ? "Clique para desligar" : "Clique para ligar"}
                        confirmar={f.ativo ? { titulo: `Desligar ${f.nome}?`, texto: "A fonte para de coletar até ser religada.", botao: "Desligar", perigo: true } : undefined}
                      />
                    </Td>
                    <Td className="text-right">
                      <AcaoBotao acao={rodarFonteAcao.bind(null, f.id)} rotulo="Rodar agora" tamanho="sm" variante="fantasma" desabilitado={!f.ativo} titulo={f.ativo ? undefined : "Ligue a fonte para rodar"} />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Tabela>
        )}
      </Cartao>
    </>
  );
}
