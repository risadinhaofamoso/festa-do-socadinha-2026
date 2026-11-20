/**
 * Hash de senha dos administradores, usando scrypt do Node (sem dependência
 * externa). Roda só no servidor (Server Actions, runtime Node) — nunca no Edge
 * nem no cliente. O formato guardado é `scrypt$<salt>$<hash>`.
 */
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const TAMANHO = 64;

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivada = (await scryptAsync(senha, salt, TAMANHO)) as Buffer;
  return `scrypt$${salt}$${derivada.toString("hex")}`;
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  const partes = hash.split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  const [, salt, armazenada] = partes;
  const esperada = Buffer.from(armazenada, "hex");
  const derivada = (await scryptAsync(senha, salt, TAMANHO)) as Buffer;
  if (esperada.length !== derivada.length) return false;
  return timingSafeEqual(esperada, derivada);
}
