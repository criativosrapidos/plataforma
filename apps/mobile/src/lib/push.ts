// Notificações push (Expo Notifications → APNs/FCM). Só no celular: no navegador nada disso roda.
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { api } from "@/api/api";
import { apagar, CHAVES, gravar, ler } from "./armazenamento";
import { cores } from "@/tema";

export const PUSH_DISPONIVEL = Platform.OS === "ios" || Platform.OS === "android";

/** Canal do Android (o backend manda channelId "avisos"; o plugin também o define como padrão). */
export const CANAL = "avisos";

let configurado = false;

export function configurarNotificacoes() {
  if (!PUSH_DISPONIVEL || configurado) return;
  configurado = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync(CANAL, {
      name: "Avisos de concursos",
      description: "Edital publicado, prazo acabando, errata, local de prova e resultado.",
      importance: AndroidImportance.HIGH,
      lightColor: cores.azul,
      vibrationPattern: [0, 180, 120, 180],
    });
  }
}

export type EstadoPermissao = "permitido" | "negado" | "nao_perguntado" | "indisponivel";

export async function estadoPermissao(): Promise<EstadoPermissao> {
  if (!PUSH_DISPONIVEL) return "indisponivel";
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return "permitido";
  return p.canAskAgain ? "nao_perguntado" : "negado";
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

/** Pega o token Expo do aparelho e registra em POST /api/v1/dispositivos. */
export async function registrarAparelho(): Promise<string | null> {
  if (!PUSH_DISPONIVEL || !Device.isDevice) return null;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    const anterior = await ler(CHAVES.pushToken);
    await api.registrarDispositivo(token, Platform.OS as "ios" | "android");
    if (anterior !== token) await gravar(CHAVES.pushToken, token);
    return token;
  } catch (e) {
    // Sem projectId do EAS (dev sem `eas init`) ou sem Google Services no Android.
    console.warn("[push] não foi possível registrar o aparelho:", (e as Error)?.message);
    return null;
  }
}

/** Pede a permissão do sistema (depois da explicação) e registra o aparelho. */
export async function pedirPermissao(): Promise<boolean> {
  if (!PUSH_DISPONIVEL) return false;
  const r = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  if (!r.granted) return false;
  await registrarAparelho();
  return true;
}

/** Ao sair da conta: o aparelho para de receber avisos desta pessoa. */
export async function desregistrarAparelho() {
  const token = await ler(CHAVES.pushToken);
  if (!token) return;
  try {
    await api.removerDispositivo(token);
  } finally {
    await apagar(CHAVES.pushToken);
  }
}

/**
 * Para onde a notificação leva. O backend manda em `data`:
 *   { contest_id: "<uuid>" }  ou  { url: "avisoconcurso://concurso/<id>" }  ou  { url: "avisoconcurso://avisos" }
 */
export function destinoDaNotificacao(data: unknown): `/concurso/${string}` | "/avisos" | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const url = typeof d.url === "string" ? d.url : "";
  const m = url.match(/concurso\/([\w-]+)/);
  if (m) return `/concurso/${m[1]}`;
  const id = d.contest_id ?? d.contestId;
  if (typeof id === "string" && id) return `/concurso/${id}`;
  if (/avisos/.test(url)) return "/avisos";
  return null;
}
