"use server";

import { cookies } from "next/headers";
import {
  COOKIE_SESSAO,
  DURACAO_SESSAO_SEGUNDOS,
  comparaSeguro,
  configAcesso,
  gerarTokenSessao,
} from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/config";

export async function entrar(senha: string): Promise<ActionResult> {
  const acesso = configAcesso();
  if (!acesso.protegido) {
    return { success: true, data: undefined };
  }

  const informada = senha.trim();
  if (!informada) {
    return { success: false, error: "Digite a senha." };
  }

  if (!comparaSeguro(informada, acesso.senha)) {
    return { success: false, error: "Senha incorreta." };
  }

  const token = await gerarTokenSessao(acesso.senha, acesso.segredo);
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

/** Usado pela barra lateral para só mostrar o botão "Sair" quando faz sentido. */
export async function siteProtegido() {
  return configAcesso().protegido;
}
