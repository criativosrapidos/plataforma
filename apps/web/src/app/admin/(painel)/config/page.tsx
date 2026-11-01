import type { Metadata } from "next";
import { dataHoraBR } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { LinhaConfig, NovaChave } from "@/components/admin/config/FormConfig";
import { Cabecalho, Cartao } from "@/components/admin/ui";
import { restaurarConfigAcao } from "@/lib/admin/acoes/sistema";
import { exigirPainel } from "@/lib/admin/auth";
import { CONFIG_DEFS } from "@/lib/admin/config-defs";
import { listarConfig } from "@/lib/admin/consultas/config";
import { sql } from "@/lib/db";

export const metadata: Metadata = { title: "Configurações" };

export default async function Config() {
  await exigirPainel("admin", "/admin/config");
  const [linhas, noBanco] = await Promise.all([listarConfig(), sql<{ chave: string }[]>`select chave from app_config`]);
  const salvas = new Set(noBanco.map((r) => r.chave));
  const grupos = [...new Set(CONFIG_DEFS.map((d) => d.grupo))];
  const outras = linhas.filter((l) => !l.conhecida);

  return (
    <>
      <Cabecalho titulo="Configurações" sub="Chaves de app_config lidas pelos jobs e pela API. Toda alteração fica na auditoria." />
      <div className="max-w-4xl space-y-4">
        {grupos.map((g) => (
          <Cartao key={g} titulo={g} corpo={false}>
            {CONFIG_DEFS.filter((d) => d.grupo === g).map((d) => {
              const l = linhas.find((x) => x.chave === d.chave);
              // o schema (zod) não atravessa para o cliente: só os dados da definição
              const def = { chave: d.chave, rotulo: d.rotulo, ajuda: d.ajuda, tipo: d.tipo, padrao: d.padrao, grupo: d.grupo, min: d.min, max: d.max, passo: d.passo };
              return (
                <LinhaConfig
                  key={d.chave}
                  def={def}
                  valor={l?.valor}
                  atualizado={l?.updated_at ? new Date(l.updated_at).toISOString() : null}
                  noBanco={salvas.has(d.chave)}
                />
              );
            })}
          </Cartao>
        ))}
        <Cartao titulo="Outras chaves" sub="Valores livres em JSON, para ajustes que ainda não têm campo próprio." corpo={false}>
          {outras.map((l) => (
            <div key={l.chave} className="flex flex-wrap items-center gap-3 border-b border-linha/70 px-4 py-3 text-[13px]">
              <span className="font-mono font-semibold">{l.chave}</span>
              <code className="min-w-0 flex-1 truncate rounded bg-papel px-2 py-1 font-mono text-[12px]">{JSON.stringify(l.valor)}</code>
              <span className="font-mono text-[11px] text-tx2">{dataHoraBR(l.updated_at)}</span>
              <AcaoBotao
                acao={restaurarConfigAcao.bind(null, l.chave)}
                rotulo="Remover"
                tamanho="sm"
                variante="fantasma"
                className="text-verm hover:bg-verm-t"
                confirmar={{ titulo: `Remover “${l.chave}”?`, texto: "Quem lê esta chave passa a usar o próprio padrão.", botao: "Remover", perigo: true }}
              />
            </div>
          ))}
          <NovaChave />
        </Cartao>
      </div>
    </>
  );
}
