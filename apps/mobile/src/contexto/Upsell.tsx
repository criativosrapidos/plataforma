// Recurso do plano Aprovado (403 sem_acesso): explica o que ganha e permite trocar de plano.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Crown } from "lucide-react-native";
import { brl, PLANO_INFO } from "@aviso/shared";
import { api } from "@/api/api";
import { mensagemDeErro } from "@/api/cliente";
import { chaves } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { Folha } from "@/componentes/Folha";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { LINKS } from "@/lib/config";
import { abrirLink } from "@/lib/links";
import { vibrar } from "@/lib/vibrar";
import { cores } from "@/tema";
import { useSessao } from "./Sessao";

const Contexto = createContext<{ abrirUpsell: (motivo?: string) => void }>({ abrirUpsell: () => {} });
export const useUpsell = () => useContext(Contexto);

export function ProvedorUpsell({ children }: { children: ReactNode }) {
  const { me } = useSessao();
  const qc = useQueryClient();
  const toast = useToast();
  const [motivo, setMotivo] = useState<string | null>(null);
  const ciclo = me?.assinatura?.ciclo ?? "mensal";
  const info = PLANO_INFO.aprovado;

  const trocar = useMutation({
    mutationFn: () => api.trocarPlano("aprovado", ciclo),
    onSuccess: async () => {
      vibrar.sucesso();
      await qc.invalidateQueries({ queryKey: chaves.me });
      setMotivo(null);
      toast.mostrar("Pronto: você está no plano Aprovado.");
    },
    onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
  });

  const abrirUpsell = useCallback((m?: string) => setMotivo(m ?? "Este recurso faz parte do plano Aprovado."), []);
  const valor = useMemo(() => ({ abrirUpsell }), [abrirUpsell]);
  const preco = ciclo === "anual" ? `${brl(info.precoAnualCentavos)} por ano` : `${brl(info.precoMensalCentavos)} por mês`;

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Folha
        visivel={motivo !== null}
        aoFechar={() => setMotivo(null)}
        testID="folha-upsell"
        rodape={
          <>
            <Botao
              titulo="Mudar para o Aprovado"
              variante="marca"
              tamanho="g"
              bloco
              icone={Crown}
              carregando={trocar.isPending}
              onPress={() => (me?.assinatura ? trocar.mutate() : void abrirLink(LINKS.assinatura))}
            />
            <Botao titulo="Agora não" variante="fantasma" onPress={() => setMotivo(null)} style={{ alignSelf: "center" }} />
          </>
        }
      >
        <View style={s.selo}>
          <Crown size={28} color={cores.tinta} strokeWidth={2.2} />
        </View>
        <Texto variante="tituloMedio" centro>
          Plano Aprovado
        </Texto>
        <Texto variante="corpo" centro cor={cores.tx2}>
          {motivo}
        </Texto>
        <View style={s.lista}>
          {info.inclui.map((item) => (
            <View key={item} style={s.item}>
              <Check size={18} color={cores.verdeTexto} strokeWidth={3} />
              <Texto variante="corpo" style={{ flex: 1, fontSize: 14.5 }}>
                {item}
              </Texto>
            </View>
          ))}
        </View>
        <Texto variante="meta" centro>
          {preco}. A diferença entra na próxima cobrança; você pode voltar para o Aviso quando quiser.
        </Texto>
      </Folha>
    </Contexto.Provider>
  );
}

const s = StyleSheet.create({
  selo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: cores.marca,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  lista: { backgroundColor: cores.branco, borderRadius: 18, borderWidth: 1, borderColor: cores.linha, padding: 14, gap: 10 },
  item: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
});
