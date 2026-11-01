import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS da API do app (/api/v1/*). O app nativo não precisa de CORS; isto existe para o app
 * rodando no navegador (Expo web / PWA) em outra origem.
 * Origens permitidas: CORS_ORIGINS (separadas por vírgula). Padrão: http://localhost:8081 (Expo web em dev).
 */
const ORIGENS = (process.env.CORS_ORIGINS ?? "http://localhost:8081")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CABECALHOS_CORS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "600",
};

export function proxy(req: NextRequest) {
  const origem = req.headers.get("origin") ?? "";
  const permitida = ORIGENS.includes(origem);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: permitida ? { "Access-Control-Allow-Origin": origem, Vary: "Origin", ...CABECALHOS_CORS } : { Vary: "Origin" },
    });
  }

  const res = NextResponse.next();
  res.headers.append("Vary", "Origin");
  if (permitida) {
    res.headers.set("Access-Control-Allow-Origin", origem);
    for (const [k, v] of Object.entries(CABECALHOS_CORS)) res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: "/api/v1/:path*",
};
