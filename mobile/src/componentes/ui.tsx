// Componentes da marca FocoMulta: texto, botões, chips, selos, campos e tela.
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type RefreshControlProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { iniciais } from '@/lib/formato';
import { espaco, fontes, raio, tipo, useCores, type Cores, type Tipo } from '@/tema';

export function Texto({
  v = 'corpo',
  cor,
  style,
  children,
  linhas,
}: {
  v?: Tipo;
  cor?: keyof Cores;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  linhas?: number;
}) {
  const c = useCores();
  const padrao: keyof Cores = v === 'legenda' || v === 'rotulo' ? 'tintaSuave' : 'tinta';
  return (
    <Text numberOfLines={linhas} style={[tipo[v], { color: c[cor ?? padrao] }, style]}>
      {children}
    </Text>
  );
}

const BILHETE = 'M14 12H50A10 10 0 0 1 60 22V26A6 6 0 0 0 60 38V42A10 10 0 0 1 50 52H14A10 10 0 0 1 4 42V38A6 6 0 0 0 4 26V22A10 10 0 0 1 14 12Z';

// Símbolo do bilhete. Sobre multa (amarelo), tudo em sobre-multa.
export function Simbolo({ tamanho = 28, sobreMulta = false }: { tamanho?: number; sobreMulta?: boolean }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64">
      <Path d={BILHETE} fill={sobreMulta ? '#121736' : '#FFC531'} stroke="#121736" strokeWidth={4} strokeLinejoin="round" />
      <Circle cx={32} cy={32} r={8} fill={sobreMulta ? '#FFC531' : '#121736'} />
    </Svg>
  );
}

export function Logo({ tamanho = 22, clara = false }: { tamanho?: number; clara?: boolean }) {
  const c = useCores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tamanho * 0.3 }}>
      <Simbolo tamanho={tamanho * 1.3} />
      <Text style={{ fontFamily: fontes.titulo800, fontSize: tamanho, letterSpacing: -tamanho * 0.03, color: clara ? '#EEF0FA' : c.tinta }}>
        FocoMulta
      </Text>
    </View>
  );
}

type TipoBotao = 'principal' | 'secundario' | 'aposta' | 'perda';

export function Botao({
  titulo,
  valor,
  onPress,
  tipo: t = 'principal',
  carregando,
  desativado,
  pequeno,
  style,
}: {
  titulo: string;
  valor?: string;
  onPress?: () => void;
  tipo?: TipoBotao;
  carregando?: boolean;
  desativado?: boolean;
  pequeno?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useCores();
  const fundo = { principal: c.foco, secundario: 'transparent', aposta: c.multa, perda: c.perda }[t];
  const texto = { principal: c.sobreFoco, secundario: c.tinta, aposta: c.sobreMulta, perda: c.sobrePerda }[t];
  const borda = t === 'secundario' ? c.linhaForte : t === 'aposta' ? c.sobreMulta : fundo;
  const off = desativado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: fundo,
          borderColor: borda,
          borderWidth: t === 'secundario' || t === 'aposta' ? 1.5 : 0,
          borderRadius: raio.md,
          minHeight: pequeno ? 36 : 52,
          paddingHorizontal: pequeno ? espaco[3] : espaco[6],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: espaco[2],
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={texto} />
      ) : (
        <>
          <Text style={[pequeno ? tipo.legenda : tipo.corpoForte, { color: texto, fontFamily: fontes.texto600 }]}>{titulo}</Text>
          {valor ? <Text style={[tipo.valor, { color: texto, fontFamily: fontes.mono600 }]}>{valor}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  rotulo,
  ativo,
  onPress,
  valor,
}: {
  rotulo: string;
  ativo?: boolean;
  onPress?: () => void;
  valor?: boolean;
}) {
  const c = useCores();
  // Chip de valor selecionado vira canhoto amarelo; os demais usam tinta.
  const fundo = ativo ? (valor ? c.multa : c.tinta) : 'transparent';
  const cor = ativo ? (valor ? c.sobreMulta : c.fundo) : c.tinta;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!ativo }}
      onPress={onPress}
      style={{
        borderRadius: raio.full,
        borderWidth: 1.5,
        borderColor: ativo ? (valor ? c.sobreMulta : c.tinta) : c.linhaForte,
        backgroundColor: fundo,
        paddingHorizontal: espaco[3] + 2,
        paddingVertical: espaco[2] - 1,
      }}
    >
      <Text style={[valor ? tipo.valor : tipo.legenda, { color: cor, fontFamily: valor ? fontes.mono600 : fontes.texto600 }]}>{rotulo}</Text>
    </Pressable>
  );
}

