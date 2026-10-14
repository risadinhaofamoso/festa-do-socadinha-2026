import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, comparaSeguro, configAcesso, gerarTokenSessao } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const acesso = configAcesso();

  // Sem senha configurada (uso local no notebook), o site fica aberto.
  if (!acesso.protegido) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login")) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE_SESSAO)?.value;
  const esperado = await gerarTokenSessao(acesso.senha, acesso.segredo);

  if (cookie && comparaSeguro(cookie, esperado)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  // Guarda para onde a pessoa queria ir, para voltar lá depois de entrar.
  url.searchParams.set("destino", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Protege tudo, menos os arquivos internos do Next e o favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
