import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

/**
 * O mesmo schema roda em dois lugares:
 *
 * - **No notebook**: banco em arquivo (`prisma/dev.db`). Funciona sem internet,
 *   que é o que importa no dia da festa se o Wi-Fi do salão cair.
 * - **Na Vercel**: banco no Turso, via adaptador libSQL. O disco da Vercel é
 *   descartável, então arquivo local não serve lá.
 *
 * A escolha é feita pela presença de `TURSO_DATABASE_URL`. Sem ela, é arquivo.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function criarPrisma() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const log = process.env.NODE_ENV === "development" ? (["error", "warn"] as const) : (["error"] as const);

  if (url) {
    const libsql = createClient({ url, authToken });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql), log: [...log] });
  }

  return new PrismaClient({ log: [...log] });
}

export const prisma = globalForPrisma.prisma ?? criarPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Onde os dados estão agora — usado no rodapé da barra lateral e no guia de deploy. */
export const usandoTurso = Boolean(process.env.TURSO_DATABASE_URL);
