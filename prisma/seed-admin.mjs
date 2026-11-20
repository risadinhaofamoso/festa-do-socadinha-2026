// Cria/atualiza o login de gestão (admin). Rode: node prisma/seed-admin.mjs
// Uso: EMAIL=... SENHA=... node prisma/seed-admin.mjs  (tem padrão abaixo)
import { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashSenha(senha) {
  const salt = randomBytes(16).toString("hex");
  const derivada = await scryptAsync(senha, salt, 64);
  return `scrypt$${salt}$${derivada.toString("hex")}`;
}

async function main() {
  const email = (process.env.EMAIL ?? "leonardo.cunha0905@gmail.com").trim().toLowerCase();
  const senha = process.env.SENHA ?? "FutSD@2026";
  const nome = process.env.NOME ?? "Leonardo Cunha";

  const passwordHash = await hashSenha(senha);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name: nome },
    create: { email, name: nome, passwordHash },
  });

  console.log(`Admin pronto: ${email} (senha definida).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
