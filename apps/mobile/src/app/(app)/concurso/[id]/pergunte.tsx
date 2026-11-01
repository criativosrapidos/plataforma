// Pergunte ao edital (plano Aprovado): responde só com base no edital, citando item e página. 30 por mês.
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View, type ScrollViewInstance } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ArrowUp, BookOpenText, Crown, SearchX } from "lucide-react-native";
import { temRecurso, type PerguntaDTO } from "@aviso/shared";
import { ErroApi, mensagemDeErro } from "@/api/cliente";
import { useConcurso, usePerguntar, usePerguntas } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { BarraVoltar } from "@/componentes/Cabecalho";
import { Chip } from "@/componentes/Chip";
import { Esqueleto } from "@/componentes/Esqueleto";
import { SeloAprovado } from "@/componentes/Etiqueta";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { useSessao } from "@/contexto/Sessao";
import { useUpsell } from "@/contexto/Upsell";
import { quando } from "@/lib/formato";
import { vibrar } from "@/lib/vibrar";
import { cores, fontes } from "@/tema";

const SUGESTOES = [
  "Quem tem direito à isenção?",
  "Qual o salário?",
  "Quais documentos levar na prova?",
  "Como são as provas?",
  "Posso levar garrafa de água?",
];

export default function Pergunte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useSessao();
  const { abrirUpsell } = useUpsell();
  const toast = useToast();
  const concurso = useConcurso(id);
  const liberado = !!me && temRecurso(me.acesso, "pergunte_edital");
  const historico = usePerguntas(id, liberado);
  const perguntar = usePerguntar(id);
  const [texto, setTexto] = useState("");
  const [pendente, setPendente] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const rolagem = useRef<ScrollViewInstance>(null);

  const limite = me?.uso.limites.perguntasMes ?? 30;
  const restantes = Math.max(0, limite - (me?.uso.perguntasMes ?? 0));
  const esgotou = liberado && restantes <= 0;
  const mensagens = historico.data ?? [];
  const nome = concurso.data ? (concurso.data.orgao_sigla ?? concurso.data.orgao) : "";

  useEffect(() => {
    const t = setTimeout(() => rolagem.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [mensagens.length, pendente]);

  function enviar(p?: string) {
    const t = (p ?? texto).trim();
    if (t.length < 3 || perguntar.isPending || esgotou) return;
    setAviso(null);
    setPendente(t);
    setTexto("");
    vibrar.toque();
    perguntar.mutate(t, {
      onSuccess: () => vibrar.sucesso(),
      onError: (e) => {
        if (e instanceof ErroApi && e.limiteMes) setAviso(e.message);
        else if (e instanceof ErroApi && e.soAprovado) abrirUpsell("Pergunte ao edital é do plano Aprovado.");
        else if (e instanceof ErroApi && e.codigo === "sem_edital") setAviso(e.message);
        else {
          setTexto(t);
          toast.mostrar(mensagemDeErro(e), "erro");
        }
      },
      onSettled: () => setPendente(null),
    });
  }

  if (!liberado) {
    return (
      <Tela
        topo={
          <View style={{ paddingHorizontal: 16 }}>
            <BarraVoltar />
          </View>
        }
      >
        <Topo nome={nome} />
        <View style={s.bloqueio}>
          <View style={s.selo}>
            <Crown size={26} color={cores.tinta} strokeWidth={2.2} />
          </View>
          <Texto variante="h2" centro>
            Recurso do plano Aprovado
          </Texto>
          <Texto variante="corpo" centro cor={cores.tx2}>
            Pergunte o que quiser sobre o edital: isenção, requisitos, documentos, provas. A resposta vem só do texto oficial, com item e
            página.
          </Texto>
          <Botao
            titulo="Conhecer o Aprovado"
            variante="marca"
            icone={Crown}
            onPress={() => abrirUpsell("Pergunte ao edital: até 30 perguntas por mês, sempre com item e página.")}
            style={{ alignSelf: "center" }}
          />
        </View>
      </Tela>
    );
  }

  const podeEnviar = texto.trim().length >= 3 && !perguntar.isPending && !esgotou;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Tela
        refRolagem={rolagem}
        topo={
          <View style={{ paddingHorizontal: 16 }}>
            <BarraVoltar />
          </View>
        }
        rodape={
          <View style={s.barraEnvio}>
            {esgotou ? (
              <Texto variante="corpoForte" centro cor={cores.tx2} style={{ flex: 1, fontSize: 14, paddingVertical: 10 }}>
                Você usou as {limite} perguntas deste mês. Renova no dia 1º.
              </Texto>
            ) : (
              <>
                <TextInput
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Pergunte sobre o edital"
                  placeholderTextColor={cores.tx3}
                  multiline
                  numberOfLines={Platform.OS === "web" ? 1 : undefined}
                  maxLength={500}
                  style={[s.entrada, Platform.OS === "web" && ({ outlineStyle: "none" } as object)]}
                  accessibilityLabel="Sua pergunta sobre o edital"
                  onSubmitEditing={() => enviar()}
                  submitBehavior="submit"
                  returnKeyType="send"
                  testID="campo-pergunta"
                />
                <Pressionavel
                  onPress={() => enviar()}
                  disabled={!podeEnviar}
                  accessibilityLabel="Enviar pergunta"
                  escala={0.9}
                  style={[s.enviar, !podeEnviar && { backgroundColor: cores.linhaForte }]}
                  testID="enviar-pergunta"
                >
                  <ArrowUp size={22} color={cores.branco} strokeWidth={2.8} />
                </Pressionavel>
              </>
            )}
          </View>
        }
      >
        <Topo nome={nome} />
        <View style={s.contador} accessibilityLabel={`${restantes} de ${limite} perguntas restantes este mês`}>
          <Texto variante="monoForte" style={{ fontSize: 12 }} cor={restantes <= 5 ? cores.vermTexto : cores.tinta}>
            {restantes} de {limite}
          </Texto>
          <Texto variante="pequeno">perguntas restantes este mês</Texto>
        </View>

        <View style={s.explica}>
          <BookOpenText size={18} color={cores.azul} strokeWidth={2.3} />
          <Texto variante="meta" style={{ flex: 1, color: cores.tinta }}>
            Respondo só com o que está no edital, sempre com item e página. Se não estiver lá, eu aviso. Confira no documento oficial.
          </Texto>
        </View>

        {historico.isPending ? (
          <View style={{ gap: 10 }}>
            <Esqueleto largura="60%" altura={40} arredondado={16} style={{ alignSelf: "flex-end" }} />
            <Esqueleto largura="80%" altura={70} arredondado={16} />
          </View>
        ) : (
          mensagens.map((m) => <Conversa key={m.id} m={m} />)
        )}

        {pendente ? (
          <>
            <Animated.View entering={FadeInUp.duration(200)} style={[s.msg, s.eu]}>
              <Texto variante="corpo" cor={cores.branco} style={s.msgTexto}>
                {pendente}
              </Texto>
            </Animated.View>
            <Digitando />
          </>
        ) : null}

        {aviso ? (
          <View style={s.aviso} accessibilityLiveRegion="polite">
            <Texto variante="corpoForte" style={{ fontSize: 14 }}>
              {aviso}
            </Texto>
          </View>
        ) : null}

        {!esgotou && !pendente ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            {!mensagens.length ? <Texto variante="pequeno">Experimente perguntar:</Texto> : null}
            <View style={s.sugestoes}>
              {SUGESTOES.filter((sg) => !mensagens.some((m) => m.pergunta === sg))
                .slice(0, 4)
                .map((sg) => (
                  <Chip key={sg} rotulo={sg} onPress={() => enviar(sg)} testID={`sugestao-${SUGESTOES.indexOf(sg)}`} />
                ))}
            </View>
          </View>
        ) : null}
      </Tela>
    </KeyboardAvoidingView>
  );
}

