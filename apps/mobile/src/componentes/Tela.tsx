// Estrutura das telas: área segura, rolagem com puxar para atualizar, largura máxima centralizada.
import { useRef, useState, type ReactNode, type RefObject } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollToTop } from "expo-router";
import { vibrar } from "@/lib/vibrar";
import { cores, LARGURA_MAX } from "@/tema";

export interface TelaProps {
  children: ReactNode;
  /** Puxar para atualizar. */
  aoAtualizar?: () => Promise<unknown>;
  /** Conteúdo fixo acima da rolagem. */
  topo?: ReactNode;
  /** Conteúdo fixo abaixo da rolagem (barra de envio, botão principal). */
  rodape?: ReactNode;
  /** false quando a tela tem barra de abas (ela já cuida da área segura de baixo). */
  areaSeguraBaixo?: boolean;
  estiloConteudo?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  refRolagem?: RefObject<ScrollViewInstance | null>;
  testID?: string;
}

export function Tela({
  children,
  aoAtualizar,
  topo,
  rodape,
  areaSeguraBaixo = true,
  estiloConteudo,
  scrollProps,
  refRolagem,
  testID,
}: TelaProps) {
  const insets = useSafeAreaInsets();
  const [atualizando, setAtualizando] = useState(false);
  const refInterna = useRef<ScrollViewInstance>(null);
  const ref = refRolagem ?? refInterna;
  useScrollToTop(ref as never);

  async function atualizar() {
    if (!aoAtualizar) return;
    setAtualizando(true);
    try {
      await aoAtualizar();
      vibrar.toque();
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <View style={[s.raiz, { paddingTop: insets.top }]} testID={testID}>
      {topo ? <View style={s.largura}>{topo}</View> : null}
      <ScrollView
        ref={ref}
        style={s.rolagem}
        contentContainerStyle={[s.conteudo, { paddingBottom: (rodape || !areaSeguraBaixo ? 0 : insets.bottom) + 28 }, estiloConteudo]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          aoAtualizar ? (
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizar}
              tintColor={cores.azul}
              colors={[cores.azul]}
              progressBackgroundColor={cores.branco}
            />
          ) : undefined
        }
        {...scrollProps}
      >
        {children}
      </ScrollView>
      {rodape ? <View style={[s.largura, { paddingBottom: areaSeguraBaixo ? insets.bottom : 0 }]}>{rodape}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.papel },
  rolagem: { flex: 1 },
  conteudo: { paddingHorizontal: 16, paddingTop: 12, gap: 14, width: "100%", maxWidth: LARGURA_MAX, alignSelf: "center" },
  largura: { width: "100%", maxWidth: LARGURA_MAX, alignSelf: "center" },
});
