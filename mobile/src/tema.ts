// Tokens da marca FocoMulta (marca/tokens.json). Os dois temas usam os mesmos nomes.
import { useColorScheme, type TextStyle } from 'react-native';

const claro = {
  fundo: '#F6F7FB',
  superficie: '#FFFFFF',
  tinta: '#121736',
  tintaSuave: '#555C80',
  linha: '#D5D9E8',
  linhaForte: '#8189AD',
  foco: '#2B3FE0',
  sobreFoco: '#FFFFFF',
  focoSuave: '#E4E8FF',
  multa: '#FFC531',
  sobreMulta: '#121736',
  multaSuave: '#FFF1C7',
  perda: '#BF2D17',
  sobrePerda: '#FFFFFF',
  perdaSuave: '#FDE7E1',
};

const escuro: typeof claro = {
  fundo: '#0E1226',
  superficie: '#171C38',
  tinta: '#EEF0FA',
  tintaSuave: '#A4ABCB',
  linha: '#2B3257',
  linhaForte: '#6B74A0',
  foco: '#8E9BFF',
  sobreFoco: '#0E1226',
  focoSuave: '#1F2757',
  multa: '#FFC531',
  sobreMulta: '#121736',
  multaSuave: '#3A3113',
  perda: '#FF8A6B',
  sobrePerda: '#0E1226',
  perdaSuave: '#40190F',
};

export type Cores = typeof claro;

export function useCores(): Cores {
  return useColorScheme() === 'dark' ? escuro : claro;
}

export const espaco = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;
export const raio = { sm: 8, md: 14, lg: 24, full: 999 } as const;

export const fontes = {
  titulo700: 'BricolageGrotesque_700Bold',
  titulo800: 'BricolageGrotesque_800ExtraBold',
  texto400: 'InstrumentSans_400Regular',
  texto500: 'InstrumentSans_500Medium',
  texto600: 'InstrumentSans_600SemiBold',
  mono500: 'SplineSansMono_500Medium',
  mono600: 'SplineSansMono_600SemiBold',
} as const;

// Estilos de texto da marca (tipografia de tokens.json).
export const tipo = {
  tituloXl: { fontFamily: fontes.titulo800, fontSize: 56, lineHeight: 56, letterSpacing: -1.7 },
  tituloL: { fontFamily: fontes.titulo800, fontSize: 36, lineHeight: 40, letterSpacing: -0.7 },
  tituloM: { fontFamily: fontes.titulo700, fontSize: 24, lineHeight: 28, letterSpacing: -0.24 },
  tituloS: { fontFamily: fontes.titulo700, fontSize: 18, lineHeight: 24 },
  corpo: { fontFamily: fontes.texto400, fontSize: 16, lineHeight: 24 },
  corpoForte: { fontFamily: fontes.texto600, fontSize: 16, lineHeight: 24 },
  legenda: { fontFamily: fontes.texto500, fontSize: 13, lineHeight: 18 },
  rotulo: { fontFamily: fontes.texto600, fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: 'uppercase' },
  valorL: { fontFamily: fontes.mono600, fontSize: 32, lineHeight: 36, fontVariant: ['tabular-nums'] },
  valor: { fontFamily: fontes.mono500, fontSize: 16, lineHeight: 24, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type Tipo = keyof typeof tipo;

export function sombraCartao(c: Cores) {
  return {
    shadowColor: c === escuro ? '#000000' : '#121736',
    shadowOpacity: c === escuro ? 0.35 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  };
}
