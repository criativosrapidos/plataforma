// Criar ou editar um perfil de busca ("novo" cria).
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Trash2 } from "lucide-react-native";
import type { PerfilEntrada } from "@/api/api";
import { mensagemDeErro } from "@/api/cliente";
import { usePerfis, useRemoverPerfil, useSalvarPerfil } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { BarraVoltar } from "@/componentes/Cabecalho";
import { Campo } from "@/componentes/Campo";
import { Interruptor } from "@/componentes/Controles";
import { EsqueletoLista } from "@/componentes/Esqueleto";
import { Folha } from "@/componentes/Folha";
import {
  CampoTermos,
  GrupoAreas,
  GrupoBancas,
  GrupoEscolaridade,
  GrupoSalario,
  GrupoUfs,
  PERFIL_VAZIO,
  resumoPerfil,
  SUGESTOES_CARGOS,
} from "@/componentes/FormularioPerfil";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { vibrar } from "@/lib/vibrar";
import { cores } from "@/tema";

export default function EditarPerfil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const novo = id === "novo";
  const perfis = usePerfis();
  const existente = perfis.data?.find((p) => p.id === id);
  if (novo) return <Formulario id={id} inicial={{ ...PERFIL_VAZIO, nome: "Novo perfil" }} />;
  if (existente) {
    const { id: _id, ...resto } = existente;
    return <Formulario key={existente.id} id={id} inicial={resto} />;
  }
  return (
    <Tela
      topo={
        <View style={{ paddingHorizontal: 16 }}>
          <BarraVoltar />
        </View>
      }
    >
      <Texto variante="titulo" accessibilityRole="header">
        Editar perfil
      </Texto>
      {perfis.isPending ? <EsqueletoLista quantos={3} /> : <Texto variante="corpo">Perfil não encontrado.</Texto>}
    </Tela>
  );
}

function Formulario({ id, inicial }: { id: string; inicial: PerfilEntrada }) {
  const novo = id === "novo";
  const salvar = useSalvarPerfil();
  const remover = useRemoverPerfil();
  const toast = useToast();
  const [p, setP] = useState<PerfilEntrada>(inicial);
  const [confirmar, setConfirmar] = useState(false);

  const mudar = (d: Partial<PerfilEntrada>) => setP((x) => ({ ...x, ...d }));

  const gravar = () => {
    salvar.mutate(
      { id: novo ? undefined : id, perfil: { ...p, nome: p.nome.trim() || "Meu perfil" } },
      {
        onSuccess: () => {
          vibrar.sucesso();
          toast.mostrar(novo ? "Perfil criado. A gente avisa quando sair concurso." : "Perfil salvo.");
          router.back();
        },
        onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
      },
    );
  };

  return (
    <Tela
      topo={
        <View style={{ paddingHorizontal: 16 }}>
          <BarraVoltar />
        </View>
      }
      rodape={
        <View style={s.rodape}>
          <Texto variante="pequeno" numberOfLines={2} centro>
            {resumoPerfil(p)}
          </Texto>
          <Botao
            titulo={novo ? "Criar perfil" : "Salvar perfil"}
            icone={Check}
            tamanho="g"
            bloco
            carregando={salvar.isPending}
            onPress={gravar}
            testID="salvar-perfil"
          />
        </View>
      }
    >
      <Texto variante="titulo" accessibilityRole="header">
        {novo ? "Novo perfil" : "Editar perfil"}
      </Texto>
      <>
        <Campo
          rotulo="Nome do perfil"
          value={p.nome}
          onChangeText={(nome) => mudar({ nome })}
          maxLength={60}
          placeholder="Ex.: Tribunais em SP"
        />
        {!novo ? (
          <View style={s.ativo}>
            <View style={{ flex: 1 }}>
              <Texto variante="corpoForte">Perfil ativo</Texto>
              <Texto variante="meta">Pausado, ele não manda avisos.</Texto>
            </View>
            <Interruptor ligado={p.ativo} aoMudar={(ativo) => mudar({ ativo })} rotulo="Perfil ativo" />
          </View>
        ) : null}
        <Bloco titulo="Escolaridade">
          <GrupoEscolaridade p={p} mudar={mudar} />
        </Bloco>
        <Bloco titulo="Áreas" texto="Em branco: todas.">
          <GrupoAreas p={p} mudar={mudar} />
        </Bloco>
        <Bloco titulo="Onde">
          <GrupoUfs p={p} mudar={mudar} />
        </Bloco>
        <Bloco titulo="Salário mínimo">
          <GrupoSalario p={p} mudar={mudar} />
        </Bloco>
        <Bloco titulo="Bancas" texto="Em branco: todas.">
          <GrupoBancas p={p} mudar={mudar} />
        </Bloco>
        <Bloco titulo="Cargos e palavras-chave">
          <CampoTermos
            rotulo="Cargos"
            valores={p.cargos}
            mudar={(cargos) => mudar({ cargos })}
            sugestoes={SUGESTOES_CARGOS}
            placeholder="Ex.: técnico judiciário"
          />
          <CampoTermos
            rotulo="Palavras-chave"
            valores={p.palavras_chave}
            mudar={(palavras_chave) => mudar({ palavras_chave })}
            placeholder="Ex.: PRF, tribunal"
          />
        </Bloco>
        {!novo ? <Botao titulo="Apagar perfil" variante="perigo" icone={Trash2} bloco onPress={() => setConfirmar(true)} /> : null}
      </>
      <Folha
        visivel={confirmar}
        aoFechar={() => setConfirmar(false)}
        titulo="Apagar perfil?"
        rodape={
          <>
            <Botao
              titulo="Apagar"
              variante="perigo"
              tamanho="g"
              bloco
              onPress={() => {
                setConfirmar(false);
                vibrar.forte();
                remover.mutate(id, {
                  onSuccess: () => toast.mostrar("Perfil apagado.", "info"),
                  onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
                });
                router.back();
              }}
            />
            <Botao titulo="Cancelar" variante="fantasma" onPress={() => setConfirmar(false)} style={{ alignSelf: "center" }} />
          </>
        }
      >
        <Texto variante="corpo">Você deixa de receber avisos deste perfil. Os concursos que você acompanha continuam.</Texto>
      </Folha>
    </Tela>
  );
}

function Bloco({ titulo, texto, children }: { titulo: string; texto?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10, marginTop: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Texto variante="h2">{titulo}</Texto>
        {texto ? <Texto variante="pequeno">{texto}</Texto> : null}
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  ativo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  rodape: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    backgroundColor: cores.papel,
  },
});
