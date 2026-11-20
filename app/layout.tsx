import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Saira_Condensed } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { sessaoAtual } from "@/lib/sessao";

const fontSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fontDisplay = Saira_Condensed({
  variable: "--font-display-saira",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FUT-SD · Futebol de Quarta",
  description:
    "O app do nosso futebol de quarta: tabela do ano, cartas estilo FIFA, geração de times e votação do craque da partida.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  const isAdmin = sessao !== null;

  return (
    <html
      lang="pt-BR"
      className={`dark ${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar isAdmin={isAdmin} adminNome={sessao?.nome ?? sessao?.email ?? null} />
        <main className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8">
          {children}
        </main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          <p className="font-display tracking-wide">FUT-SD · FUTEBOL DE QUARTA · 2026</p>
          <p className="mt-1 opacity-70">Tabela, cartas e craque da partida — feito pra galera.</p>
        </footer>
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}
