// Guarda o token e pequenas preferências. Celular: Keychain/Keystore (expo-secure-store).
// Web: localStorage (o SecureStore não existe no navegador).
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const web = Platform.OS === "web";

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function ler(chave: string): Promise<string | null> {
  try {
    if (web) return ls()?.getItem(chave) ?? null;
    return await SecureStore.getItemAsync(chave);
  } catch {
    return null;
  }
}

export async function gravar(chave: string, valor: string): Promise<void> {
  try {
    if (web) ls()?.setItem(chave, valor);
    else await SecureStore.setItemAsync(chave, valor);
  } catch {
    /* sem armazenamento: segue só em memória */
  }
}

export async function apagar(chave: string): Promise<void> {
  try {
    if (web) ls()?.removeItem(chave);
    else await SecureStore.deleteItemAsync(chave);
  } catch {
    /* nada a fazer */
  }
}

export const CHAVES = {
  token: "ac.token",
  perfilPulado: "ac.perfil_pulado",
  novoCadastro: "ac.novo_cadastro",
  pushPerguntadoEm: "ac.push_perguntado_em",
  pushToken: "ac.push_token",
} as const;
