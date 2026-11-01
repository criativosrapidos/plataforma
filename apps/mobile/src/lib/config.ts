// Endereços do backend. EXPO_PUBLIC_* é embutido no bundle na hora do build.
const semBarra = (u: string) => u.replace(/\/+$/, "");

/** API /api/v1. Dev: http://localhost:3004 · Produção: https://avisoconcurso.com.br */
export const API_URL = semBarra(process.env.EXPO_PUBLIC_API_URL || "http://localhost:3004");

/** Site (assinatura, termos, privacidade). */
export const SITE_URL = semBarra(process.env.EXPO_PUBLIC_SITE_URL || API_URL);

export const LINKS = {
  assinatura: `${SITE_URL}/conta/assinatura`,
  termos: `${SITE_URL}/termos`,
  privacidade: `${SITE_URL}/privacidade`,
  ajuda: `${SITE_URL}/ajuda`,
};
