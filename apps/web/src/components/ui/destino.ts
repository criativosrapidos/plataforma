/** Aceita só caminhos internos ("/conta", "/assinar?plano=x"), nunca "//site.com" ou URLs absolutas. */
export function destinoSeguro(v: string | string[] | null | undefined, padrao = "/conta"): string {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s || !s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return padrao;
  return s;
}

/** Lê um parâmetro de busca como string simples. */
export function param(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}