export type EstadoSelo = 'em-dia' | 'aguardando' | 'cumprida' | 'multada';

export function Selo({ estado, texto }: { estado: EstadoSelo; texto?: string }) {
  const c = useCores();
  const s = {
    'em-dia': { fundo: c.focoSuave, cor: c.foco, ponto: c.foco, padrao: 'Em dia' },
    aguardando: { fundo: c.multaSuave, cor: c.tinta, ponto: c.multa, padrao: 'Aguardando fiscal' },
    cumprida: { fundo: c.foco, cor: c.sobreFoco, ponto: c.sobreFoco, padrao: 'Cumprida' },
    multada: { fundo: c.perdaSuave, cor: c.perda, ponto: c.perda, padrao: 'Multada' },
  }[estado];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: s.fundo,
        borderRadius: raio.full,
        paddingHorizontal: espaco[2] + 2,
        paddingVertical: 3,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: estado === 'multada' ? 1 : 3, backgroundColor: s.ponto }} />
      <Text style={[tipo.legenda, { color: s.cor, fontFamily: fontes.texto600, fontSize: 12 }]}>{texto ?? s.padrao}</Text>
    </View>
  );
}

export function Avatar({ nome, tamanho = 36 }: { nome: string; tamanho?: number }) {
  const c = useCores();
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        backgroundColor: c.focoSuave,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fontes.texto600, fontSize: tamanho * 0.36, color: c.foco }}>{iniciais(nome)}</Text>
    </View>
  );
}

// Pontos contam os dias: feito é círculo azul; falha é quadrado vermelho.
export function Dias({ estados }: { estados: ('feito' | 'falhou' | 'vazio')[] }) {
  const c = useCores();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      {estados.map((e, i) => (
        <View
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: e === 'falhou' ? 2 : 6,
            backgroundColor: e === 'feito' ? c.foco : e === 'falhou' ? c.perda : 'transparent',
            borderWidth: e === 'vazio' ? 1.5 : 0,
            borderColor: c.linhaForte,
          }}
        />
      ))}
    </View>
  );
}

export function Campo({ rotulo, ajuda, style, ...props }: TextInputProps & { rotulo: string; ajuda?: string }) {
  const c = useCores();
  return (
    <View style={{ gap: espaco[2] }}>
      <Texto v="rotulo">{rotulo}</Texto>
      <TextInput
        placeholderTextColor={c.tintaSuave}
        style={[
          tipo.corpo,
          {
            color: c.tinta,
            backgroundColor: c.superficie,
            borderWidth: 1.5,
            borderColor: c.linhaForte,
            borderRadius: raio.sm,
            paddingHorizontal: espaco[3],
            paddingVertical: espaco[3] - 2,
            minHeight: 48,
          },
          style,
        ]}
        {...props}
      />
      {ajuda ? <Texto v="legenda">{ajuda}</Texto> : null}
    </View>
  );
}

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useCores();
  return (
    <View
      style={[
        { backgroundColor: c.superficie, borderWidth: 1, borderColor: c.linha, borderRadius: raio.lg, padding: espaco[4], gap: espaco[3] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Tela({
  children,
  refresh,
  semRolagem,
  topo,
}: {
  children: ReactNode;
  refresh?: React.ReactElement<RefreshControlProps>;
  semRolagem?: boolean;
  topo?: boolean;
}) {
  const c = useCores();
  const conteudo = { padding: espaco[4], gap: espaco[6], paddingBottom: espaco[12] };
  return (
    <SafeAreaView edges={topo ? ['top'] : []} style={{ flex: 1, backgroundColor: c.fundo }}>
      {semRolagem ? (
        <View style={[{ flex: 1 }, conteudo]}>{children}</View>
      ) : (
        <ScrollView contentContainerStyle={conteudo} refreshControl={refresh} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export function Carregando() {
  const c = useCores();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo, padding: espaco[8] }}>
      <ActivityIndicator color={c.foco} />
    </View>
  );
}

export function Aviso({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <Cartao style={{ alignItems: 'flex-start' }}>
      <Texto v="tituloS">{titulo}</Texto>
      {texto ? <Texto v="corpo" cor="tintaSuave">{texto}</Texto> : null}
      {acao}
    </Cartao>
  );
}

export function Secao({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <View style={{ gap: espaco[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto v="tituloM">{titulo}</Texto>
        {acao}
      </View>
      {children}
    </View>
  );
}
