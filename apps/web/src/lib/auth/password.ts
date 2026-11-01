import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (s: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const h = await scrypt(senha, salt, 64);
  return `scrypt$${salt.toString("base64")}$${h.toString("base64")}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [alg, saltB64, hB64] = armazenado.split("$");
  if (alg !== "scrypt" || !saltB64 || !hB64) return false;
  const esperado = Buffer.from(hB64, "base64");
  const h = await scrypt(senha, Buffer.from(saltB64, "base64"), esperado.length);
  return timingSafeEqual(h, esperado);
}
