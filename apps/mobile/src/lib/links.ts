import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { cores } from "@/tema";

/** Abre um link externo (edital, banca, site) num navegador dentro do app. */
export async function abrirLink(url: string | null | undefined) {
  if (!url) return;
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: cores.papel,
      controlsColor: cores.azul,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch {
    await Linking.openURL(url);
  }
}
