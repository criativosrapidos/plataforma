// Caixa de avisos (tudo que saiu por push também fica aqui).
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CheckCheck, Inbox } from "lucide-react-native";
import { mensagemDeErro } from "@/api/cliente";
import { useAvisos, useMarcarLidos } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { BarraVoltar } from "@/componentes/Cabecalho";
import { CartaoAviso } from "@/componentes/CartaoAviso";
import { EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro, EstadoVazio } from "@/componentes/EstadoVazio";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { vibrar } from "@/lib/vibrar";
import { cores } from "@/tema";

export default function Avisos() {
  const q = useAvisos();
  const marcar = useMarcarLidos();
  const toast = useToast();
  const naoLidos = (q.data ?? []).filter((a) => !a.lido).length;

  return (
    <Tela
      topo={
        <View style={{ paddingHorizontal: 16 }}>
          <BarraVoltar />
        </View>
      }
      aoAtualizar={() => q.refetch()}
      testID="tela-avisos"
    >
      <View style={{ gap: 4 }}>
        <Texto variante="meta" style={{ fontSize: 14 }}>
          {naoLidos ? `${naoLidos} ${naoLidos === 1 ? "novo" : "novos"}` : "Tudo lido"}
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          Avisos
        </Texto>
      </View>
      {naoLidos ? (
        <Botao
          titulo="Marcar todos como lidos"
          icone={CheckCheck}
          variante="secundario"
          tamanho="p"
          onPress={() => {
            vibrar.sucesso();
            marcar.mutate({ todos: true }, { onError: (e) => toast.mostrar(mensagemDeErro(e), "erro") });
          }}
          testID="marcar-todos"
        />
      ) : null}
      {q.isPending ? (
        <EsqueletoLista quantos={4} />
      ) : q.isError ? (
        <EstadoErro mensagem={mensagemDeErro(q.error)} aoTentar={() => void q.refetch()} />
      ) : q.data.length ? (
        q.data.map((a, i) => (
          <Animated.View key={a.id} entering={FadeInDown.delay(Math.min(i, 8) * 35).duration(240)}>
            <CartaoAviso aviso={a} />
          </Animated.View>
        ))
      ) : (
        <EstadoVazio
          icone={Inbox}
          titulo="Nenhum aviso ainda"
          texto="Edital publicado, prazo acabando, errata e resultado dos seus concursos chegam aqui."
        />
      )}
      {q.data?.length ? (
        <Texto variante="pequeno" centro cor={cores.tx2}>
          Todo aviso traz o link da fonte oficial.
        </Texto>
      ) : null}
    </Tela>
  );
}
