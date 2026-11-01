import { deflateRawSync, inflateRawSync } from "node:zlib";

/** Entrada de um .zip. */
export interface EntradaZip {
  nome: string;
  conteudo: Buffer;
}

/**
 * Leitor mínimo de ZIP (métodos "stored" e "deflate", sem ZIP64), suficiente para os pacotes diários do INLABS.
 * Evita dependência externa.
 */
export function lerZip(buf: Buffer): EntradaZip[] {
  // End of Central Directory: assinatura 0x06054b50, nos últimos 64 KB.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("zip: arquivo inválido (sem diretório central)");
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const saida: EntradaZip[] = [];
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("zip: diretório central corrompido");
    const metodo = buf.readUInt16LE(p + 10);
    const tamComprimido = buf.readUInt32LE(p + 20);
    const tamNome = buf.readUInt16LE(p + 28);
    const tamExtra = buf.readUInt16LE(p + 30);
    const tamComentario = buf.readUInt16LE(p + 32);
    const offsetLocal = buf.readUInt32LE(p + 42);
    const nome = buf.subarray(p + 46, p + 46 + tamNome).toString("utf8");
    p += 46 + tamNome + tamExtra + tamComentario;
    if (nome.endsWith("/")) continue; // pasta
    if (buf.readUInt32LE(offsetLocal) !== 0x04034b50) throw new Error(`zip: cabeçalho local inválido em ${nome}`);
    const inicio = offsetLocal + 30 + buf.readUInt16LE(offsetLocal + 26) + buf.readUInt16LE(offsetLocal + 28);
    const dados = buf.subarray(inicio, inicio + tamComprimido);
    if (metodo === 0) saida.push({ nome, conteudo: Buffer.from(dados) });
    else if (metodo === 8) saida.push({ nome, conteudo: inflateRawSync(dados) });
    else throw new Error(`zip: método de compressão ${metodo} não suportado (${nome})`);
  }
  return saida;
}

/** Gera um ZIP (deflate) — usado nos testes e para empacotar fixtures. */
export function criarZip(entradas: { nome: string; conteudo: string | Buffer }[]): Buffer {
  const locais: Buffer[] = [];
  const centrais: Buffer[] = [];
  let offset = 0;
  for (const e of entradas) {
    const dados = Buffer.isBuffer(e.conteudo) ? e.conteudo : Buffer.from(e.conteudo, "utf8");
    const comprimido = deflateRawSync(dados);
    const nome = Buffer.from(e.nome, "utf8");
    const crc = crc32(dados);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nome.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(nome.length, 28);
    central.writeUInt32LE(offset, 42);
    locais.push(local, nome, comprimido);
    centrais.push(central, nome);
    offset += local.length + nome.length + comprimido.length;
  }
  const dirCentral = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(entradas.length, 8);
  fim.writeUInt16LE(entradas.length, 10);
  fim.writeUInt32LE(dirCentral.length, 12);
  fim.writeUInt32LE(offset, 16);
  return Buffer.concat([...locais, dirCentral, fim]);
}

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
