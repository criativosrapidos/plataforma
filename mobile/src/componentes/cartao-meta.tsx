import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { frequencia, reais } from '@/lib/formato';
import { podeFazerCheckin, resumoDaSemana } from '@/lib/meta';
import type { Checkin, Meta } from '@/lib/tipos';
import { espaco } from '@/tema';
import { Bilhete } from './bilhete';
import { Botao, Dias, Texto } from './ui';

// Bilhete de uma meta ativa com o progresso da semana e o botão de check-in.
export function CartaoMeta({
  meta,
  checkins,
  comunidade,
  fiscal,
  comBotao = true,
}: {
  meta: Meta;
  checkins: Checkin[];
  comunidade: string;
  fiscal?: string;
  comBotao?: boolean;
}) {
  const r = resumoDaSemana(meta, checkins);
  const pontos = Array.from({ length: meta.checkins_por_semana }, (_, i): 'feito' | 'vazio' => (i < r.feitos ? 'feito' : 'vazio'));
  const encerrada = meta.status !== 'ativa';
  return (
    <View style={{ gap: espaco[3] }}>
      <Pressable onPress={() => router.push({ pathname: '/meta/[id]', params: { id: meta.id } })}>
        <Bilhete
          comunidade={comunidade}
          titulo={meta.titulo}
          legenda={
            encerrada
              ? meta.status === 'cumprida' ? 'Meta cumprida' : 'Meta encerrada'
              : `Semana ${r.semana} de ${meta.semanas} · ${frequencia(meta.checkins_por_semana)}${fiscal ? ` · fiscal: ${fiscal}` : ''}`
          }
          rodape={encerrada ? undefined : <Dias estados={pontos} />}
          valor={reais(meta.valor_centavos)}
          legendaValor="por semana"
        />
      </Pressable>
      {comBotao && !encerrada ? (
        r.fezHoje ? (
          <Texto v="legenda">Check-in de hoje feito. {r.faltam > 0 ? `Faltam ${r.faltam} nesta semana.` : 'Semana garantida.'}</Texto>
        ) : podeFazerCheckin(meta) ? (
          <Botao
            titulo="Fazer check-in de hoje"
            onPress={() => router.push({ pathname: '/checkin/[metaId]', params: { metaId: meta.id } })}
          />
        ) : null
      ) : null}
    </View>
  );
}
