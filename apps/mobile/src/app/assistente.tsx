// Assistente do perfil de busca: "Diz o que procura". 5 passos curtos, todos opcionais.
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { ArrowRight, Check, ChevronLeft, Lightbulb } from "lucide-react-native";
import type { PerfilEntrada } from "@/api/api";
import { mensagemDeErro } from "@/api/cliente";
import { useSalvarPerfil } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { BotaoRedondo } from "@/componentes/Cabecalho";
import {
  CampoTermos,
  GrupoAreas,
  GrupoBancas,
  GrupoEscolaridade,
  GrupoSalario,
  GrupoUfs,
  PERFIL_VAZIO,
  resumoPerfil,
  SUGESTOES_CARGOS,
} from "@/componentes/FormularioPerfil";
import { TituloGrifado } from "@/componentes/Grifo";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { useSessao } from "@/contexto/Sessao";
import { primeiroNome } from "@/lib/formato";
import { vibrar } from "@/lib/vibrar";
import { cores } from "@/tema";

type Passo = {
  titulo: string;
  texto: string;
  dica?: string;
  Conteudo: (p: { p: PerfilEntrada; mudar: (d: Partial<PerfilEntrada>) => void }) => React.ReactNode;
};

const PASSOS: Passo[] = [
  {
    titulo: "Qual [escolaridade] o cargo pede?",
    texto: "Marque todos os níveis que servem para você.",
    dica: "Quem tem nível superior também pode fazer concurso de nível médio. Marcando os dois, você vê mais vagas.",
    Conteudo: GrupoEscolaridade,
  },
  {
    titulo: "Que [áreas] te interessam?",
    texto: "Deixe em branco para ver todas.",
    dica: "Dá para mudar tudo depois em Ajustes, e ter mais de um perfil: um para tribunais em SP, outro para o INSS…",
    Conteudo: GrupoAreas,
  },
  {
    titulo: "[Onde] você quer trabalhar?",
    texto: "Escolha os estados. Federais com vaga no país todo entram se você quiser.",
    Conteudo: GrupoUfs,
  },
  {
    titulo: "Salário [mínimo]",
    texto: "Concurso sem salário informado ainda aparece, para você não perder nada.",
    Conteudo: ({ p, mudar }) => (
      <View style={{ gap: 18 }}>
        <GrupoSalario p={p} mudar={mudar} />
        <View style={{ gap: 10 }}>
          <Texto variante="h3">Bancas preferidas (opcional)</Texto>
          <GrupoBancas p={p} mudar={mudar} />
        </View>
      </View>
    ),
  },
  {
    titulo: "Algum [cargo] em mente?",
    texto: "Opcional. A gente procura essas palavras no cargo, no órgão e no resumo do edital.",
    Conteudo: ({ p, mudar }) => (
      <View style={{ gap: 18 }}>
        <CampoTermos
          rotulo="Cargos"
          valores={p.cargos}
          mudar={(cargos) => mudar({ cargos })}
          sugestoes={SUGESTOES_CARGOS}
          placeholder="Ex.: técnico judiciário"
          testID="campo-cargo"
        />
        <CampoTermos
          rotulo="Palavras-chave"
          valores={p.palavras_chave}
          mudar={(palavras_chave) => mudar({ palavras_chave })}
          placeholder="Ex.: PRF, tribunal, prefeitura"
        />
      </View>
    ),
  },
];

export default function Assistente() {
  const { me, pularPerfil } = useSessao();
  const salvar = useSalvarPerfil();
  const toast = useToast();
  const [passo, setPasso] = useState(0);
  const [perfil, setPerfil] = useState<PerfilEntrada>(PERFIL_VAZIO);
  const mudar = (d: Partial<PerfilEntrada>) => setPerfil((p) => ({ ...p, ...d }));
  const ultimo = passo === PASSOS.length - 1;
  const atual = PASSOS[passo];
  const nome = primeiroNome(me?.usuario.nome);

  function concluir() {
    salvar.mutate(
      { perfil },
      {
        onSuccess: () => {
          vibrar.sucesso();
          toast.mostrar("Perfil salvo. A gente avisa quando sair concurso para você.");
        },
        onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
      },
    );
  }

  return (
    <Tela
      topo={
        <View style={s.topo}>
          <View style={s.barraTopo}>
            {passo > 0 ? (
              <BotaoRedondo rotulo="Passo anterior" onPress={() => setPasso(passo - 1)}>
                <ChevronLeft size={24} color={cores.tinta} strokeWidth={2.4} />
              </BotaoRedondo>
            ) : (
              <View style={{ width: 44 }} />
            )}
            <Texto variante="rotulo" cor={cores.tx2}>
              Passo {passo + 1} de {PASSOS.length}
            </Texto>
            <Pressionavel onPress={pularPerfil} style={s.pular} accessibilityLabel="Pular e configurar depois" testID="pular-perfil">
              <Texto variante="corpoForte" cor={cores.azul}>
                Pular
              </Texto>
            </Pressionavel>
          </View>
          <View style={s.progresso} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: PASSOS.length, now: passo + 1 }}>
            {PASSOS.map((_, i) => (
              <Segmento key={i} cheio={i <= passo} />
            ))}
          </View>
        </View>
      }
      rodape={
        <View style={s.rodape}>
          {ultimo ? (
            <Texto variante="pequeno" numberOfLines={2} style={{ textAlign: "center" }}>
              {resumoPerfil(perfil)}
            </Texto>
          ) : null}
          <Botao
            titulo={ultimo ? "Salvar perfil" : "Continuar"}
            iconeDireita={ultimo ? Check : ArrowRight}
            tamanho="g"
            bloco
            carregando={salvar.isPending}
            onPress={() => (ultimo ? concluir() : setPasso(passo + 1))}
            testID="assistente-continuar"
          />
        </View>
      }
    >
      {passo === 0 ? (
        <Texto variante="corpoForte" cor={cores.azul}>
          {nome ? `${nome}, diz o que você procura.` : "Diz o que você procura."}
        </Texto>
      ) : null}
      <Animated.View key={passo} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <TituloGrifado texto={atual.titulo} />
          <Texto variante="corpo" cor={cores.tx2}>
            {atual.texto}
          </Texto>
        </View>
        <atual.Conteudo p={perfil} mudar={mudar} />
        {atual.dica ? (
          <View style={s.dica}>
            <Lightbulb size={18} color={cores.ambar} strokeWidth={2.4} style={{ marginTop: 1 }} />
            <Texto variante="corpo" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>
              {atual.dica}
            </Texto>
          </View>
        ) : null}
      </Animated.View>
    </Tela>
  );
}

function Segmento({ cheio }: { cheio: boolean }) {
  const estilo = useAnimatedStyle(() => ({
    backgroundColor: cheio ? cores.azul : cores.linha,
    transform: [{ scaleY: withSpring(cheio ? 1 : 0.8) }],
  }));
  return <Animated.View style={[s.segmento, estilo]} />;
}

const s = StyleSheet.create({
  topo: { paddingHorizontal: 16, gap: 10, paddingBottom: 6 },
  barraTopo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pular: { minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center" },
  progresso: { flexDirection: "row", gap: 4 },
  segmento: { flex: 1, height: 6, borderRadius: 3 },
  dica: { flexDirection: "row", gap: 10, backgroundColor: cores.marcaT, borderRadius: 16, padding: 14, marginTop: 8 },
  rodape: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    backgroundColor: cores.papel,
  },
});
