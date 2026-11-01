// Ajustes: plano, notificações, WhatsApp (Aprovado), e-mail, antecedência, horário silencioso, perfis e conta.
import { useCallback, useState, type ReactNode } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Crown, ExternalLink, LogOut, Phone, Plus, Trash2 } from "lucide-react-native";
import { brl, dataBR, PLANO_INFO, temRecurso, type AjustesDTO } from "@aviso/shared";
import { api } from "@/api/api";
import { mensagemDeErro } from "@/api/cliente";
import { chaves, usePerfis, useSalvarAjustes } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { Cabecalho } from "@/componentes/Cabecalho";
import { Campo } from "@/componentes/Campo";
import { CaixaMarcar, Interruptor, Segmentado } from "@/componentes/Controles";
import { Esqueleto } from "@/componentes/Esqueleto";
import { Etiqueta, SeloAprovado } from "@/componentes/Etiqueta";
import { Folha } from "@/componentes/Folha";
import { resumoPerfil } from "@/componentes/FormularioPerfil";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { useNotificacoes } from "@/contexto/Notificacoes";
import { useSessao } from "@/contexto/Sessao";
import { useUpsell } from "@/contexto/Upsell";
import { LINKS } from "@/lib/config";
import { telefoneBR, type TomEtiqueta } from "@/lib/formato";
import { abrirLink } from "@/lib/links";
import { estadoPermissao, PUSH_DISPONIVEL, type EstadoPermissao } from "@/lib/push";
import { vibrar } from "@/lib/vibrar";
import { cores, TOQUE_MIN } from "@/tema";

const SILENCIOS: { rotulo: string; inicio: string | null; fim: string | null }[] = [
  { rotulo: "Desligado", inicio: null, fim: null },
  { rotulo: "22h às 7h", inicio: "22:00", fim: "07:00" },
  { rotulo: "23h às 6h", inicio: "23:00", fim: "06:00" },
  { rotulo: "21h às 8h", inicio: "21:00", fim: "08:00" },
];

