"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Vote, Trophy, Check } from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { Confete } from "@/components/tema/confete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatarData } from "@/lib/format";
import type { Time } from "@/lib/types";
import { registrarVoto } from "@/lib/actions/votacao";

type JogadorVoto = { id: number; nome: string; foto: string | null };
type TimeVoto = { team: Time; jogadores: JogadorVoto[] };
export type PartidaVoto = { id: number; number: number; data: string; times: TimeVoto[] };

export function VotacaoClient({ partidas }: { partidas: PartidaVoto[] }) {
  const router = useRouter();
  const [enviando, start] = useTransition();
  const [selecionado, setSelecionado] = useState<{
    matchId: number;
    team: Time;
    jogador: JogadorVoto;
  } | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [confete, setConfete] = useState(false);

  if (partidas.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl md:text-3xl font-black texto-neon">Votação</h1>
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Vote className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Nenhuma votação aberta no momento.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Assim que uma partida for finalizada, a votação do melhor em campo abre aqui.
          </p>
        </div>
      </div>
    );
  }

  function votar() {
    if (!selecionado) return;
    start(async () => {
      const r = await registrarVoto({
        matchId: selecionado.matchId,
        team: selecionado.team,
        votedPlayerId: selecionado.jogador.id,
        voterName: nome,
        voterCpf: cpf,
      });
      if (r.success) {
        setConfete(true);
        toast.success(`Voto confirmado em ${selecionado.jogador.nome}! Valeu 🙌`);
        setSelecionado(null);
        setNome("");
        setCpf("");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Confete ativo={confete} onFim={() => setConfete(false)} />
      <div>
        <h1 className="text-2xl md:text-3xl font-black texto-neon">Votação · Melhor em campo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clique no jogador que você achou o melhor. Cada CPF vota uma vez por time.
        </p>
      </div>

      {partidas.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[var(--neon-gold)]" />
              <span className="font-bold">{p.number}ª partida</span>
              <span className="text-xs text-muted-foreground">{formatarData(p.data)}</span>
            </div>

            {p.times.map((t) => (
              <div key={t.team}>
                <p
                  className="text-sm font-bold mb-2"
                  style={{ color: t.team === "A" ? "var(--neon-gold)" : "var(--neon-blue)" }}
                >
                  {p.times.length === 2 ? `Melhor do Time ${t.team}` : `Melhor da partida (Time ${t.team} venceu)`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {t.jogadores.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => setSelecionado({ matchId: p.id, team: t.team, jogador: j })}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 text-left transition-all hover:border-[var(--neon-gold)] hover:bg-[var(--neon-gold)]/10"
                      )}
                    >
                      <Avatar nome={j.nome} foto={j.foto} size={32} />
                      <span className="text-sm font-medium truncate">{j.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selecionado} onOpenChange={(o) => !o && setSelecionado(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar voto</DialogTitle>
            <DialogDescription>
              {selecionado && (
                <>
                  Você está votando em <b className="text-foreground">{selecionado.jogador.nome}</b> como melhor do
                  Time {selecionado.team}. Preencha seus dados para confirmar.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="nome">Nome e sobrenome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                inputMode="numeric"
                onChange={(e) => setCpf(e.target.value)}
                placeholder="Somente números"
              />
            </div>
            <Button onClick={votar} disabled={enviando} className="w-full gap-2">
              <Check className="h-4 w-4" />
              {enviando ? "Confirmando..." : "Confirmar voto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
