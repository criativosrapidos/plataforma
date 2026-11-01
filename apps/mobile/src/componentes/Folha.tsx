// Folha que sobe de baixo (bottom sheet) para confirmações, upsell, filtros e explicações.
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { cores, LARGURA_MAX, TOQUE_MIN } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export function Folha({
  visivel,
  aoFechar,
  titulo,
  children,
  rodape,
  testID,
}: {
  visivel: boolean;
  aoFechar: () => void;
  titulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={aoFechar} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.raiz}>
        <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
          <Pressable style={s.fundo} onPress={aoFechar} accessibilityLabel="Fechar" accessibilityRole="button" />
        </Animated.View>
        <Animated.View
          testID={testID}
          entering={SlideInDown.springify().damping(22).stiffness(220)}
          style={[s.folha, { paddingBottom: Math.max(insets.bottom, 16) }]}
          accessibilityViewIsModal
        >
          <View style={s.alca} />
          {titulo ? (
            <View style={s.topo}>
              <Texto variante="tituloMedio" accessibilityRole="header" style={{ flex: 1 }}>
                {titulo}
              </Texto>
              <Pressionavel onPress={aoFechar} accessibilityLabel="Fechar" style={s.fechar} escala={0.9}>
                <X size={20} color={cores.tinta} strokeWidth={2.4} />
              </Pressionavel>
            </View>
          ) : null}
          <ScrollView style={s.rolagem} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled" bounces={false}>
            {children}
          </ScrollView>
          {rodape ? <View style={s.rodape}>{rodape}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, justifyContent: "flex-end" },
  fundo: { flex: 1, backgroundColor: "rgba(15,21,48,0.45)" },
  folha: {
    backgroundColor: cores.papel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    maxHeight: "90%",
    width: "100%",
    maxWidth: LARGURA_MAX,
    alignSelf: "center",
  },
  alca: { width: 40, height: 5, borderRadius: 3, backgroundColor: cores.linhaForte, alignSelf: "center", marginBottom: 8 },
  topo: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4, gap: 12 },
  fechar: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    borderRadius: TOQUE_MIN / 2,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.linha,
    alignItems: "center",
    justifyContent: "center",
  },
  rolagem: { flexGrow: 0 },
  conteudo: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, gap: 14 },
  rodape: { paddingHorizontal: 20, paddingTop: 10, gap: 10 },
});
