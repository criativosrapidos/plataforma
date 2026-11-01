// Perfis de busca: listar, pausar, editar, apagar e criar.
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Pencil, Plus, SlidersHorizontal } from "lucide-react-native";
import { mensagemDeErro } from "@/api/cliente";
import { usePerfis, useSalvarPerfil } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { BarraVoltar } from "@/componentes/Cabecalho";
import { Card } from "@/componentes/Card";
import { Interruptor } from "@/componentes/Controles";
import { EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro, EstadoVazio } from "@/componentes/EstadoVazio";
import { resumoPerfil } from "@/componentes/FormularioPerfil";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { cores } from "@/tema";

export default function Perfis() {
  const q = usePerfis();
  const salvar = useSalvarPerfil();
  const toast = useToast();

  return (
    <Tela
      topo={
        <View style={{ paddingHorizontal: 16 }}>
          <BarraVoltar />
        </View>
      }
      aoAtualizar={() => q.refetch()}
      rodape={
        <View style={s.rodape}>
          <Botao
            titulo="Novo perfil de busca"
            icone={Plus}
            tamanho="g"
            bloco
            onPress={() => router.push("/perfis/novo")}
            testID="novo-perfil"
          />
        </View>
      }
    >
      <View style={{ gap: 4 }}>
        <Texto variante="meta" style={{ fontSize: 14 }}>
          Sem limite de perfis
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          Perfis de busca
        </Texto>
      </View>
      <Texto variante="corpo" cor={cores.tx2}>
        Cada perfil é uma busca: saiu concurso que casa com algum deles, você recebe o aviso. Pause o que não quiser agora.
      </Texto>
      {q.isPending ? (
        <EsqueletoLista quantos={2} />
      ) : q.isError ? (
        <EstadoErro mensagem={mensagemDeErro(q.error)} aoTentar={() => void q.refetch()} />
      ) : q.data.length ? (
        q.data.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(40 * i).duration(240)} layout={LinearTransition}>
            <Card style={[{ gap: 6 }, !p.ativo && { opacity: 0.75 }]}>
              <View style={s.linha}>
                <Pressionavel
                  onPress={() => router.push(`/perfis/${p.id}`)}
                  style={{ flex: 1, gap: 4 }}
                  accessibilityLabel={`Editar ${p.nome}`}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Texto variante="h3">{p.nome}</Texto>
                    <Pencil size={14} color={cores.tx2} />
                  </View>
                  <Texto variante="meta">{resumoPerfil(p)}</Texto>
                </Pressionavel>
                <Interruptor
                  ligado={p.ativo}
                  rotulo={p.ativo ? `Pausar ${p.nome}` : `Ativar ${p.nome}`}
                  aoMudar={(ativo) => {
                    const { id, ...resto } = p;
                    salvar.mutate(
                      { id, perfil: { ...resto, ativo } },
                      {
                        onSuccess: () =>
                          toast.mostrar(ativo ? "Perfil ativado." : "Perfil pausado. Sem avisos dele até você ligar de novo.", "info"),
                        onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
                      },
                    );
                  }}
                />
              </View>
              {!p.ativo ? (
                <Texto variante="rotulo" cor={cores.tx2} style={{ fontSize: 10 }}>
                  Pausado
                </Texto>
              ) : null}
            </Card>
          </Animated.View>
        ))
      ) : (
        <EstadoVazio
          icone={SlidersHorizontal}
          titulo="Nenhum perfil ainda"
          texto="Diga escolaridade, área, estados e salário para receber os concursos certos."
        />
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", gap: 12 },
  rodape: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    backgroundColor: cores.papel,
  },
});