function Topo({ nome }: { nome: string }) {
  return (
    <View style={{ gap: 4 }}>
      {nome ? (
        <Texto variante="meta" style={{ fontSize: 14 }}>
          {nome} · edital
        </Texto>
      ) : null}
      <Texto variante="titulo" accessibilityRole="header">
        Pergunte ao edital
      </Texto>
      <SeloAprovado style={{ alignSelf: "flex-start" }} />
    </View>
  );
}

function Conversa({ m }: { m: PerguntaDTO }) {
  return (
    <View style={{ gap: 8 }}>
      <Animated.View entering={FadeInDown.duration(220)} style={[s.msg, s.eu]}>
        <Texto variante="corpo" cor={cores.branco} style={s.msgTexto}>
          {m.pergunta}
        </Texto>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).duration(260)} style={[s.msg, s.ia, !m.encontrado && s.naoAchou]}>
        {!m.encontrado ? (
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <SearchX size={16} color={cores.tx2} strokeWidth={2.4} />
            <Texto variante="rotulo" cor={cores.tx2} style={{ fontSize: 10 }}>
              Não está no edital
            </Texto>
          </View>
        ) : null}
        <Texto variante="corpo" style={s.msgTexto}>
          {m.resposta}
        </Texto>
        {m.citacoes.map((ct, i) => (
          <View key={i} style={s.citacao}>
            <Texto variante="mono" cor={cores.tx2} style={{ fontSize: 11 }}>
              Fonte: {[ct.item ? `item ${ct.item}` : null, ct.pagina ? `página ${ct.pagina}` : null].filter(Boolean).join(", ") || "edital"}
            </Texto>
          </View>
        ))}
        <Texto variante="mono" cor={cores.tx3} style={{ fontSize: 10.5 }}>
          {quando(m.created_at)}
        </Texto>
      </Animated.View>
    </View>
  );
}

