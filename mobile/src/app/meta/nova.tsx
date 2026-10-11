import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Campo, Chip, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { frequencia, reais } from '@/lib/formato';
import { mensagemDeErro, supabase } from '@/lib/supabase';
import { espaco } from '@/tema';

const VALORES = [500, 1000, 2000, 5000];
const SEMANAS = [2, 4, 8, 12];

function Grupo({ rotulo, children, ajuda }: { rotulo: string; children: React.ReactNode; ajuda?: string }) {
  return (
    <View style={{ gap: espaco[2] }}>
      <Texto v="rotulo">{rotulo}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] }}>{children}</View>
      {ajuda ? <Texto v="legenda">{ajuda}</Texto> : null}
    </View>
  );
}

export default function NovaMeta() {
  const params = useLocalSearchParams<{ comunidade?: string; titulo?: string }>();
  const { comunidades, instituicoes } = useCatalogo();
  const [titulo, setTitulo] = useState(params.titulo ?? '');
  const [comunidade, setComunidade] = useState(params.comunidade ?? '');
  const [porSemana, setPorSemana] = useState(4);
  const [semanas, setSemanas] = useState(4);
  const [valor, setValor] = useState(1000);
  const [outroValor, setOutroValor] = useState('');
  const [comFiscal, setComFiscal] = useState(true);
  const [escolhida, setInstituicao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Com uma instituição só, ela já vem escolhida.
  const instituicao = escolhida || (instituicoes?.length === 1 ? instituicoes[0].id : '');

  const valorFinal = outroValor ? Math.round(Number(outroValor.replace(',', '.')) * 100) : valor;
  const nomeInstituicao = instituicoes?.find((i) => i.id === instituicao)?.nome;
  const valido = titulo.trim().length >= 3 && comunidade && instituicao && valorFinal >= 500 && valorFinal <= 100000;

  async function apostar() {
    setSalvando(true);
    setErro(null);
    const { data, error } = await supabase
      .from('metas')
      .insert({
        titulo: titulo.trim(),
        comunidade_id: comunidade,
        checkins_por_semana: porSemana,
        semanas,
        valor_centavos: valorFinal,
        modo: comFiscal ? 'com_fiscal' : 'so_eu',
        instituicao_id: instituicao,
      })
      .select('id')
      .single();
    setSalvando(false);
    if (error) return setErro(mensagemDeErro(error));
    router.replace({ pathname: '/meta/[id]', params: { id: data.id, nova: comFiscal ? '1' : '' } });
  }

  return (
    <Tela>
      <Campo
        rotulo="O que você vai cumprir?"
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ex.: Parar de fumar"
        maxLength={80}
      />

      <Grupo rotulo="Comunidade">
        {comunidades?.map((c) => <Chip key={c.id} rotulo={c.nome} ativo={comunidade === c.id} onPress={() => setComunidade(c.id)} />)}
      </Grupo>

      <Grupo rotulo="Quantos check-ins por semana?" ajuda="Cada check-in é uma foto tirada na hora.">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => <Chip key={n} rotulo={n === 7 ? 'Todo dia' : `${n}x`} ativo={porSemana === n} onPress={() => setPorSemana(n)} />)}
      </Grupo>

      <Grupo rotulo="Por quanto tempo?">
        {SEMANAS.map((n) => <Chip key={n} rotulo={`${n} semanas`} ativo={semanas === n} onPress={() => setSemanas(n)} />)}
      </Grupo>

      <Grupo rotulo="Quanto vale cada semana?" ajuda="É o que você paga em cada semana que falhar. Cumpriu, não paga nada.">
        {VALORES.map((v) => (
          <Chip key={v} valor rotulo={reais(v)} ativo={!outroValor && valor === v} onPress={() => { setValor(v); setOutroValor(''); }} />
        ))}
      </Grupo>
      <Campo rotulo="Outro valor (R$)" value={outroValor} onChangeText={setOutroValor} keyboardType="decimal-pad" placeholder="De 5 a 1.000" />

      <Grupo rotulo="Quem fiscaliza?" ajuda={comFiscal ? 'Recomendado. Você recebe um código para mandar ao seu fiscal.' : 'Só você e a foto. O check-in fica visível no feed.'}>
        <Chip rotulo="Um amigo" ativo={comFiscal} onPress={() => setComFiscal(true)} />
        <Chip rotulo="Só eu" ativo={!comFiscal} onPress={() => setComFiscal(false)} />
      </Grupo>

      <Grupo rotulo="Se falhar, a multa vai para">
        {instituicoes?.map((i) => <Chip key={i.id} rotulo={i.nome} ativo={instituicao === i.id} onPress={() => setInstituicao(i.id)} />)}
      </Grupo>
      {instituicoes && !instituicoes.length ? (
        <Aviso titulo="Nenhuma instituição cadastrada" texto="Cadastre as instituições verificadas na tabela instituicoes do Supabase." />
      ) : null}

      {valido ? (
        <Texto cor="tintaSuave">
          {titulo.trim()}, {frequencia(porSemana).toLowerCase()}, por {semanas} semanas. Semana com menos de {porSemana} check-in{porSemana > 1 ? 's' : ''}:{' '}
          {reais(valorFinal)} viram doação para {nomeInstituicao}.
        </Texto>
      ) : null}
      {erro ? <Texto cor="perda">{erro}</Texto> : null}
      <Botao tipo="aposta" titulo="Apostar" valor={reais(valorFinal || 0)} onPress={apostar} carregando={salvando} desativado={!valido} />
    </Tela>
  );
}
