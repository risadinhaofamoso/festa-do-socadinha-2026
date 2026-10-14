"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Armchair,
  Users,
  UserCheck,
  Wallet,
  Settings,
  PartyPopper,
  Gift,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Rosquinha } from "@/components/tema/ilustracoes";
import { sair } from "@/lib/actions/auth";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mapa", label: "Mapa do Salão", icon: Armchair },
  { href: "/convidados", label: "Convidados", icon: Users },
  { href: "/checkin", label: "Check-in", icon: UserCheck },
  { href: "/sorteio", label: "Sorteio", icon: Gift },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ protegido }: { protegido: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  // A tela de login não tem menu.
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
          <Rosquinha size={26} className="animate-spin-slow" />
          Festa 2026
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
            <Rosquinha size={32} className="animate-spin-slow shrink-0" />
            Festa 2026
          </div>
          <p className="text-xs text-muted-foreground pl-[42px] -mt-0.5">Tema: Simpsons</p>
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
          <PartyPopper className="h-3.5 w-3.5 animate-wiggle" />
          {protegido ? "Acesso protegido por senha" : "Uso local · SQLite"}
        </div>
      </aside>
    </>
  );
}
