"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESSAO, DURACAO_SESSAO_SEGUNDOS, assinarSessao } from "@/lib/auth";
import { conferirSenha } from "@/lib/senha";
import type { ActionResult } from "@/lib/action-result";

/** Login de gestão: confere e-mail + senha contra a tabela de admins. */
export async function entrar(email: string, senha: string): Promise<ActionResult> {
  const mail = (email ?? "").trim().toLowerCase();
  const pass = senha ?? "";
  if (!mail || !pass) return { success: false, error: "Informe e-mail e senha." };

  const admin = await prisma.admin.findUnique({ where: { email: mail } });
  // Confere a senha mesmo quando o e-mail não existe, para não revelar
  // (pelo tempo de resposta) se um e-mail está ou não cadastrado.
  const senhaOk = admin
    ? await conferirSenha(pass, admin.passwordHash)
    : await conferirSenha(pass, "scrypt$00$00");

  if (!admin || !senhaOk) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  const token = await assinarSessao({
    sub: admin.id,
    email: admin.email,
    nome: admin.name,
    iat: Math.floor(Date.now() / 1000),
  });

  cookies().set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  });

  return { success: true, data: undefined };
}

export async function sair(): Promise<ActionResult> {
  cookies().delete(COOKIE_SESSAO);
  return { success: true, data: undefined };
}
