import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Botao, Campo, Tela, Texto } from '@/componentes/ui';
import { hoje } from '@/lib/formato';
import { useEu } from '@/lib/sessao';
import { mensagemDeErro, supabase } from '@/lib/supabase';
import { espaco, raio, useCores } from '@/tema';

export default function CheckIn() {
  const { metaId } = useLocalSearchParams<{ metaId: string }>();
  const eu = useEu();
  const c = useCores();
  const [foto, setFoto] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Só câmera: a foto tem que ser de agora, não da galeria.
  async function tirarFoto() {
    setErro(null);
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) return setErro('Libere a câmera nos ajustes do celular para fazer o check-in.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled) setFoto(r.assets[0].uri);
  }

  async function enviar() {
    if (!foto) return;
    setEnviando(true);
    setErro(null);
    try {
      const imagem = await ImageManipulator.manipulate(foto).resize({ width: 1280 }).renderAsync();
      const salva = await imagem.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
      const bytes = await (await fetch(salva.uri)).arrayBuffer();
      const caminho = `${eu}/${metaId}/${hoje()}-${Date.now()}.jpg`;
      const up = await supabase.storage.from('checkins').upload(caminho, bytes, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      const { error } = await supabase.from('checkins').insert({ meta_id: metaId, foto_path: caminho, texto: texto.trim() || null });
      if (error) {
        await supabase.storage.from('checkins').remove([caminho]);
        throw error;
      }
      router.back();
    } catch (e) {
      const m = mensagemDeErro(e);
      setErro(/duplicate key/i.test(m) ? 'Você já fez o check-in de hoje nesta meta.' : m);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Pressable
        onPress={tirarFoto}
        accessibilityRole="button"
        accessibilityLabel={foto ? 'Tirar outra foto' : 'Tirar foto'}
        style={{
          aspectRatio: 4 / 3,
          borderRadius: raio.sm,
          overflow: 'hidden',
          backgroundColor: c.focoSuave,
          borderWidth: foto ? 0 : 1.5,
          borderStyle: 'dashed',
          borderColor: c.linhaForte,
          alignItems: 'center',
          justifyContent: 'center',
          gap: espaco[2],
        }}
      >
        {foto ? (
          <Image source={{ uri: foto }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <>
            <Camera color={c.foco} size={36} strokeWidth={2} />
            <Texto v="corpoForte" cor="foco">Tirar foto agora</Texto>
          </>
        )}
      </Pressable>
      {foto ? <Botao pequeno tipo="secundario" titulo="Tirar outra" onPress={tirarFoto} style={{ alignSelf: 'flex-start' }} /> : null}
      <Campo rotulo="Conte como foi (opcional)" value={texto} onChangeText={setTexto} placeholder="Ex.: Treino feito antes das 7h." maxLength={280} multiline />
      <Texto v="legenda">A foto aparece no feed e vai para o seu fiscal, que confirma em até 24 horas.</Texto>
      {erro ? <Texto cor="perda">{erro}</Texto> : null}
      <Botao titulo="Enviar check-in" onPress={enviar} carregando={enviando} desativado={!foto} />
    </Tela>
  );
}
