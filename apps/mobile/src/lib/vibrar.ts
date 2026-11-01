// Haptics nas ações. No navegador não há motor de vibração: vira no-op.
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const ativo = Platform.OS === "ios" || Platform.OS === "android";

const seguro = (f: () => Promise<void>) => {
  if (!ativo) return;
  f().catch(() => {});
};

export const vibrar = {
  /** Toque leve (botões, chips, abas). */
  toque: () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Mudança de seleção (segmentos, dias da semana). */
  selecao: () => seguro(() => Haptics.selectionAsync()),
  /** Ação concluída (acompanhar, marcar checklist, salvar). */
  sucesso: () => seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Algo deu errado. */
  erro: () => seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Ação de peso (excluir, deixar de acompanhar). */
  forte: () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
};
