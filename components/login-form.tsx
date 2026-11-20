"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { Bola } from "@/components/tema/ilustracoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar } from "@/lib/actions/auth";

export function LoginForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const res = await entrar(email, senha);
    if (res.success) {
      router.replace(destino);
      router.refresh();
    } else {
      setErro(res.error);
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-border hero-estadio p-6 animate-pop-in">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <Bola size={52} className="animate-float" />
          </div>
          <h1 className="titulo-fc text-2xl">Login de gestão</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Qualquer um vê o site. Só a gestão edita.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoFocus
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>

          {erro && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {erro}
            </p>
          )}

          <Button type="submit" disabled={enviando} size="lg" className="w-full font-bold">
            <LogIn className="h-4 w-4" />
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
