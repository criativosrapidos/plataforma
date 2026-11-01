import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALERT_TIPO_LABEL, AREA_LABEL, brl, dataBR, dataHoraBR, ESCOLARIDADE_LABEL, hojeISO, PLANO_INFO, somarDias, type AlertTipo } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { FormCortesia } from "@/components/admin/usuarios/FormCortesia";
import { Cabecalho, Cartao, cx, Definicoes, Etiqueta, Tabela, Td, Th, Tr } from "@/components/admin/ui";
import { enviarAvisoTesteAcao, estenderTesteAcao, mudarPapelAcao, revogarSessaoAcao, revogarSessoesAcao } from "@/lib/admin/acoes/usuarios";
import { exigirPainel } from "@/lib/admin/auth";
import { usuarioDetalhe } from "@/lib/admin/consultas/usuarios";
import {
  ALERTA_STATUS_ROTULO, ALERTA_STATUS_TOM, CANAL_ROTULO, CICLO_ROTULO, idade, PAGAMENTO_ROTULO, PAGAMENTO_TOM, PAPEL_ROTULO, PAPEL_TOM, PLANO_ROTULO,
  SUB_STATUS_ROTULO, SUB_STATUS_TOM,
} from "@/lib/admin/formato";
import { ehUuid } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Usuário" };

