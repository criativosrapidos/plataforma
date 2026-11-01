import { Stack } from "expo-router";
import { cores } from "@/tema";

// Ao abrir um concurso direto pela notificação, "voltar" leva para as abas.
export const unstable_settings = { anchor: "(abas)" };

export default function LayoutApp() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.papel }, animation: "slide_from_right" }}>
      <Stack.Screen name="(abas)" />
      <Stack.Screen name="concurso/[id]/index" />
      <Stack.Screen name="concurso/[id]/pergunte" />
      <Stack.Screen name="avisos" />
      <Stack.Screen name="perfis/index" />
      <Stack.Screen name="perfis/[id]" />
    </Stack>
  );
}
