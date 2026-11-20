/**
 * Helpers de servidor para ler a sessão do admin a partir do cookie.
 * Usado pelas páginas (para mostrar/esconder controles) e pelas Server Actions
 * (para bloquear edição de quem não está logado).
 */
import { cookies } from "next/headers";
import { COOKIE_SESSAO, lerSessao, type SessaoPayload } from "@/lib/auth";

export async function sessaoAtual(): Promise<SessaoPayload | null> {
  const token = cookies().get(COOKIE_SESSAO)?.value;
  return lerSessao(token);
}

export async function ehAdmin(): Promise<boolean> {
  return (await sessaoAtual()) !== null;
}

/**
 * Para usar no começo de uma Server Action de escrita:
 *   const bloqueio = await bloqueioAdmin();
 *   if (bloqueio) return bloqueio;
 * Devolve o erro pronto (compatível com qualquer ActionResult) ou null se OK.
 */
export async function bloqueioAdmin(): Promise<{ success: false; error: string } | null> {
  if (await ehAdmin()) return null;
  return { success: false, error: "Faça login de gestão para editar o site." };
}