function Digitando() {
  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={[s.msg, s.ia, { flexDirection: "row", gap: 5, paddingVertical: 14 }]}
      accessibilityLabel="Procurando no edital"
    >
      {[0, 1, 2].map((i) => (
        <Ponto key={i} atraso={i * 140} />
      ))}
      <Texto variante="pequeno" style={{ marginLeft: 6 }}>
        Procurando no edital
      </Texto>
    </Animated.View>
  );
}

function Ponto({ atraso }: { atraso: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withDelay(atraso, withRepeat(withSequence(withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 })), -1)));
  }, [atraso, y]);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[s.ponto, estilo]} />;
}

const s = StyleSheet.create({
  bloqueio: {
    alignItems: "center",
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 22,
  },
  selo: { width: 60, height: 60, borderRadius: 30, backgroundColor: cores.marca, alignItems: "center", justifyContent: "center" },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: cores.branco,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  explica: { flexDirection: "row", gap: 10, backgroundColor: cores.azulT, borderRadius: 16, padding: 12, alignItems: "flex-start" },
  msg: { maxWidth: "86%", borderRadius: 18, paddingVertical: 10, paddingHorizontal: 13, gap: 6 },
  eu: { backgroundColor: cores.azul, alignSelf: "flex-end", borderBottomRightRadius: 5 },
  ia: { backgroundColor: cores.branco, alignSelf: "flex-start", borderWidth: 1, borderColor: cores.linha, borderBottomLeftRadius: 5 },
  naoAchou: { borderStyle: "dashed", borderColor: cores.linhaForte },
  msgTexto: { fontSize: 14.5, lineHeight: 21 },
  citacao: { borderTopWidth: 1, borderTopColor: cores.linha, paddingTop: 6 },
  aviso: { backgroundColor: cores.marcaT, borderRadius: 14, padding: 12 },
  sugestoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  barraEnvio: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    backgroundColor: cores.papel,
  },
  entrada: {
    flex: 1,
    minHeight: 48,
    maxHeight: 130,
    backgroundColor: cores.branco,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: cores.linha,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontFamily: fontes.medio,
    fontSize: 16,
    color: cores.tinta,
  },
  enviar: { width: 48, height: 48, borderRadius: 24, backgroundColor: cores.azul, alignItems: "center", justifyContent: "center" },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: cores.azul },
});
