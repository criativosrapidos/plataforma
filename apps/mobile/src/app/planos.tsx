// Paywall: sem plano grátis. Teste de 3 dias com o plano escolhido, cobrança só no 4º dia.
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, CreditCard, QrCode, Sparkles } from "lucide-react-native";
import { brl, PLANO_INFO, TRIAL_DAYS, type Ciclo, type Plano } from "@aviso/shared";
import { api } from "@/api/api";
import { mensagemDeErro } from "@/api/cliente";
import { chaves, useAssinatura } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { Segmentado } from "@/componentes/Controles";
import { Etiqueta } from "@/componentes/Etiqueta";
import { TituloGrifado } from "@/componentes/Grifo";
import { Marca } from "@/componentes/Logo";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { useSessao } from "@/contexto/Sessao";
import { LINKS } from "@/lib/config";
import { abrirLink } from "@/lib/links";
import { vibrar } from "@/lib/vibrar";
import { cores, fontes } from "@/tema";

const MOTIVOS: Record<string, string> = {
  teste_acabou: "Seu teste grátis acabou. Escolha um plano para continuar recebendo os avisos.",
  cancelada: "Sua assinatura foi cancelada. Volte quando quiser: seus concursos continuam salvos.",
  pagamento_pendente: "Não conseguimos fazer a última cobrança. Escolha a forma de pagamento para continuar.",
};

export default function Planos() {
  const { me, sair, concluirCadastro } = useSessao();
  const assinatura = useAssinatura();
  const qc = useQueryClient();
  const toast = useToast();
  const [plano, setPlano] = useState<Plano>("aviso");
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  const [metodo, setMetodo] = useState<"pix_automatico" | "cartao">("pix_automatico");
  const podeTestar = assinatura.data?.podeTestar ?? !me?.assinatura;
  const motivo = me?.acesso.motivoBloqueio ? MOTIVOS[me.acesso.motivoBloqueio] : null;
  const info = PLANO_INFO[plano];
  const preco = ciclo === "anual" ? info.precoAnualCentavos : info.precoMensalCentavos;
  const precoTexto = `${brl(preco)}${ciclo === "anual" ? " por ano" : " por mês"}`;

  const checkout = useMutation({
    mutationFn: () => api.checkout({ plano, ciclo, metodo }),
    onSuccess: async (r) => {
      vibrar.sucesso();
      concluirCadastro();
      if (r.checkout_url) await abrirLink(r.checkout_url);
      toast.mostrar(podeTestar ? `Teste começou. Aproveite os ${TRIAL_DAYS} dias.` : "Assinatura ativa. Bem-vindo de volta.");
      await qc.invalidateQueries({ queryKey: chaves.me });
    },
    onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
  });

  return (
    <Tela
      rodape={
        <View style={s.rodape}>
          <Botao
            titulo={podeTestar ? `Começar ${TRIAL_DAYS} dias grátis` : `Assinar por ${brl(preco)}`}
            variante="marca"
            tamanho="g"
            bloco
            icone={Sparkles}
            carregando={checkout.isPending}
            onPress={() => checkout.mutate()}
            testID="comecar-teste"
          />
          <Texto variante="pequeno" centro>
            {podeTestar
              ? `Hoje: R$ 0,00. Cobrança de ${precoTexto} só no 4º dia. Cancele quando quiser.`
              : `${precoTexto}. Cancele quando quiser, sem multa.`}
          </Texto>
        </View>
      }
    >
      <View style={s.topo}>
        <Marca tamanho={22} />
        <Pressionavel onPress={() => void sair()} style={s.sair} accessibilityLabel="Sair da conta" testID="planos-sair">
          <Texto variante="corpoForte" cor={cores.tx2} style={{ fontSize: 14 }}>
            Sair
          </Texto>
        </Pressionavel>
      </View>

      <View style={{ gap: 8 }}>
        <TituloGrifado texto={podeTestar ? "Teste [3 dias grátis]" : "Escolha seu [plano]"} style={{ fontSize: 40, lineHeight: 41 }} />
        <Texto variante="corpo" cor={cores.tx2}>
          Sem plano grátis: todo mundo testa o plano completo e decide se continua.
        </Texto>
      </View>

      {motivo ? (
        <View style={s.motivo}>
          <Texto variante="corpoForte" style={{ fontSize: 14 }}>
            {motivo}
          </Texto>
        </View>
      ) : null}

      <Segmentado
        opcoes={[
          { valor: "mensal", rotulo: "Mensal" },
          { valor: "anual", rotulo: "Anual · 2 meses grátis" },
        ]}
        valor={ciclo}
        aoMudar={setCiclo}
      />

      {(["aviso", "aprovado"] as const).map((id, i) => (
        <Animated.View
          key={id}
          entering={FadeInDown.delay(60 * i)
            .springify()
            .damping(18)}
        >
          <CartaoPlano id={id} ciclo={ciclo} selecionado={plano === id} aoEscolher={() => setPlano(id)} />
        </Animated.View>
      ))}

      <View style={{ gap: 10 }}>
        <Texto variante="h3">Forma de pagamento</Texto>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <OpcaoMetodo
            icone={QrCode}
            rotulo="Pix automático"
            ativo={metodo === "pix_automatico"}
            onPress={() => setMetodo("pix_automatico")}
          />
          <OpcaoMetodo icone={CreditCard} rotulo="Cartão" ativo={metodo === "cartao"} onPress={() => setMetodo("cartao")} />
        </View>
      </View>

      {podeTestar ? (
        <View
          style={s.linhaTempo}
          accessible
          accessibilityLabel={`Como funciona o teste: hoje você usa tudo sem pagar. No dia 3 avisamos que a cobrança é amanhã. No dia 4, primeira cobrança de ${precoTexto}. Cancele quando quiser.`}
        >
          <Texto variante="h3">Como funciona o teste</Texto>
          <Marco cor={cores.verde} dia="HOJE" texto="Você usa tudo, sem pagar nada." />
          <Marco cor={cores.marca} dia="DIA 3" texto="A gente avisa: a cobrança é amanhã." icone />
          <Marco cor={cores.azul} dia="DIA 4" texto={`Primeira cobrança: ${precoTexto}.`} ultimo />
          <Texto variante="meta">Cancele quando quiser, sem multa e sem ligar para ninguém.</Texto>
        </View>
      ) : (
        <Texto variante="meta">Você já usou o teste grátis nesta conta.</Texto>
      )}

      <View style={s.links}>
        <Pressionavel onPress={() => void abrirLink(LINKS.termos)} accessibilityRole="link" style={s.link}>
          <Texto variante="pequeno" cor={cores.azul}>
            Termos de uso
          </Texto>
        </Pressionavel>
        <Texto variante="pequeno">·</Texto>
        <Pressionavel onPress={() => void abrirLink(LINKS.privacidade)} accessibilityRole="link" style={s.link}>
          <Texto variante="pequeno" cor={cores.azul}>
            Privacidade
          </Texto>
        </Pressionavel>
      </View>
    </Tela>
  );
}

