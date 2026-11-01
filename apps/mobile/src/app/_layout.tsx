import { useEffect } from "react";
import { AppState, Platform, StyleSheet, View, type AppStateStatus } from "react-native";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { BarlowCondensed_600SemiBold, BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from "@expo-google-fonts/figtree";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { queryClient } from "@/api/consultas";
import { ProvedorToast } from "@/componentes/Toast";
import { TelaCarregando, TelaSemConexao } from "@/componentes/TelasEstado";
import { ProvedorNotificacoes } from "@/contexto/Notificacoes";
import { ProvedorSessao, useSessao } from "@/contexto/Sessao";
import { ProvedorUpsell } from "@/contexto/Upsell";
import { cores, LARGURA_MAX } from "@/tema";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 280, fade: true });

// Revalida os dados quando o app volta para a frente.
if (Platform.OS !== "web") {
  focusManager.setEventListener((foco) => {
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => foco(s === "active"));
    return () => sub.remove();
  });
}

const temaNavegacao = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: cores.papel,
    card: cores.papel,
    primary: cores.azul,
    text: cores.tinta,
    border: cores.linha,
  },
};

export default function Raiz() {
  const [fontesProntas] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  return (
    <GestureHandlerRootView style={s.fundo}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={temaNavegacao}>
            <View style={s.moldura}>
              <ProvedorToast>
                <ProvedorSessao>
                  <ProvedorNotificacoes>
                    <ProvedorUpsell>
                      <StatusBar style="dark" />
                      <Navegacao fontesProntas={fontesProntas} />
                    </ProvedorUpsell>
                  </ProvedorNotificacoes>
                </ProvedorSessao>
              </ProvedorToast>
            </View>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const ENTRADA = {
  app: "/",
  perfil: "/assistente",
  planos: "/planos",
  publico: "/boas-vindas",
} as const;

function Navegacao({ fontesProntas }: { fontesProntas: boolean }) {
  const { etapa, tentarDeNovo } = useSessao();
  const pronto = fontesProntas && etapa !== "carregando";

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);

  if (!fontesProntas) return null;
  if (etapa === "carregando") return <TelaCarregando />;
  if (etapa === "offline") return <TelaSemConexao aoTentar={tentarDeNovo} />;

  // Cada etapa libera só o seu grupo de telas; qualquer tela bloqueada leva para a entrada da etapa atual.
  const entrada = ENTRADA[etapa];
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.papel }, animation: "slide_from_right" }}>
      <Stack.Protected guard={etapa === "app"} redirectTo={entrada}>
        <Stack.Screen name="(app)" options={{ animation: "fade" }} />
      </Stack.Protected>
      <Stack.Protected guard={etapa === "perfil"} redirectTo={entrada}>
        <Stack.Screen name="assistente" options={{ animation: "fade" }} />
      </Stack.Protected>
      <Stack.Protected guard={etapa === "planos"} redirectTo={entrada}>
        <Stack.Screen name="planos" options={{ animation: "fade" }} />
      </Stack.Protected>
      <Stack.Protected guard={etapa === "publico"} redirectTo={entrada}>
        <Stack.Screen name="boas-vindas" options={{ animation: "fade" }} />
        <Stack.Screen name="entrar" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
    </Stack>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: Platform.OS === "web" ? cores.fundoWeb : cores.papel },
  // Na web (e em telas largas) o app fica numa coluna centralizada, como um celular.
  moldura: Platform.select({
    web: {
      flex: 1,
      width: "100%",
      maxWidth: LARGURA_MAX,
      alignSelf: "center",
      backgroundColor: cores.papel,
      overflow: "hidden",
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: cores.linha,
    },
    default: { flex: 1 },
  }),
});
