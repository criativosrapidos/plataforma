// Converte dist-demo/index.html no formato de página publicável (sem <html>/<head>/<body>).
import { readFileSync, writeFileSync } from "node:fs";

const [entrada = "dist-demo/index.html", saida = "dist-demo/criativos-rapidos.html"] = process.argv.slice(2);
const html = readFileSync(entrada, "utf8");
let head = html.match(/<head>([\s\S]*)<\/head>/)[1].replace(/<meta[^>]*>\s*/g, "");
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
const titulo = head.match(/<title>[\s\S]*?<\/title>/)[0];
head = head.replace(titulo, "");
writeFileSync(saida, `${titulo}\n${head.trim()}\n${body.trim()}\n`);
console.log(`ok: ${saida}`);
