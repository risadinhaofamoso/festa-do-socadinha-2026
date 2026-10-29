"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Bola } from "@/components/tema/ilustracoes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { entrar } from "@/lib/actions/auth";

export function LoginForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const res = await entrar(senha);
    if (res.success) {
      router.replace(destino);
      router.refresh();
    } else {
      setErro(res.error);
      setSenha("");
      setEnviando(false);
    }
  }

  return (
    <Card className="w-full max-w-sm animate-pop-in">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Bola size={44} className="animate-spin-slow" />
        </div>
        <CardTitle className="texto-neon text-xl">FUT-SD · Futebol de Quarta</CardTitle>
        <CardDescription>Digite a senha para acessar o painel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {erro}
            </p>
          )}

          <Button type="submit" disabled={enviando} className="w-full">
            <Lock className="h-4 w-4" />
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