export default async function Usuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirPainel("admin", `/admin/usuarios/${id}`);
  if (!ehUuid(id)) notFound();
  const d = await usuarioDetalhe(id);
  if (!d) notFound();
  const { u } = d;
  const atual = d.assinaturas[0] && ["trial", "ativa", "inadimplente"].includes(d.assinaturas[0].status) ? d.assinaturas[0] : null;
  const agora = new Date();
  const sessoesAtivas = d.sessoes.filter((x) => !x.revoked_at && new Date(x.expires_at) > agora);
  const limites = PLANO_INFO.aprovado.limites;
  const ehAprovado = atual?.plano === "aprovado";

  return (
    <>
      <Cabecalho
        titulo={u.nome}
        voltar={{ href: "/admin/usuarios", rotulo: "Usuários" }}
        sub={
          <span className="flex flex-wrap items-center gap-1.5">
            <Etiqueta tom={PAPEL_TOM[u.role]}>{PAPEL_ROTULO[u.role]}</Etiqueta>
            {atual ? (
              <Etiqueta tom={SUB_STATUS_TOM[atual.status]}>
                {SUB_STATUS_ROTULO[atual.status]} · {PLANO_ROTULO[atual.plano]}
              </Etiqueta>
            ) : (
              <Etiqueta>Sem assinatura ativa</Etiqueta>
            )}
            {atual?.provider === "cortesia" && <Etiqueta tom="roxo">Cortesia</Etiqueta>}
            {u.deleted_at && <Etiqueta tom="verm">Conta apagada</Etiqueta>}
            <span>{u.email}</span>
          </span>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <AcaoBotao acao={enviarAvisoTesteAcao.bind(null, u.id)} rotulo="Enviar aviso de teste" confirmar={{ titulo: "Enviar push de teste?", texto: `Vai para os ${d.aparelhos.filter((a) => a.ativo).length} aparelhos ativos de ${u.nome}.`, botao: "Enviar" }} />
        <AcaoBotao
          acao={estenderTesteAcao.bind(null, u.id)}
          rotulo="Estender teste"
          entrada={{ tipo: "numero", rotulo: "Dias a mais", padrao: "3", min: 1, max: 30, obrigatorio: true, ajuda: "Conta a partir do fim atual do teste (ou de hoje, se já acabou)." }}
          confirmar={{ titulo: "Estender teste grátis", botao: "Estender" }}
        />
        <FormCortesia userId={u.id} padraoAte={somarDias(hojeISO(), 30)} assinaturaPaga={!!atual && atual.status !== "trial" && atual.provider !== "cortesia"} />
        <AcaoBotao
          acao={mudarPapelAcao.bind(null, u.id)}
          rotulo="Mudar papel"
          entrada={{
            tipo: "select",
            rotulo: "Novo papel",
            padrao: u.role,
            opcoes: [
              { valor: "user", rotulo: "Usuário (só o app)" },
              { valor: "editor", rotulo: "Editor (revisão, concursos, fontes, matérias)" },
              { valor: "admin", rotulo: "Admin (tudo, inclusive usuários e financeiro)" },
            ],
          }}
          confirmar={{ titulo: `Papel de ${u.nome}`, texto: "Editor e admin entram no painel. A mudança vale no próximo carregamento de página.", botao: "Salvar papel" }}
          desabilitado={u.id === s.id}
          titulo={u.id === s.id ? "Você não pode mudar o seu próprio papel" : undefined}
        />
        <AcaoBotao
          acao={revogarSessoesAcao.bind(null, u.id)}
          rotulo={`Revogar sessões (${sessoesAtivas.filter((x) => x.id !== s.sessaoId).length})`}
          variante="sec"
          className="text-verm"
          desabilitado={sessoesAtivas.filter((x) => x.id !== s.sessaoId).length === 0}
          confirmar={{ titulo: "Revogar todas as sessões?", texto: `${u.nome} sai do app e do site em todos os aparelhos e precisa entrar de novo.`, botao: "Revogar", perigo: true }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Cartao titulo="Dados">
            <Definicoes
              itens={[
                ["E-mail", <>{u.email} {u.email_verificado_em ? <Etiqueta tom="verde">verificado</Etiqueta> : <Etiqueta>não verificado</Etiqueta>}</>],
                ["Telefone", u.telefone ? <span className="font-mono">{u.telefone}</span> : "—"],
                ["WhatsApp", u.whatsapp_optin ? `autorizado em ${dataBR(u.whatsapp_optin_em)}` : "sem autorização"],
                ["Busca nominal no DOU", u.busca_nominal_optin ? `autorizada · “${u.nome_busca ?? u.nome}”` : "não autorizada"],
                ["Cadastro", <span key="c" className="font-mono">{dataHoraBR(u.created_at)}</span>],
                ["Último acesso", <span key="a" className="font-mono">{dataHoraBR(u.ultimo_acesso_em)}</span>],
                ["Termos aceitos", <span key="t" className="font-mono">{dataHoraBR(u.termos_aceitos_em)}</span>],
                [
                  "Ajustes de aviso",
                  d.ajustes
                    ? `push ${d.ajustes.push_on ? "ligado" : "desligado"} · WhatsApp ${d.ajustes.whatsapp_on ? "ligado" : "desligado"} · ${d.ajustes.antecedencia_dias} dias antes`
                    : "padrão",
                ],
              ]}
            />
          </Cartao>

          <Cartao titulo="Assinaturas" corpo={false}>
            {d.assinaturas.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nunca iniciou teste nem assinatura.</p>
            ) : (
              <Tabela>
                <thead>
                  <tr>
                    <Th>Situação</Th>
                    <Th>Plano</Th>
                    <Th>Teste até</Th>
                    <Th>Período até</Th>
                    <Th>Pagamento</Th>
                    <Th>Criada</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.assinaturas.map((a) => (
                    <Tr key={a.id}>
                      <Td>
                        <Etiqueta tom={SUB_STATUS_TOM[a.status]}>{SUB_STATUS_ROTULO[a.status]}</Etiqueta>
                        {a.cancel_at_period_end && a.status !== "cancelada" && <span className="ml-1 text-[11.5px] text-tx2">cancela no fim</span>}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {PLANO_ROTULO[a.plano]} <span className="text-tx2">· {CICLO_ROTULO[a.ciclo]}</span>
                      </Td>
                      <Td className="font-mono text-[12px]">{dataBR(a.trial_ends_at)}</Td>
                      <Td className="font-mono text-[12px]">{dataBR(a.current_period_end)}</Td>
                      <Td className="text-[12.5px]">
                        {a.provider === "cortesia" ? <Etiqueta tom="roxo">Cortesia</Etiqueta> : `${a.metodo === "pix_automatico" ? "Pix automático" : a.metodo === "cartao" ? "Cartão" : "—"} · ${a.provider}`}
                      </Td>
                      <Td className="font-mono text-[12px] text-tx2">{dataBR(a.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Cartao>

          <Cartao titulo={`Pagamentos (${d.pagamentos.length})`} corpo={false}>
            {d.pagamentos.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nenhum pagamento.</p>
            ) : (
              <Tabela>
                <thead>
                  <tr>
                    <Th>Vencimento</Th>
                    <Th num>Valor</Th>
                    <Th>Situação</Th>
                    <Th>Pago em</Th>
                    <Th>Método</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.pagamentos.map((p) => (
                    <Tr key={p.id}>
                      <Td className="font-mono text-[12px]">{dataBR(p.vencimento ?? p.created_at)}</Td>
                      <Td num>{brl(p.valor_centavos)}</Td>
                      <Td>
                        <Etiqueta tom={PAGAMENTO_TOM[p.status]}>{PAGAMENTO_ROTULO[p.status]}</Etiqueta>
                      </Td>
                      <Td className="font-mono text-[12px]">{dataHoraBR(p.pago_em)}</Td>
                      <Td className="text-[12.5px] text-tx2">{p.metodo === "pix_automatico" ? "Pix automático" : p.metodo === "cartao" ? "Cartão" : p.metodo ?? "—"}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Cartao>

          <Cartao titulo="Últimos avisos" corpo={false}>
            {d.avisos.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nenhum aviso enviado.</p>
            ) : (
              <Tabela>
                <thead>
                  <tr>
                    <Th>Quando</Th>
                    <Th>Aviso</Th>
                    <Th>Canal</Th>
                    <Th>Situação</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.avisos.map((a) => (
                    <Tr key={a.id}>
                      <Td className="whitespace-nowrap font-mono text-[12px]">{dataHoraBR(a.enviado_em ?? a.created_at)}</Td>
                      <Td className="min-w-[200px]">
                        <span className="font-semibold">{a.titulo}</span>
                        <p className="text-[11.5px] text-tx2">
                          {ALERT_TIPO_LABEL[a.tipo as AlertTipo] ?? a.tipo}
                          {a.lido_em && " · lido"}
                        </p>
                        {a.erro && <p className="font-mono text-[11px] text-verm">{a.erro}</p>}
                      </Td>
                      <Td className="text-[12.5px]">{CANAL_ROTULO[a.canal]}</Td>
                      <Td>
                        <Etiqueta tom={ALERTA_STATUS_TOM[a.status]}>{ALERTA_STATUS_ROTULO[a.status]}</Etiqueta>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Cartao>
        </div>

        <div className="space-y-4">
          <Cartao titulo="Uso do mês" sub={ehAprovado ? "Limites do plano Aprovado." : "WhatsApp e Pergunte ao edital são do plano Aprovado."}>
            <Uso rotulo="WhatsApp" usado={d.uso.whatsapp} limite={ehAprovado ? limites.whatsappMes : 0} />
            <div className="h-3" />
            <Uso rotulo="Perguntas ao edital" usado={d.uso.perguntas} limite={ehAprovado ? limites.perguntasMes : 0} />
          </Cartao>

          <Cartao titulo={`Concursos acompanhados (${d.acompanha.length})`} corpo={false}>
            {d.acompanha.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Não acompanha nenhum concurso.</p>
            ) : (
              <ul className="divide-y divide-linha">
                {d.acompanha.map((f) => (
                  <li key={f.contest_id} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                    <Link href={`/admin/concursos/${f.contest_id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-azul">
                      {f.titulo}
                    </Link>
                    <span className="font-mono text-[11.5px] text-tx2" title="Itens do checklist feitos">
                      {f.feitos}/{f.itens}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao titulo={`Perfis de busca (${d.perfis.length})`} corpo={false}>
            {d.perfis.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nenhum perfil.</p>
            ) : (
              <ul className="divide-y divide-linha">
                {d.perfis.map((p) => (
                  <li key={p.id} className="px-4 py-2.5 text-[13px]">
                    <p className="font-semibold">
                      {p.nome} {!p.ativo && <Etiqueta>pausado</Etiqueta>}
                    </p>
                    <p className="text-[12px] text-tx2">
                      {[
                        p.escolaridades.map((x) => ESCOLARIDADE_LABEL[x as keyof typeof ESCOLARIDADE_LABEL] ?? x).join(", "),
                        p.areas.map((x) => AREA_LABEL[x as keyof typeof AREA_LABEL] ?? x).join(", "),
                        p.ufs.length ? `UF ${p.ufs.join(", ")}` : "todo o Brasil",
                        p.salario_min_centavos ? `a partir de ${brl(p.salario_min_centavos)}` : null,
                        [...p.cargos, ...p.palavras_chave].join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao titulo="Sessões e aparelhos" corpo={false}>
            <ul className="divide-y divide-linha">
              {d.sessoes.map((x) => {
                const ativa = !x.revoked_at && new Date(x.expires_at) > agora;
                return (
                  <li key={x.id} className={cx("flex items-center gap-2 px-4 py-2 text-[12.5px]", !ativa && "opacity-55")}>
                    <Etiqueta tom={ativa ? "verde" : "cinza"}>{x.cliente === "app" ? "App" : "Site"}</Etiqueta>
                    <span className="min-w-0 flex-1 truncate text-tx2" title={x.user_agent ?? ""}>
                      {x.user_agent ?? "—"}
                    </span>
                    <span className="shrink-0 font-mono text-[11.5px]">{ativa ? idade(x.created_at, agora) : x.revoked_at ? "revogada" : "expirou"}</span>
                    {ativa && x.id !== s.sessaoId && (
                      <AcaoBotao acao={revogarSessaoAcao.bind(null, u.id, x.id)} rotulo="Revogar" tamanho="sm" variante="fantasma" className="text-verm hover:bg-verm-t" />
                    )}
                    {x.id === s.sessaoId && <span className="text-[11px] font-semibold text-azul">você</span>}
                  </li>
                );
              })}
              {d.sessoes.length === 0 && <li className="px-4 py-3 text-[13px] text-tx2">Nenhuma sessão.</li>}
            </ul>
            {d.aparelhos.length > 0 && (
              <div className="border-t border-linha px-4 py-2.5 text-[12.5px]">
                <p className="mb-1 font-semibold text-tx2">Aparelhos para push</p>
                {d.aparelhos.map((a) => (
                  <p key={a.id} className="flex justify-between">
                    <span>
                      {a.plataforma === "ios" ? "iPhone" : a.plataforma === "android" ? "Android" : "Navegador"} {!a.ativo && <Etiqueta>inativo</Etiqueta>}
                    </span>
                    <span className="font-mono text-[11.5px] text-tx2">visto {idade(a.last_seen_at, agora)}</span>
                  </p>
                ))}
              </div>
            )}
          </Cartao>

          {d.auditoria.length > 0 && (
            <Cartao titulo="Ações da equipe nesta conta" corpo={false}>
              <ul className="divide-y divide-linha">
                {d.auditoria.map((a) => (
                  <li key={a.id} className="px-4 py-2 text-[12.5px]">
                    <span className="font-mono text-[11.5px] text-tx2">{dataHoraBR(a.created_at)}</span> · <b>{a.acao}</b> por {a.ator ?? "sistema"}
                  </li>
                ))}
              </ul>
            </Cartao>
          )}
        </div>
      </div>
    </>
  );
}

function Uso({ rotulo, usado, limite }: { rotulo: string; usado: number; limite: number }) {
  const frac = limite ? Math.min(1, usado / limite) : 0;
  const cor = frac >= 1 ? "bg-verm" : frac >= 0.8 ? "bg-[#E0A100]" : "bg-azul";
  return (
    <div>
      <p className="mb-1 flex justify-between text-[12.5px]">
        <span className="font-semibold">{rotulo}</span>
        <span className="font-mono">
          {usado}
          {limite ? ` de ${limite}` : ""}
          {!limite && <span className="text-tx2"> (sem direito)</span>}
        </span>
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-azul-t" role="img" aria-label={`${rotulo}: ${usado} de ${limite}`}>
        <div className={cx("h-full rounded-full", cor)} style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
}