export default function Ajustes() {
  const { me, sair, excluirConta } = useSessao();
  const qc = useQueryClient();
  const salvar = useSalvarAjustes();
  const perfis = usePerfis();
  const toast = useToast();
  const { abrirUpsell } = useUpsell();
  const { abrirExplicacao } = useNotificacoes();
  const [permissao, setPermissao] = useState<EstadoPermissao>("indisponivel");
  const [folhaZap, setFolhaZap] = useState(false);
  const [folhaExcluir, setFolhaExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void estadoPermissao().then(setPermissao);
    }, []),
  );

  if (!me) return null;
  const a = me.ajustes;
  const aprovado = temRecurso(me.acesso, "whatsapp");

  const mudar = (d: Partial<AjustesDTO>) => {
    vibrar.selecao();
    salvar.mutate(d, { onError: (e) => toast.mostrar(mensagemDeErro(e), "erro") });
  };

  const mudarPush = (v: boolean) => {
    if (v && PUSH_DISPONIVEL && permissao !== "permitido") {
      if (permissao === "negado") void Linking.openSettings();
      else abrirExplicacao();
    }
    mudar({ push_on: v });
  };

  const mudarZap = (v: boolean) => {
    if (!aprovado) return abrirUpsell("Prazo acabando também no WhatsApp: isenção e inscrição que acabam amanhã, até 10 avisos por mês.");
    if (v && (!me.usuario.telefone || !me.usuario.whatsapp_optin)) return setFolhaZap(true);
    mudar({ whatsapp_on: v });
  };

  const silencioAtual =
    SILENCIOS.find((s) => s.inicio === a.silencio_inicio && s.fim === a.silencio_fim)?.rotulo ??
    (a.silencio_inicio ? `${a.silencio_inicio} às ${a.silencio_fim}` : "Desligado");

  return (
    <Tela
      areaSeguraBaixo={false}
      aoAtualizar={() => Promise.all([qc.invalidateQueries({ queryKey: chaves.me }), perfis.refetch()])}
      testID="tela-ajustes"
    >
      <Cabecalho sobre={linhaPlano(me)} titulo="Ajustes" />

      <CartaoPlano />

      <Grupo titulo="Avisos">
        <Linha
          titulo="Notificações no celular"
          texto={
            Platform.OS === "web"
              ? "No navegador os avisos ficam no sino. Instale o app para receber na hora."
              : permissao === "negado"
                ? "Bloqueadas nos ajustes do celular. Toque para liberar."
                : "Edital, prazo, errata, local de prova e resultado"
          }
          direita={<Interruptor ligado={a.push_on} aoMudar={mudarPush} rotulo="Notificações no celular" testID="sw-push" />}
        />
        <Linha
          titulo="WhatsApp"
          selo={<SeloAprovado style={{ marginLeft: 8 }} />}
          texto={
            aprovado && a.whatsapp_on && me.usuario.telefone
              ? `Para ${telefoneBR(me.usuario.telefone)} · ${me.uso.whatsappMes} de ${me.uso.limites.whatsappMes} este mês`
              : "Só isenção e inscrição que acabam amanhã, até 10 por mês"
          }
          direita={<Interruptor ligado={aprovado && a.whatsapp_on} aoMudar={mudarZap} rotulo="Avisos por WhatsApp" testID="sw-whatsapp" />}
          extra={
            aprovado && a.whatsapp_on ? (
              <Pressionavel onPress={() => setFolhaZap(true)} style={s.trocar} accessibilityLabel="Trocar o número do WhatsApp">
                <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 13.5 }}>
                  Trocar número
                </Texto>
              </Pressionavel>
            ) : null
          }
        />
        <Linha
          titulo="Resumo semanal por e-mail"
          texto="Toda segunda, 7h: prazos da semana e novidades"
          direita={
            <Interruptor
              ligado={a.email_resumo}
              aoMudar={(v) => mudar({ email_resumo: v })}
              rotulo="Resumo semanal por e-mail"
              testID="sw-email"
            />
          }
          ultima
        />
      </Grupo>

      <Grupo titulo="Lembretes">
        <View style={s.bloco}>
          <Texto variante="corpoForte">Avisar prazo antes</Texto>
          <Segmentado
            opcoes={([1, 2, 3, 5] as const).map((d) => ({ valor: String(d), rotulo: d === 1 ? "1 dia" : `${d} dias` }))}
            valor={String(a.antecedencia_dias)}
            aoMudar={(v) => mudar({ antecedencia_dias: Number(v) as AjustesDTO["antecedencia_dias"] })}
          />
          <Texto variante="meta">
            Isenção e inscrição: aviso {a.antecedencia_dias === 1 ? "1 dia" : `${a.antecedencia_dias} dias`} antes do fim e de novo na
            véspera.
          </Texto>
        </View>
        <View style={[s.bloco, { borderBottomWidth: 0 }]}>
          <Texto variante="corpoForte">Horário silencioso</Texto>
          <View style={s.pilulas}>
            {SILENCIOS.map((op) => {
              const ativo = op.rotulo === silencioAtual;
              return (
                <Pressionavel
                  key={op.rotulo}
                  onPress={() => mudar({ silencio_inicio: op.inicio, silencio_fim: op.fim })}
                  haptico="nenhum"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Horário silencioso: ${op.rotulo}`}
                  style={[s.pilula, ativo && s.pilulaAtiva]}
                >
                  <Texto variante="corpoForte" style={{ fontSize: 13 }} cor={ativo ? cores.branco : cores.tinta}>
                    {op.rotulo}
                  </Texto>
                </Pressionavel>
              );
            })}
          </View>
          <Texto variante="meta">Aviso que chegar nesse horário espera até de manhã. Prova amanhã sempre chega.</Texto>
        </View>
      </Grupo>

      <Grupo
        titulo="Perfis de busca"
        acao={
          <Pressionavel onPress={() => router.push("/perfis/novo")} style={s.acaoGrupo} accessibilityLabel="Novo perfil de busca">
            <Plus size={16} color={cores.azul} strokeWidth={2.6} />
            <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 13.5 }}>
              Novo
            </Texto>
          </Pressionavel>
        }
      >
        {perfis.isPending ? (
          <View style={{ paddingVertical: 14, gap: 8 }}>
            <Esqueleto largura="40%" />
            <Esqueleto largura="85%" altura={12} />
          </View>
        ) : perfis.data?.length ? (
          perfis.data.map((p, i) => (
            <Linha
              key={p.id}
              titulo={p.nome}
              selo={!p.ativo ? <Etiqueta texto="Pausado" tom="neutro" style={{ marginLeft: 8 }} /> : undefined}
              texto={resumoPerfil(p)}
              direita={<ChevronRight size={20} color={cores.tx2} />}
              aoTocar={() => router.push(`/perfis/${p.id}`)}
              ultima={i === perfis.data.length - 1}
            />
          ))
        ) : (
          <Linha
            titulo="Nenhum perfil ainda"
            texto="Diga o que procura para receber os concursos certos."
            direita={<ChevronRight size={20} color={cores.tx2} />}
            aoTocar={() => router.push("/perfis/novo")}
            ultima
          />
        )}
      </Grupo>

      <Grupo titulo="Conta">
        <Linha titulo={me.usuario.nome} texto={me.usuario.email} />
        <Linha
          titulo="Privacidade"
          direita={<ExternalLink size={18} color={cores.tx2} />}
          aoTocar={() => void abrirLink(LINKS.privacidade)}
        />
        <Linha
          titulo="Termos de uso"
          direita={<ExternalLink size={18} color={cores.tx2} />}
          aoTocar={() => void abrirLink(LINKS.termos)}
          ultima
        />
      </Grupo>

      <Botao titulo="Sair da conta" variante="secundario" icone={LogOut} bloco onPress={() => void sair()} testID="sair" />
      <Botao titulo="Excluir conta" variante="perigo" icone={Trash2} bloco onPress={() => setFolhaExcluir(true)} />

      <Texto variante="rotulo" cor={cores.tx2} centro style={{ fontSize: 10, marginTop: 6 }}>
        Aviso Concurso · versão {Constants.expoConfig?.version ?? "1.0.0"}
      </Texto>

      <FolhaWhatsApp visivel={folhaZap} aoFechar={() => setFolhaZap(false)} />

      <Folha
        visivel={folhaExcluir}
        aoFechar={() => setFolhaExcluir(false)}
        titulo="Excluir conta?"
        rodape={
          <>
            <Botao
              titulo="Excluir minha conta"
              variante="perigo"
              tamanho="g"
              bloco
              carregando={excluindo}
              onPress={async () => {
                setExcluindo(true);
                try {
                  await excluirConta();
                } catch (e) {
                  setExcluindo(false);
                  toast.mostrar(mensagemDeErro(e), "erro");
                }
              }}
            />
            <Botao titulo="Cancelar" variante="fantasma" onPress={() => setFolhaExcluir(false)} style={{ alignSelf: "center" }} />
          </>
        }
      >
        <Texto variante="corpo">
          Seus dados pessoais são apagados, os perfis e concursos acompanhados somem e a assinatura é cancelada, sem nova cobrança. Isso não
          pode ser desfeito.
        </Texto>
      </Folha>
    </Tela>
  );
}

function linhaPlano(me: NonNullable<ReturnType<typeof useSessao>["me"]>): string {
  const nome = me.acesso.plano ? `Plano ${PLANO_INFO[me.acesso.plano].nome}` : "Sem plano";
  if (me.acesso.emTeste && me.acesso.diasRestantesTeste != null) {
    const d = me.acesso.diasRestantesTeste;
    return `${nome} · teste grátis: ${d === 0 ? "acaba hoje" : d === 1 ? "1 dia" : `${d} dias`}`;
  }
  return nome;
}

function CartaoPlano() {
  const { me } = useSessao();
  const { abrirUpsell } = useUpsell();
  if (!me) return null;
  const ass = me.assinatura;
  const plano = me.acesso.plano ? PLANO_INFO[me.acesso.plano] : null;
  const preco =
    plano && ass ? (ass.ciclo === "anual" ? `${brl(plano.precoAnualCentavos)}/ano` : `${brl(plano.precoMensalCentavos)}/mês`) : null;
  const metodo = ass?.metodo === "cartao" ? "cartão" : ass?.metodo === "pix_automatico" ? "Pix automático" : null;
  let status: { texto: string; tom: TomEtiqueta } = { texto: "Ativa", tom: "aberto" };
  let linha = "";
  if (me.acesso.emTeste) {
    status = { texto: "Teste grátis", tom: "marca" };
    linha = `Primeira cobrança de ${preco} em ${dataBR(ass?.trial_ends_at)}${metodo ? ` no ${metodo}` : ""}. A gente avisa 1 dia antes.`;
  } else if (ass?.status === "cancelada") {
    status = { texto: "Cancelada", tom: "encerra" };
    linha = `Acesso até ${dataBR(ass.current_period_end ?? ass.trial_ends_at)}. Sem novas cobranças.`;
  } else if (ass?.status === "inadimplente") {
    status = { texto: "Pagamento pendente", tom: "encerra" };
    linha = "A última cobrança não passou. Confira a forma de pagamento no site.";
  } else if (ass) {
    linha = `${preco}${metodo ? ` no ${metodo}` : ""} · renova em ${dataBR(ass.current_period_end)}`;
  }
  const pergunte = temRecurso(me.acesso, "pergunte_edital");
  return (
    <View style={s.plano}>
      <View style={s.planoTopo}>
        <View style={s.planoIcone}>
          <Crown size={20} color={cores.tinta} strokeWidth={2.4} />
        </View>
        <Texto variante="h2" style={{ flex: 1 }}>
          {plano ? `Plano ${plano.nome}` : "Sem plano"}
        </Texto>
        <Etiqueta texto={status.texto} tom={status.tom} />
      </View>
      {linha ? <Texto variante="meta">{linha}</Texto> : null}
      {pergunte ? (
        <Texto variante="pequeno">
          Pergunte ao edital: {me.uso.perguntasMes} de {me.uso.limites.perguntasMes} este mês · WhatsApp: {me.uso.whatsappMes} de{" "}
          {me.uso.limites.whatsappMes}
        </Texto>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <Botao
          titulo="Gerenciar assinatura"
          variante="secundario"
          tamanho="p"
          icone={ExternalLink}
          onPress={() => void abrirLink(LINKS.assinatura)}
        />
        {me.acesso.plano === "aviso" ? (
          <Botao titulo="Conhecer o Aprovado" variante="marca" tamanho="p" icone={Crown} onPress={() => abrirUpsell()} />
        ) : null}
      </View>
      <Texto variante="pequeno">Cancelar, trocar de plano e recibos ficam no site, sem taxa de loja.</Texto>
    </View>
  );
}

function FolhaWhatsApp({ visivel, aoFechar }: { visivel: boolean; aoFechar: () => void }) {
  return (
    <Folha visivel={visivel} aoFechar={aoFechar} titulo="WhatsApp">
      {visivel ? <FormularioWhatsApp aoFechar={aoFechar} /> : null}
    </Folha>
  );
}

function FormularioWhatsApp({ aoFechar }: { aoFechar: () => void }) {
  const { me } = useSessao();
  const qc = useQueryClient();
  const toast = useToast();
  const salvarAjustes = useSalvarAjustes();
  const [tel, setTel] = useState(me?.usuario.telefone ? me.usuario.telefone.replace(/^\+55/, "") : "");
  const [aceito, setAceito] = useState(!!me?.usuario.whatsapp_optin);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: async () => {
      const digitos = tel.replace(/\D/g, "");
      if (digitos.length < 10 || digitos.length > 11) throw new Error("Telefone com DDD, só números.");
      if (!aceito) throw new Error("Marque a autorização para receber pelo WhatsApp.");
      await api.atualizarMe({ telefone: digitos, whatsapp_optin: true });
      await salvarAjustes.mutateAsync({ whatsapp_on: true });
    },
    onSuccess: async () => {
      vibrar.sucesso();
      await qc.invalidateQueries({ queryKey: chaves.me });
      toast.mostrar("WhatsApp ligado para prazo acabando.");
      aoFechar();
    },
    onError: (e) => setErro(e instanceof Error ? e.message : mensagemDeErro(e)),
  });

  return (
    <>
      <Texto variante="corpo" cor={cores.tx2}>
        Só para isenção e inscrição que acabam amanhã, no máximo 10 mensagens por mês. O resto continua chegando pelo app.
      </Texto>
      <Campo
        rotulo="Celular com DDD"
        icone={Phone}
        value={tel}
        onChangeText={setTel}
        keyboardType="phone-pad"
        placeholder="11 99999-0000"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <Pressionavel
        onPress={() => setAceito((v) => !v)}
        haptico="selecao"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceito }}
        style={{ flexDirection: "row", gap: 12, alignItems: "center", minHeight: TOQUE_MIN }}
      >
        <CaixaMarcar marcado={aceito} cor={cores.azul} />
        <Texto variante="meta" style={{ flex: 1, color: cores.tinta }}>
          Autorizo o Aviso Concurso a me mandar avisos de prazo pelo WhatsApp. Posso desligar quando quiser.
        </Texto>
      </Pressionavel>
      {erro ? (
        <Texto variante="corpoForte" cor={cores.vermTexto} style={{ fontSize: 14 }}>
          {erro}
        </Texto>
      ) : null}
      {me?.usuario.whatsapp_optin ? (
        <Botao
          titulo="Desligar WhatsApp"
          variante="fantasma"
          onPress={() => {
            salvarAjustes.mutate({ whatsapp_on: false });
            aoFechar();
          }}
          style={{ alignSelf: "center" }}
        />
      ) : null}
      <Botao titulo="Ligar WhatsApp" tamanho="g" bloco carregando={salvar.isPending} onPress={() => salvar.mutate()} />
    </>
  );
}

function Grupo({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={s.grupoTopo}>
        <Texto variante="rotulo" cor={cores.tx2} accessibilityRole="header">
          {titulo}
        </Texto>
        {acao}
      </View>
      <View style={s.grupo}>{children}</View>
    </View>
  );
}

function Linha({
  titulo,
  texto,
  direita,
  selo,
  extra,
  aoTocar,
  ultima,
}: {
  titulo: string;
  texto?: string;
  direita?: ReactNode;
  selo?: ReactNode;
  extra?: ReactNode;
  aoTocar?: () => void;
  ultima?: boolean;
}) {
  const conteudo = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
          <Texto variante="corpoForte">{titulo}</Texto>
          {selo}
        </View>
        {texto ? <Texto variante="meta">{texto}</Texto> : null}
        {extra}
      </View>
      {direita}
    </>
  );
  const estilo = [s.linha, ultima && { borderBottomWidth: 0 }];
  return aoTocar ? (
    <Pressionavel onPress={aoTocar} escala={0.99} style={estilo} accessibilityLabel={titulo}>
      {conteudo}
    </Pressionavel>
  ) : (
    <View style={estilo}>{conteudo}</View>
  );
}

const s = StyleSheet.create({
  plano: { backgroundColor: cores.branco, borderRadius: 20, borderWidth: 1, borderColor: cores.linha, padding: 16, gap: 8 },
  planoTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  planoIcone: { width: 36, height: 36, borderRadius: 12, backgroundColor: cores.marca, alignItems: "center", justifyContent: "center" },
  grupoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, minHeight: 24 },
  acaoGrupo: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: TOQUE_MIN, paddingHorizontal: 4 },
  grupo: { backgroundColor: cores.branco, borderRadius: 20, borderWidth: 1, borderColor: cores.linha, paddingHorizontal: 16 },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
    minHeight: 60,
  },
  bloco: { paddingVertical: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: cores.linha },
  pilulas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pilula: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: cores.linha,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: cores.branco,
  },
  trocar: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center" },
  pilulaAtiva: { backgroundColor: cores.tinta, borderColor: cores.tinta },
});
