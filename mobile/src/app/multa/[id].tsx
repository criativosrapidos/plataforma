import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { Bilhete } from '@/componentes/bilhete';
import { Botao, Campo, Cartao, Carregando, Selo, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { exigir, useDados } from '@/lib/dados';
import { reais } from '@/lib/formato';
import { mensagemDeErro, supabase } from '@/lib/supabase';
import type { Meta, Multa } from '@/lib/tipos';

export default function DetalheDaMulta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { instituicoes } = useCatalogo();
  const [pagando, setPagando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [contestando, setContestando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { dados, recarregar } = useDados(async () => {
    const multa = (await exigir(supabase.from('multas').select('*').eq('id', id).single())) as Multa;
    const meta = (await exigir(supabase.from('metas').select('*').eq('id', multa.meta_id).single())) as Meta;
    return { multa, meta, agora: Date.now() };
  }, id);

  if (!dados) return <Carregando />;
  const { multa, meta, agora } = dados;
  const instituicao = instituicoes?.find((i) => i.id === meta.instituicao_id)?.nome ?? 'a instituição que você escolheu';
  const podeContestar = multa.status === 'aberta' && agora - Date.parse(multa.criado_em) < 48 * 3600000;

  async function pagar() {
    setPagando(true);
    setErro(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ link: string }>('mp-pagar-multa', { body: { multa_id: multa.id } });
      if (error) throw error;
      if (!data?.link) throw new Error('O Mercado Pago não devolveu o link de pagamento.');
      await WebBrowser.openBrowserAsync(data.link);
      await recarregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setPagando(false);
    }
  }

  async function contestar() {
    setContestando(true);
    setErro(null);
    const { error } = await supabase.rpc('contestar_multa', { multa: multa.id, motivo });
    setContestando(false);
    if (error) return setErro(mensagemDeErro(error));
    recarregar();
  }

  return (
    <Tela refresh={<RefreshControl refreshing={false} onRefresh={recarregar} />}>
      <Bilhete
        multada
        comunidade={`Semana ${multa.semana} de ${meta.semanas}`}
        titulo={meta.titulo}
        legenda={`${multa.checkins_feitos} de ${meta.checkins_por_semana} check-ins`}
        rodape={<Selo estado={multa.status === 'paga' ? 'cumprida' : 'multada'} texto={{ aberta: 'Multada', contestada: 'Em análise', paga: 'Doado', cancelada: 'Cancelada' }[multa.status]} />}
        rotuloValor="Multa"
        valor={reais(multa.valor_centavos)}
        legendaValor="vira doação"
      />

      {multa.status === 'paga' ? (
        <Texto>Seus {reais(multa.valor_centavos)} foram para {instituicao}. Obrigado por cumprir a palavra, mesmo sem cumprir a meta.</Texto>
      ) : multa.status === 'contestada' ? (
        <Texto>Recebemos sua contestação. O FocoMulta analisa e responde por aqui. Enquanto isso, nada é cobrado.</Texto>
      ) : multa.status === 'cancelada' ? (
        <Texto>Essa multa foi cancelada. Nada a pagar.</Texto>
      ) : (
        <>
          <Texto>
            Não foi dessa vez. Seus {reais(multa.valor_centavos)} vão para {instituicao}. O FocoMulta repassa 100% da multa, descontada só a taxa do meio de pagamento.
          </Texto>
          <Botao tipo="perda" titulo="Pagar multa" valor={reais(multa.valor_centavos)} onPress={pagar} carregando={pagando} />
          <Texto v="legenda">Pix ou cartão, pelo Mercado Pago. Enquanto a multa estiver em aberto, você não cria meta nova.</Texto>
        </>
      )}

      {podeContestar ? (
        <Cartao>
          <Texto v="tituloS">Aconteceu um imprevisto de verdade?</Texto>
          <Texto cor="tintaSuave">Você tem 48 horas para contestar. Conte o que houve.</Texto>
          <Campo rotulo="O que aconteceu" value={motivo} onChangeText={setMotivo} multiline maxLength={500} />
          <Botao tipo="secundario" titulo="Contestar multa" onPress={contestar} carregando={contestando} desativado={motivo.trim().length < 10} />
        </Cartao>
      ) : null}
      {erro ? <Texto cor="perda">{erro}</Texto> : null}
    </Tela>
  );
}
