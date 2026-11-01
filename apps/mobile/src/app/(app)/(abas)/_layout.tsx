import { Tabs } from "expo-router/js-tabs";
import { BarraAbas } from "@/componentes/BarraAbas";
import { cores } from "@/tema";

export default function LayoutAbas() {
  return (
    <Tabs
      tabBar={(p) => <BarraAbas {...p} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cores.papel }, animation: "fade" }}
    >
      <Tabs.Screen name="index" options={{ title: "Hoje" }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda" }} />
      <Tabs.Screen name="materias" options={{ title: "Matérias" }} />
      <Tabs.Screen name="concursos" options={{ title: "Concursos" }} />
      <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
