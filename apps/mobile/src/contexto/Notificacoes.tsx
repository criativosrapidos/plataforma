// Push: pede permissão só depois do 1º concurso salvo (com uma explicação antes do pedido do sistema),
// registra o aparelho e abre o concurso quando a pessoa toca na notificação.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarClock, FilePenLine, Megaphone } from "lucide-react-native";
import { chaves } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { Folha } from "@/componentes/Folha";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { CHAVES, gravar, ler } from "@/lib/armazenamento";
import {
  configurarNotificacoes,
  desregistrarAparelho,
  destinoDaNotificacao,
  estadoPermissao,
  pedirPermissao,
  PUSH_DISPONIVEL,
  registrarAparelho,
} from "@/lib/push";
import { cores } from "@/tema";
import { useSessao } from "./Sessao";

interface Ctx {
  /** Chamar depois de acompanhar um concurso. Mostra a explicação se ainda não perguntamos. */
  talvezPedirPermissao: () => Promise<void>;
  /** Pedido explícito (Ajustes). */
  abrirExplicacao: () => void;
}

const Contexto = createContext<Ctx>({ talvezPedirPermissao: async () => {}, abrirExplicacao: () => {} });
export const useNotificacoes = () => useContext(Contexto);

const ESPERA_REPERGUNTAR = 3 * 86_400_000;

export function ProvedorNotificacoes({ children }: { children: ReactNode }) {
  const { etapa, registrarAoSair } = useSessao();
  const qc = useQueryClient();
  const toast = useToast();
  const [explicacao, setExplicacao] = useState(false);
  const pendente = useRef<string | null>(null);
  const etapaAtual = useRef(etapa);
  useEffect(() => {
    etapaAtual.current = etapa;
  }, [etapa]);

  useEffect(() => {
    configurarNotificacoes();
    registrarAoSair(desregistrarAparelho);
  }, [registrarAoSair]);

  // Já tinha permissão (reinstalou, trocou de conta): registra de novo em silêncio.
  useEffect(() => {
    if (etapa !== "app" || !PUSH_DISPONIVEL) return;
    void estadoPermissao().then((e) => {
      if (e === "permitido") void registrarAparelho();
    });
  }, [etapa]);

  // Toque na notificação → tela do concurso (espera o app estar liberado).
  useEffect(() => {
    if (!PUSH_DISPONIVEL) return;
    const abrir = (r: Notifications.NotificationResponse) => {
      const destino = destinoDaNotificacao(r.notification.request.content.data);
      Notifications.clearLastNotificationResponse();
      if (!destino) return;
      if (etapaAtual.current === "app") router.push(destino);
      else pendente.current = destino;
    };
    const ultima = Notifications.getLastNotificationResponse();
    if (ultima) abrir(ultima);
    const sub = Notifications.addNotificationResponseReceivedListener(abrir);
    // Chegou aviso com o app aberto: atualiza Hoje, a caixa de avisos e o contador do sino.
    const sub2 = Notifications.addNotificationReceivedListener(() => {
      void qc.invalidateQueries({ queryKey: chaves.hoje });
      void qc.invalidateQueries({ queryKey: chaves.avisos });
      void qc.invalidateQueries({ queryKey: chaves.me });
    });
    return () => {
      sub.remove();
      sub2.remove();
    };
  }, [qc]);

  useEffect(() => {
    if (etapa !== "app" || !pendente.current) return;
    const destino = pendente.current;
    pendente.current = null;
    const t = setTimeout(() => router.push(destino as `/concurso/${string}`), 350);
    return () => clearTimeout(t);
  }, [etapa]);

  const talvezPedirPermissao = useCallback(async () => {
    if (!PUSH_DISPONIVEL) return;
    const e = await estadoPermissao();
    if (e === "permitido") {
      void registrarAparelho();
      return;
    }
    if (e !== "nao_perguntado") return;
    const ultima = Number((await ler(CHAVES.pushPerguntadoEm)) ?? 0);
    if (Date.now() - ultima < ESPERA_REPERGUNTAR) return;
    setTimeout(() => setExplicacao(true), 700);
  }, []);

  const ativar = useCallback(async () => {
    setExplicacao(false);
    await gravar(CHAVES.pushPerguntadoEm, String(Date.now()));
    const ok = await pedirPermissao();
    if (ok) toast.mostrar("Pronto. Saiu prazo ou errata, você fica sabendo na hora.");
    else toast.mostrar("Sem notificação, os avisos ficam só no sino do app.", "info");
  }, [toast]);

  const agoraNao = useCallback(async () => {
    setExplicacao(false);
    await gravar(CHAVES.pushPerguntadoEm, String(Date.now()));
  }, []);

  const valor = useMemo(() => ({ talvezPedirPermissao, abrirExplicacao: () => setExplicacao(true) }), [talvezPedirPermissao]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Folha
        visivel={explicacao}
        aoFechar={agoraNao}
        testID="folha-push"
        rodape={
          <>
            <Botao titulo="Ativar notificações" icone={BellRing} tamanho="g" bloco onPress={ativar} />
            <Botao titulo="Agora não" variante="fantasma" bloco onPress={agoraNao} style={{ alignSelf: "center" }} />
          </>
        }
      >
        <View style={s.selo}>
          <BellRing size={30} color={cores.azul} strokeWidth={2.2} />
        </View>
        <Texto variante="tituloMedio" centro>
          Quer saber na hora?
        </Texto>
        <Texto variante="corpo" centro cor={cores.tx2}>
          O aviso chega no celular assim que sai no diário oficial. Nada de propaganda: só o que muda a sua data.
        </Texto>
        <View style={s.lista}>
          <Item icone={Megaphone} texto="Edital publicado no seu perfil" />
          <Item icone={CalendarClock} texto="Isenção e inscrição acabando" />
          <Item icone={FilePenLine} texto="Errata: o que mudou e a data nova" />
        </View>
      </Folha>
    </Contexto.Provider>
  );
}

function Item({ icone: Icone, texto }: { icone: typeof BellRing; texto: string }) {
  return (
    <View style={s.item}>
      <View style={s.itemIcone}>
        <Icone size={18} color={cores.azul} strokeWidth={2.3} />
      </View>
      <Texto variante="corpoForte" style={{ flex: 1, fontSize: 14.5 }}>
        {texto}
      </Texto>
    </View>
  );
}

const s = StyleSheet.create({
  selo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: cores.azulT,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  lista: { backgroundColor: cores.branco, borderRadius: 18, borderWidth: 1, borderColor: cores.linha, padding: 14, gap: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemIcone: { width: 34, height: 34, borderRadius: 10, backgroundColor: cores.azulT, alignItems: "center", justifyContent: "center" },
});