function CartaoPlano({ id, ciclo, selecionado, aoEscolher }: { id: Plano; ciclo: Ciclo; selecionado: boolean; aoEscolher: () => void }) {
  const p = PLANO_INFO[id];
  const preco = ciclo === "anual" ? p.precoAnualCentavos : p.precoMensalCentavos;
  return (
    <Pressionavel
      onPress={aoEscolher}
      haptico="selecao"
      escala={0.985}
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionado }}
      accessibilityLabel={`Plano ${p.nome}, ${brl(preco)} por ${ciclo === "anual" ? "ano" : "mês"}`}
      style={[s.plano, selecionado && s.planoAtivo]}
      testID={`plano-${id}`}
    >
      <View style={s.planoTopo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Texto variante="tituloMedio">{p.nome}</Texto>
          <Etiqueta texto={p.destaque} tom={id === "aprovado" ? "marca" : "info"} />
        </View>
        <View style={[s.radio, selecionado && s.radioAtivo]}>{selecionado ? <View style={s.radioPonto} /> : null}</View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Texto style={s.preco} maxFontSizeMultiplier={1.2}>
          {brl(preco)}
        </Texto>
        <Texto variante="meta">{ciclo === "anual" ? "/ano" : "/mês"}</Texto>
      </View>
      {ciclo === "anual" ? (
        <Texto variante="pequeno" cor={cores.verdeTexto}>
          Equivale a {brl(Math.round(preco / 12))} por mês
        </Texto>
      ) : null}
      <View style={{ gap: 7, marginTop: 4 }}>
        {p.inclui.map((item) => (
          <View key={item} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Check size={16} color={cores.verdeTexto} strokeWidth={3} style={{ marginTop: 2 }} />
            <Texto variante="corpo" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
              {item}
            </Texto>
          </View>
        ))}
      </View>
    </Pressionavel>
  );
}

function OpcaoMetodo({
  icone: Icone,
  rotulo,
  ativo,
  onPress,
}: {
  icone: typeof QrCode;
  rotulo: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressionavel
      onPress={onPress}
      haptico="selecao"
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      accessibilityLabel={rotulo}
      style={[s.metodo, ativo && s.metodoAtivo]}
    >
      <Icone size={20} color={ativo ? cores.azul : cores.tx2} strokeWidth={2.3} />
      <Texto variante="corpoForte" style={{ fontSize: 14 }} cor={ativo ? cores.tinta : cores.tx2}>
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

function Marco({ cor, dia, texto, icone, ultimo }: { cor: string; dia: string; texto: string; icone?: boolean; ultimo?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ alignItems: "center", width: 22 }}>
        <View style={[s.marcoPonto, { backgroundColor: cor }]}>
          {icone ? <BellRing size={11} color={cores.tinta} strokeWidth={3} /> : null}
        </View>
        {!ultimo ? <View style={s.marcoLinha} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: ultimo ? 0 : 12, gap: 1 }}>
        <Texto variante="rotulo" cor={cores.tx2}>
          {dia}
        </Texto>
        <Texto variante="corpoForte" style={{ fontSize: 14.5 }}>
          {texto}
        </Texto>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sair: { minHeight: 44, justifyContent: "center", paddingHorizontal: 6 },
  motivo: { backgroundColor: cores.marcaT, borderRadius: 16, padding: 14 },
  plano: { backgroundColor: cores.branco, borderRadius: 22, borderWidth: 2, borderColor: cores.linha, padding: 16, gap: 6 },
  planoAtivo: { borderColor: cores.azul, backgroundColor: "#FBFCFF" },
  planoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: cores.linhaForte,
    alignItems: "center",
    justifyContent: "center",
  },
  radioAtivo: { borderColor: cores.azul },
  radioPonto: { width: 12, height: 12, borderRadius: 6, backgroundColor: cores.azul },
  preco: { fontFamily: fontes.display, fontSize: 38, lineHeight: 40, color: cores.tinta },
  metodo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
  },
  metodoAtivo: { borderColor: cores.azul },
  linhaTempo: { backgroundColor: cores.branco, borderRadius: 20, borderWidth: 1, borderColor: cores.linha, padding: 16, gap: 10 },
  marcoPonto: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  marcoLinha: { flex: 1, width: 2, backgroundColor: cores.linha, marginTop: 2 },
  links: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  link: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  rodape: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    backgroundColor: cores.papel,
  },
});
