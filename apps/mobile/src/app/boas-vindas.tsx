// Boas-vindas: 3 telas curtas no tom do briefing e o convite para testar 3 dias.
import { useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance } from "react-native";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";
import { Botao } from "@/componentes/Botao";
import { TituloGrifado } from "@/componentes/Grifo";
import { Marca, Simbolo } from "@/componentes/Logo";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Texto } from "@/componentes/Texto";
import { cores, fontes, LARGURA_MAX, sombra, sombraForte } from "@/tema";

const SLIDES = [
  {
    titulo: "Você estuda. O Aviso Concurso [vigia e organiza.]",
    texto: "Todo dia a gente lê os diários oficiais e os sites das bancas. Saiu concurso do seu perfil, você fica sabendo.",
    Visual: VisualAviso,
  },
  {
    titulo: "Edital saiu. Você [sabe primeiro.]",
    texto: "Notificação no celular com vagas, salário, prazos e o link oficial. Isenção acabando e errata também.",
    Visual: VisualContagem,
  },
  {
    titulo: "Todos os concursos numa [agenda só.]",
    texto: "Isenção, inscrição, boleto e prova de cada concurso, cada um com sua cor. E as matérias que caem em mais de um.",
    Visual: VisualAgenda,
  },
];

export default function BoasVindas() {
  const insets = useSafeAreaInsets();
  const [largura, setLargura] = useState(0);
  const [pagina, setPagina] = useState(0);
  const x = useSharedValue(0);
  const ref = useRef<ScrollViewInstance>(null);
  const aoRolar = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  const ultima = pagina === SLIDES.length - 1;
  const avancar = () => {
    if (ultima) {
      router.push("/cadastro");
      return;
    }
    const prox = pagina + 1;
    ref.current?.scrollTo({ x: prox * largura, animated: true });
    setPagina(prox);
  };
  const aoParar = (offset: number) => setPagina(Math.round(offset / Math.max(largura, 1)));

  return (
    <View style={[s.raiz, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={s.topo}>
        <Marca tamanho={24} />
        <Pressionavel onPress={() => router.push("/entrar")} style={s.entrar} accessibilityLabel="Entrar na minha conta" testID="ir-entrar">
          <Texto variante="corpoForte" cor={cores.azul}>
            Entrar
          </Texto>
        </Pressionavel>
      </View>

      <View style={{ flex: 1 }} onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
        {largura > 0 ? (
          <Animated.ScrollView
            ref={ref as never}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={aoRolar}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => aoParar(e.nativeEvent.contentOffset.x)}
            style={{ flex: 1 }}
          >
            {SLIDES.map((sl, i) => (
              <View key={i} style={[s.slide, { width: largura }]} accessibilityLabel={`Tela ${i + 1} de ${SLIDES.length}`}>
                <View style={s.visual}>
                  <sl.Visual />
                </View>
                <View style={s.textos}>
                  <TituloGrifado texto={sl.titulo} style={s.titulo} />
                  <Texto variante="corpo" cor={cores.tx2} style={{ fontSize: 16, lineHeight: 23 }}>
                    {sl.texto}
                  </Texto>
                </View>
              </View>
            ))}
          </Animated.ScrollView>
        ) : null}
      </View>

      <View style={s.rodape}>
        <View style={s.pontos} accessibilityLabel={`Página ${pagina + 1} de ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <Ponto key={i} i={i} x={x} largura={largura} />
          ))}
        </View>
        <Botao
          titulo={ultima ? "Testar 3 dias grátis" : "Continuar"}
          iconeDireita={ArrowRight}
          tamanho="g"
          bloco
          onPress={avancar}
          testID="boas-vindas-continuar"
        />
        <Botao titulo="Já tenho conta" variante="secundario" tamanho="g" bloco onPress={() => router.push("/entrar")} />
        <Texto variante="rotulo" cor={cores.tx2} centro style={{ fontSize: 10, marginTop: 2 }}>
          3 dias grátis · depois R$ 9,90/mês · cancele quando quiser
        </Texto>
      </View>
    </View>
  );
}

function Ponto({ i, x, largura }: { i: number; x: SharedValue<number>; largura: number }) {
  const estilo = useAnimatedStyle(() => {
    const p = largura ? x.value / largura : 0;
    const w = interpolate(Math.abs(p - i), [0, 1], [24, 8], "clamp");
    const o = interpolate(Math.abs(p - i), [0, 1], [1, 0.3], "clamp");
    return { width: w, opacity: o };
  });
  return <Animated.View style={[s.ponto, estilo]} />;
}

// ---------- Ilustrações feitas com componentes (sem imagem) ----------

function VisualAviso() {
  return (
    <View style={{ width: "100%", maxWidth: 340, alignSelf: "center", height: 230 }}>
      <Animated.View entering={FadeInDown.delay(150).springify()} style={[s.camada, { top: 6, left: 18, right: 0 }]}>
        <View style={[s.notif, sombra, { transform: [{ rotate: "-3deg" }], opacity: 0.9 }]}>
          <NotifConteudo titulo="Errata no TRF 3" texto="A data da prova mudou." />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(40).springify()} style={[s.camada, { top: 92, left: 0, right: 12 }]}>
        <View style={[s.notif, sombraForte]}>
          <NotifConteudo titulo="Edital publicado: TJ BA" texto="120 vagas · até R$ 8.900,00 · inscrições até 26/11" />
        </View>
      </Animated.View>
    </View>
  );
}

function NotifConteudo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={s.notifIcone}>
        <Simbolo tamanho={26} borda={cores.azul} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Texto variante="rotulo" cor={cores.tx2} style={{ fontSize: 9.5 }}>
            Aviso Concurso
          </Texto>
          <Texto variante="rotulo" cor={cores.tx2} style={{ fontSize: 9.5 }}>
            agora
          </Texto>
        </View>
        <Texto variante="h3" style={{ fontSize: 14 }}>
          {titulo}
        </Texto>
        <Texto variante="meta" style={{ fontSize: 12.5 }}>
          {texto}
        </Texto>
      </View>
    </View>
  );
}

function VisualContagem() {
  return (
    <Animated.View entering={FadeInDown.springify()} style={{ width: "100%", maxWidth: 340, alignSelf: "center" }}>
      <View style={[s.hero, sombraForte]}>
        <Texto variante="rotulo" cor={cores.azulSuave}>
          Próxima prova
        </Texto>
        <Texto variante="display" cor={cores.branco} style={{ fontSize: 50, lineHeight: 50 }}>
          Faltam{" "}
          <Texto variante="display" cor={cores.marca} style={{ fontSize: 50, lineHeight: 50 }}>
            21 dias
          </Texto>
        </Texto>
        <Texto variante="corpo" cor={cores.azulTextoClaro} style={{ fontSize: 14 }}>
          TRF 3 · Técnico Judiciário · 22/11
        </Texto>
      </View>
    </Animated.View>
  );
}

function VisualAgenda() {
  const dias = [
    { l: "S", n: 3, c: [] as string[] },
    { l: "T", n: 4, c: ["#7A3FD1"] },
    { l: "Q", n: 5, c: [] },
    { l: "Q", n: 6, c: ["#1F3FD1", "#0B7F86"] },
    { l: "S", n: 7, c: [] },
    { l: "S", n: 8, c: [] },
    { l: "D", n: 9, c: ["#1F3FD1"] },
  ];
  return (
    <Animated.View entering={FadeInDown.springify()} style={{ width: "100%", maxWidth: 340, alignSelf: "center", gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {dias.map((d, i) => (
          <View key={i} style={[s.dia, i === 3 && { backgroundColor: cores.tinta, borderColor: cores.tinta }]}>
            <Texto style={{ fontFamily: fontes.medio, fontSize: 10, color: i === 3 ? cores.azulSuave : cores.tx2 }}>{d.l}</Texto>
            <Texto style={{ fontFamily: fontes.monoNegrito, fontSize: 14, color: i === 3 ? cores.branco : cores.tinta }}>{d.n}</Texto>
            <View style={{ flexDirection: "row", gap: 2, height: 5 }}>
              {d.c.map((c) => (
                <View key={c} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }} />
              ))}
            </View>
          </View>
        ))}
      </View>
      {[
        { cor: "#7A3FD1", d: "04", t: "Isenção · INSS", m: "acaba amanhã" },
        { cor: "#1F3FD1", d: "06", t: "Inscrição · TRF 3", m: "faltam 3 dias" },
        { cor: "#0B7F86", d: "06", t: "Boleto · TJ BA", m: "faltam 3 dias" },
      ].map((e) => (
        <View key={e.t} style={[s.ev, sombra, { borderLeftColor: e.cor }]}>
          <View style={{ width: 40, alignItems: "center" }}>
            <Texto style={{ fontFamily: fontes.monoNegrito, fontSize: 18, lineHeight: 22 }}>{e.d}</Texto>
            <Texto style={{ fontFamily: fontes.monoNegrito, fontSize: 10, color: cores.tx2 }}>NOV</Texto>
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="h3" style={{ fontSize: 14 }}>
              {e.t}
            </Texto>
            <Texto variante="monoForte" cor={cores.vermTexto} style={{ fontSize: 11 }}>
              {e.m}
            </Texto>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.papel },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 48,
    width: "100%",
    maxWidth: LARGURA_MAX,
    alignSelf: "center",
  },
  entrar: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  slide: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 26 },
  visual: { minHeight: 230, justifyContent: "center" },
  textos: { gap: 12 },
  titulo: { fontSize: 42, lineHeight: 42 },
  rodape: { paddingHorizontal: 20, gap: 10, paddingTop: 8, width: "100%", maxWidth: LARGURA_MAX, alignSelf: "center" },
  pontos: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 6 },
  ponto: { height: 8, borderRadius: 4, backgroundColor: cores.azul },
  camada: { position: "absolute" },
  notif: { backgroundColor: "rgba(255,255,255,0.98)", borderRadius: 22, padding: 14, borderWidth: 1, borderColor: cores.linha },
  notifIcone: { width: 38, height: 38, borderRadius: 11, backgroundColor: cores.azul, alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: cores.azul, borderRadius: 26, padding: 20, gap: 8, transform: [{ rotate: "-2deg" }] },
  dia: {
    flex: 1,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: "center",
    gap: 2,
  },
  ev: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: cores.branco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.linha,
    borderLeftWidth: 6,
    padding: 10,
  },
});
