// O bilhete: corpo com o compromisso, picote tracejado e canhoto com o dinheiro em jogo.
// Canhoto amarelo enquanto vale; vermelho quando virou multa.
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { espaco, raio, sombraCartao, useCores } from '@/tema';
import { Texto } from './ui';

const CANHOTO = 128;

export function Bilhete({
  comunidade,
  titulo,
  legenda,
  rodape,
  rotuloValor = 'Em jogo',
  valor,
  legendaValor,
  multada,
}: {
  comunidade: string;
  titulo: string;
  legenda?: string;
  rodape?: ReactNode;
  rotuloValor?: string;
  valor: string;
  legendaValor?: string;
  multada?: boolean;
}) {
  const c = useCores();
  const canhoto = multada ? c.perda : c.multa;
  const sobre = multada ? c.sobrePerda : c.sobreMulta;
  return (
    <View style={[{ flexDirection: 'row', borderRadius: raio.lg, backgroundColor: c.superficie }, sombraCartao(c)]}>
      <View style={{ flex: 1, padding: espaco[4], gap: espaco[1] + 2 }}>
        <Texto v="rotulo">{comunidade}</Texto>
        <Texto v="tituloS">{titulo}</Texto>
        {legenda ? <Texto v="legenda">{legenda}</Texto> : null}
        {rodape ? <View style={{ marginTop: espaco[2] }}>{rodape}</View> : null}
      </View>
      <View
        style={{
          width: CANHOTO,
          backgroundColor: canhoto,
          borderTopRightRadius: raio.lg,
          borderBottomRightRadius: raio.lg,
          borderLeftWidth: 2,
          borderStyle: 'dashed',
          borderLeftColor: multada ? c.perda : c.linhaForte,
          padding: espaco[4] - 2,
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Texto v="rotulo" style={{ color: sobre }}>{rotuloValor}</Texto>
        <Texto v="valorL" style={{ color: sobre, fontSize: valor.length > 5 ? 20 : 28, lineHeight: valor.length > 5 ? 26 : 34 }}>{valor}</Texto>
        {legendaValor ? <Texto v="legenda" style={{ color: sobre }}>{legendaValor}</Texto> : null}
      </View>
      {/* Recortes redondos nas pontas do picote */}
      <View style={{ position: 'absolute', right: CANHOTO - 9, top: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: c.fundo }} />
      <View style={{ position: 'absolute', right: CANHOTO - 9, bottom: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: c.fundo }} />
    </View>
  );
}
