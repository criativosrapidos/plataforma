import { router } from 'expo-router';
import { useState } from 'react';

import { Botao, Campo, Tela, Texto } from '@/componentes/ui';
import { mensagemDeErro, supabase } from '@/lib/supabase';

export default function Fiscalizar() {
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aceitar() {
    setEnviando(true);
    setErro(null);
    const { data, error } = await supabase.rpc('aceitar_convite', { codigo });
    setEnviando(false);
    if (error) return setErro(mensagemDeErro(error));
    router.replace({ pathname: '/meta/[id]', params: { id: data as string } });
  }

  return (
    <Tela>
      <Texto v="tituloL">Ser fiscal</Texto>
      <Texto cor="tintaSuave">
        Você confere as fotos de check-in do seu amigo e confirma em até 24 horas. Se não responder, o check-in vale. O fiscal não coloca dinheiro.
      </Texto>
      <Campo rotulo="Código do convite" value={codigo} onChangeText={(t) => setCodigo(t.toUpperCase())} autoCapitalize="characters" maxLength={6} placeholder="Ex.: D4B3AC" />
      {erro ? <Texto cor="perda">{erro}</Texto> : null}
      <Botao titulo="Virar fiscal" onPress={aceitar} carregando={enviando} desativado={codigo.trim().length !== 6} />
    </Tela>
  );
}
