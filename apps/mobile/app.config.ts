import type { ConfigContext, ExpoConfig } from "expo/config";

// Identidade
const PAPEL = "#F5F6F1";
const AZUL = "#1F3FD1";
const BUNDLE_ID = "br.com.avisoconcurso.app";

// Preenchido pelo `eas init` (ou defina EAS_PROJECT_ID). Necessário para o token de push (Expo Push Service).
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;
// FCM (push no Android): no EAS, crie a variável de arquivo GOOGLE_SERVICES_JSON com o google-services.json.
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Aviso Concurso",
  slug: "aviso-concurso",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "avisoconcurso",
  userInterfaceStyle: "light",
  backgroundColor: PAPEL,
  primaryColor: AZUL,
  description: "Avisa editais, prazos e provas dos concursos do seu perfil e junta tudo numa agenda só.",
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: "pt-BR",
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: PAPEL,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    ...(GOOGLE_SERVICES_JSON ? { googleServicesFile: GOOGLE_SERVICES_JSON } : {}),
  },
  web: {
    // SPA: um index.html para todas as rotas (sirva com fallback para index.html).
    output: "single",
    favicon: "./assets/images/favicon.png",
    name: "Aviso Concurso",
    shortName: "Aviso",
    lang: "pt-BR",
    themeColor: AZUL,
    backgroundColor: PAPEL,
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: PAPEL,
        image: "./assets/images/splash-icon.png",
        imageWidth: 112,
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: AZUL,
        defaultChannel: "avisos",
      },
    ],
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
  },
});
