/**
 * Sessão de administrador (login de gestão).
 *
 * Qualquer pessoa acessa e vê o site. Para **editar** (cadastrar jogador,
 * lançar partida, apurar votação…) é preciso estar logado com um login de
 * gestão — os administradores do grupo.
 *
 * A sessão é um cookie assinado: `base64url(payload).HMAC`. O payload diz quem
 * é o admin (id + e-mail) e quando a sessão começou. Sem o segredo do servidor
 * não dá para forjar o cookie, e a senha nunca vai para o navegador.
 *
 * Usa Web Crypto (não o `crypto` do Node) para funcionar tanto no runtime Node
 * quanto no Edge.
 */

export const COOKIE_SESSAO = "futsd_sessao";
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30; // 30 dias

export type SessaoPayload = {
  sub: number; // id do admin
  email: string;
  nome?: string | null;
  iat: number; // emitido em (segundos)
};

function segredo(): string {
  const s = process.env.SESSION_SECRET?.trim();
  // Em produção, defina SESSION_SECRET. O fallback deixa o login funcionar em
  // desenvolvimento sem configuração.
  return s && s.length >= 8 ? s : "futsd-dev-secret-troque-em-producao-por-favor";
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(texto: string): Uint8Array {
  let s = texto.replace(/-/g, "+").replace(/_/g, "/");
  const resto = s.length % 4;
  if (resto) s += "=".repeat(4 - resto);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacHex(mensagem: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(mensagem));
  return toHex(assinatura);
}

/** Comparação em tempo constante, para não vazar informação pelo tempo. */
export function comparaSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

/** Gera o token de sessão assinado para um admin. */
export async function assinarSessao(payload: SessaoPayload): Promise<string> {
  const corpo = toB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const assinatura = await hmacHex(corpo);
  return `${corpo}.${assinatura}`;
}

/** Valida o token do cookie e devolve o payload, ou null se for inválido/expirado. */
export async function lerSessao(token?: string | null): Promise<SessaoPayload | null> {
  if (!token) return null;
  const corte = token.lastIndexOf(".");
  if (corte <= 0) return null;
  const corpo = token.slice(0, corte);
  const assinatura = token.slice(corte + 1);

  const esperada = await hmacHex(corpo);
  if (!comparaSeguro(assinatura, esperada)) return null;

  try {
    const json = new TextDecoder().decode(fromB64url(corpo));
    const p = JSON.parse(json) as SessaoPayload;
    if (typeof p?.sub !== "number" || typeof p?.email !== "string" || typeof p?.iat !== "number") {
      return null;
    }
    if (Date.now() / 1000 - p.iat > DURACAO_SESSAO_SEGUNDOS) return null;
    return p;
  } catch {
    return null;
  }
}
