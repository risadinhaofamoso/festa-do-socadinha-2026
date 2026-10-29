import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";
import { configAcesso } from "@/lib/auth";

const fontSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FUT-SD · Futebol de Quarta",
  description: "Tabela, cartinhas, geração de times e votação do nosso futebol de quarta-feira",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground">
        <Sidebar protegido={configAcesso().protegido} />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
