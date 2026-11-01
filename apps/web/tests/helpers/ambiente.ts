// Ambiente dos testes. IMPORTE PRIMEIRO em cada arquivo de teste (antes de qualquer módulo que use o banco).
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { carregarEnv } from "../../scripts/env";

carregarEnv();

// Banco de teste separado: <banco>_test (ex.: aviso_pipe_test). Nunca roda no banco de desenvolvimento.
const url =
  process.env.TEST_DATABASE_URL ??
  (process.env.DATABASE_URL ?? "postgres://aviso:aviso@localhost:5432/aviso").replace(/\/([^/?]+)(\?.*)?$/, (_m, nome: string, q?: string) => `/${nome.endsWith("_test") ? nome : `${nome}_test`}${q ?? ""}`);
if (!/_test(\?|$)/.test(url)) throw new Error(`Testes só rodam em banco *_test (recebido ${url})`);
process.env.DATABASE_URL = url;

// Sem serviços externos: heurísticas no lugar da IA, e-mail no console, fetch simulado nos testes.
delete process.env.ANTHROPIC_API_KEY;
delete process.env.RESEND_API_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.AVISOS_MODO;
delete process.env.COLETA_FIXTURES_DIR;
delete process.env.EXPO_ACCESS_TOKEN;
process.env.WHATSAPP_TOKEN = "token-whatsapp-teste";
process.env.WHATSAPP_PHONE_ID = "1234567890";
process.env.ASAAS_WEBHOOK_TOKEN = "token-webhook-teste";
process.env.ASAAS_API_KEY = "chave-asaas-teste";
process.env.CRON_SECRET = "segredo-cron-teste";
process.env.AUTH_SECRET = process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16 ? process.env.AUTH_SECRET : "segredo-de-teste-com-mais-de-16-caracteres";
process.env.APP_URL = "https://avisoconcurso.com.br";
process.env.STORAGE_DIR = mkdtempSync(path.join(os.tmpdir(), "aviso-storage-"));
process.env.DB_POOL_MAX = "4";

export const FIXTURES = path.join(__dirname, "..", "fixtures");
