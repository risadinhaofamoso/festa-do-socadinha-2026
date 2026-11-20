"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Trophy,
  IdCard,
  CalendarDays,
  Vote,
  Shuffle,
  UserPlus,
  Menu,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Bola } from "@/components/tema/ilustracoes";
import { sair } from "@/lib/actions/auth";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; admin?: boolean };

const ITEMS: Item[] = [
  { href: "/", label: "Tabela", icon: Trophy },
  { href: "/jogadores", label: "Jogadores", icon: IdCard },
  { href: "/partidas", label: "Partidas", icon: CalendarDays },
  { href: "/votar", label: "Votar", icon: Vote },
  { href: "/gerar", label: "Gerar Times", icon: Shuffle, admin: true },
  { href: "/usuarios", label: "Cadastrar", icon: UserPlus, admin: true },
];

function ehAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar({ isAdmin, adminNome }: { isAdmin: boolean; adminNome: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);

  if (pathname.startsWith("/login")) return null;

  const itens = ITEMS.filter((i) => !i.admin || isAdmin);

  async function handleSair() {
    setSaindo(true);
    await sair();
    setAberto(false);
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 vidro border-b border-border/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group" onClick={() => setAberto(false)}>
            <Bola size={32} className="shrink-0 transition-transform group-hover:rotate-180 duration-700" />
            <span className="font-display text-2xl font-extrabold tracking-tight leading-none">
              <span className="text-foreground">FUT</span>
              <span className="text-[var(--neon-green)]">·</span>
              <span className="text-[var(--neon-green)]">SD</span>
            </span>
          </Link>

          {/* Links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {itens.map((item) => {
              const ativo = ehAtivo(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold font-display uppercase tracking-wide transition-colors",
                    ativo
                      ? "text-[var(--neon-green)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {ativo && (
                    <span className="absolute -bottom-[1px] left-2 right-2 h-0.5 rounded-full bg-[var(--neon-green)] shadow-[0_0_10px_var(--neon-green)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Ações (desktop) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isAdmin ? (
              <>
                <span
                  className="flex items-center gap-1.5 rounded-full border border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 px-3 py-1 text-xs font-bold text-[var(--neon-green)]"
                  title={adminNome ?? "Gestão"}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Gestão
                </span>
                <button
                  onClick={handleSair}
                  disabled={saindo}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
            )}
          </div>

          {/* Botão mobile */}
          <button
            onClick={() => setAberto((v) => !v)}
            className="md:hidden rounded-lg p-2 hover:bg-accent transition-colors"
            aria-label="Menu"
          >
            {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Painel mobile */}
      {aberto && (
        <div className="md:hidden border-t border-border/70 vidro animate-fade-up">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-1">
            {itens.map((item) => {
              const ativo = ehAtivo(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold font-display uppercase tracking-wide transition-colors",
                    ativo
                      ? "bg-[var(--neon-green)]/12 text-[var(--neon-green)]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-border/60">
              {isAdmin ? (
                <button
                  onClick={handleSair}
                  disabled={saindo}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sair da gestão
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setAberto(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" /> Entrar como gestão
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
