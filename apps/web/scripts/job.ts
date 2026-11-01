// Roda um job agendado localmente (o mesmo código da rota /api/cron/<nome>).
// Uso: npx tsx scripts/job.ts <nome> [--data AAAA-MM-DD] [--fixtures tests/fixtures] [--agora 2026-11-02T09:00:00-03:00]
// Jobs: coletar-dou, coletar-bancas, coletar-municipais, processar, lembretes, cobrancas, push-receipts,
//       resumo-semanal, convocacoes, enviar-avisos.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { carregarEnv } from "./env";

// Os módulos do servidor importam "server-only"; fora do Next é preciso a condição react-server.
if (!process.env.__JOB_FILHO) {
  const r = spawnSync(process.execPath, [...process.execArgv, "--conditions=react-server", __filename, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, __JOB_FILHO: "1" },
  });
  process.exit(r.status ?? 1);
}

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  carregarEnv();
  const nome = process.argv[2];
  const fixtures = arg("fixtures");
  if (fixtures) process.env.COLETA_FIXTURES_DIR = path.resolve(fixtures);
  const { rodarJob, ehJob, JOBS } = await import("../src/lib/pipeline/jobs");
  if (!nome || !ehJob(nome)) {
    console.error(`Uso: npx tsx scripts/job.ts <${JOBS.join("|")}> [--data AAAA-MM-DD] [--fixtures dir] [--agora ISO]`);
    process.exit(2);
  }
  const agora = arg("agora") ? new Date(arg("agora")!) : undefined;
  const r = await rodarJob(nome, { data: arg("data"), agora });
  console.log(JSON.stringify(r, null, 2));
  const { sql } = await import("../src/lib/db");
  await sql.end();
  process.exit(r.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
