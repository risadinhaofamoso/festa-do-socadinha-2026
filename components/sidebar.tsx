"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  IdCard,
  Shuffle,
  CalendarDays,
  UserPlus,
  Vote,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bola } from "@/components/tema/ilustracoes";
import { sair } from "@/lib/actions/auth";

const ITEMS = [
  { href: "/", label: "Tabela Geral", icon: Trophy },
  { href: "/jogadores", label: "Jogadores", icon: IdCard },
  { href: "/gerar", label: "Gerar Times", icon: Shuffle },
  { href: "/partidas", label: "Partidas", icon: CalendarDays },
  { href: "/votar", label: "Votação", icon: Vote },
  { href: "/usuarios", label: "Cadastrar", icon: UserPlus },
];

export function Sidebar({ protegido }: { protegido: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  // A tela de login nao tem menu.
  if (pathname.startsWith("/login")) return null;

  async function handleSair() {
    await sair();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <div className="md:hidden flex items-center justify-between border-b p-3 sticky top-0 bg-background z-40">
        <div className="flex items-center gap-2 font-semibold">
          <Bola size={26} className="animate-spin-slow" />
          FUT-SD
        </div>
        <button
          onClick={() => setAberto((v) => !v)}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <aside
        className={cn(
          "border-r bg-card md:w-60 md:flex md:flex-col md:sticky md:top-0 md:h-screen shrink-0",
          aberto ? "block w-full" : "hidden md:flex"
        )}
      >
        <div className="hidden md:flex flex-col gap-1 px-5 py-5">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <Bola size={32} className="animate-spin-slow shrink-0" />
            FUT-SD
          </div>
          <p className="text-xs text-muted-foreground pl-[42px] -mt-0.5">Futebol de quarta · 2026</p>
        </div>
        <nav className="flex-1 px-3 py-2 md:py-0 flex flex-col gap-1">
          {ITEMS.map((item, i) => {
            const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                style={{ animationDelay: `${i * 45}ms` }}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium animate-fade-up",
                  "transition-all duration-200 hover:translate-x-1",
                  ativo
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-125",
                    ativo && "group-hover:rotate-12"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {protegido && (
          <div className="px-3 pb-2">
            <button
              onClick={handleSair}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </div>
        )}
        <div className="px-5 py-4 text-xs text-muted-foreground border-t flex items-center gap-2">
          <Bola className="h-3.5 w-3.5" />
          {protegido ? "Acesso protegido por senha" : "Bola rolando ⚽"}
        </div>
      </aside>
    </>
  );
}
