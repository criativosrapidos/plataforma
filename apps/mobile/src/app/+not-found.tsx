import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Botao } from "@/componentes/Botao";
import { Simbolo } from "@/componentes/Logo";
import { Texto } from "@/componentes/Texto";
import { cores } from "@/tema";

export default function NaoEncontrado() {
  return (
    <View style={s.centro}>
      <Simbolo tamanho={72} />
      <Texto variante="tituloMedio" centro>
        Página não encontrada
      </Texto>
      <Texto variante="corpo" cor={cores.tx2} centro>
        Esse endereço não existe no app.
      </Texto>
      <Botao titulo="Voltar para o início" onPress={() => router.replace("/")} style={{ alignSelf: "center" }} />
    </View>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: cores.papel },
});
