/**
 * Proteção por senha única.
 *
 * O site não tem cadastro de usuários — é uma senha só, compartilhada por quem
 * organiza a festa. Isso existe porque o painel fica exposto na internet e
 * mostra nome, telefone e situação de pagamento dos convidados.
 *
 * Como funciona: ao acertar a senha, o navegador guarda um cookie cujo valor é
 * um HMAC gerado com um segredo que só o servidor conhece. Sem o segredo não dá
 * para forjar o cookie. A senha em si nunca vai para o navegador.
 *
 * Usa Web Crypto (e não o `crypto` do Node) porque o middleware roda no Edge.
 */

export const COOKIE_SESSAO = "festa_sessao";
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30; // 30 dias

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Valor esperado do cookie. Depende da senha e do segredo, então trocar
 * qualquer um dos dois derruba todas as sessões abertas.
 */
export async function gerarTokenSessao(senha: string, segredo: string) {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(`festa-socadinha:${senha}`)
  );
  return toHex(assinatura);
}

/** Comparação em tempo constante, para não vazar informação pelo tempo de resposta. */
export function comparaSeguro(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

/**
 * Lê a configuração de acesso do ambiente.
 *
 * Sem `SENHA_ACESSO` definida, o site roda **destrancado** — é o modo de uso
 * local no notebook, onde login só atrapalharia na portaria. Em produção a
 * variável é obrigatória (ver DEPLOY.md).
 */
export function configAcesso() {
  const senha = process.env.SENHA_ACESSO?.trim();
  const segredo = process.env.SESSION_SECRET?.trim();

  if (!senha) return { protegido: false as const };
  return {
    protegido: true as const,
    senha,
    // Se o segredo não for definido, deriva um a partir da própria senha.
    // Funciona, mas o ideal é definir SESSION_SECRET em produção.
    segredo: segredo && segredo.length > 0 ? segredo : `derivado:${senha}`,
  };
}
