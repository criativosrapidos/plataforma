import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, useFonts } from '@expo-google-fonts/instrument-sans';
import { SplineSansMono_500Medium, SplineSansMono_600SemiBold } from '@expo-google-fonts/spline-sans-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessaoProvider, useSessao } from '@/lib/sessao';
import { fontes, useCores } from '@/tema';

SplashScreen.preventAutoHideAsync();

function Rotas() {
  const { sessao, carregando } = useSessao();
  const c = useCores();
  const [fontesProntas] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    SplineSansMono_500Medium,
    SplineSansMono_600SemiBold,
  });
  const pronto = fontesProntas && !carregando;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.fundo },
          headerTintColor: c.tinta,
          headerTitleStyle: { fontFamily: fontes.titulo700 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.fundo },
        }}
      >
        <Stack.Protected guard={!sessao}>
          <Stack.Screen name="entrar" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!sessao}>
          <Stack.Screen name="(abas)" options={{ headerShown: false }} />
          <Stack.Screen name="meta/nova" options={{ title: 'Nova meta', presentation: 'modal' }} />
          <Stack.Screen name="meta/[id]" options={{ title: 'Meta' }} />
          <Stack.Screen name="checkin/[metaId]" options={{ title: 'Check-in de hoje', presentation: 'modal' }} />
          <Stack.Screen name="comunidade/[id]" options={{ title: 'Comunidade' }} />
          <Stack.Screen name="multa/[id]" options={{ title: 'Multa' }} />
          <Stack.Screen name="fiscalizar" options={{ title: 'Ser fiscal', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <SessaoProvider>
      <Rotas />
    </SessaoProvider>
  );
}
