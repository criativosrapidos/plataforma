import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";
import { cores, raio } from "@/tema";
import { Botao } from "./Botao";
import { Texto } from "./Texto";

export function EstadoVazio({
  icone: Icone,
  titulo,
  texto,
  acao,
  aoAcao,
  compacto,
}: {
  icone: LucideIcon;
  titulo: string;
  texto?: string;
  acao?: string;
  aoAcao?: () => void;
  compacto?: boolean;
}) {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={[s.caixa, compacto && s.compacto]}>
      <View style={s.icone}>
        <Icone size={26} color={cores.azul} strokeWidth={2.2} />
      </View>
      <Texto variante="h2" centro>
        {titulo}
      </Texto>
      {texto ? (
        <Texto variante="meta" centro style={s.texto}>
          {texto}
        </Texto>
      ) : null}
      {acao && aoAcao ? <Botao titulo={acao} onPress={aoAcao} style={{ alignSelf: "center", marginTop: 6 }} /> : null}
    </Animated.View>
  );
}

/** Erro de carregamento com botão de tentar de novo. */
export function EstadoErro({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <View style={[s.caixa, s.erro]}>
      <Texto variante="h3" centro>
        Não carregou
      </Texto>
      <Texto variante="meta" centro>
        {mensagem}
      </Texto>
      <Botao titulo="Tentar de novo" variante="secundario" tamanho="p" onPress={aoTentar} style={{ alignSelf: "center" }} />
    </View>
  );
}

const s = StyleSheet.create({
  caixa: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: cores.branco,
    borderRadius: raio.card,
    borderWidth: 1,
    borderColor: cores.linha,
    borderStyle: "dashed",
  },
  compacto: { paddingVertical: 18 },
  icone: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.azulT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  texto: { maxWidth: 320 },
  erro: { borderStyle: "solid" },
});
