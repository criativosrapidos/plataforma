import { Tabs } from 'expo-router';
import { House, Ticket, UserRound, Users } from 'lucide-react-native';

import { fontes, useCores } from '@/tema';

export default function Abas() {
  const c = useCores();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.foco,
        tabBarInactiveTintColor: c.tintaSuave,
        tabBarStyle: { backgroundColor: c.superficie, borderTopColor: c.linha },
        tabBarLabelStyle: { fontFamily: fontes.texto600, fontSize: 11 },
        sceneStyle: { backgroundColor: c.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <House color={color} size={22} strokeWidth={2} /> }} />
      <Tabs.Screen name="comunidades" options={{ title: 'Comunidades', tabBarIcon: ({ color }) => <Users color={color} size={22} strokeWidth={2} /> }} />
      <Tabs.Screen name="metas" options={{ title: 'Metas', tabBarIcon: ({ color }) => <Ticket color={color} size={22} strokeWidth={2} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <UserRound color={color} size={22} strokeWidth={2} /> }} />
    </Tabs>
  );
}
