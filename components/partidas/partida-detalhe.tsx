"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Play,
  Timer,
  Flag,
  Trash2,
  Star,
  Vote,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { CampoTimes } from "@/components/campo/campo-times";
import { Confete } from "@/components/tema/confete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatarData } from "@/lib/format";
import { formatarCronometro } from "@/lib/partidas-helpers";
import type { Time } from "@/lib/types";
import type { TimeGerado } from "@/lib/times";
import { iniciarPartida, confirmarResultado, excluirPartida } from "@/lib/actions/partidas";
import { encerrarVotacao } from "@/lib/actions/votacao";

type PontoDia = {
  playerId: number;
  nome: string;
  foto: string | null;
  team: string | null;
  role: string;
  isMotm: boolean;
  presenca: number;
  resultado: number;
  melhor: number;
  total: number;
};

type ResumoTime = {
  team: Time;
  totais: { playerId: number; nome: string; votos: number }[];
  totalVotos: number;
};

export type PartidaDetalheProps = {
  partida: {
    id: number;
    number: number;
    data: string;
    status: string;
    scoreA: number | null;
    scoreB: number | null;
    startedAt: string | null;
    durationSeconds: number | null;
    votingOpen: boolean;
  };
  timeA: TimeGerado;
  timeB: TimeGerado;
  torcida: { id: number; nome: string; foto: string | null }[];
  pontosDoDia: PontoDia[];
  resumoVotos: ResumoTime[];
  habilitadosVotacao: Time[];
};

function Cronometro({ startedAt }: { startedAt: string | null }) {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const inicio = new Date(startedAt).getTime();
    const tick = () => setSegundos(Math.floor((Date.now() - inicio) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span className="font-mono text-3xl font-black tabular-nums texto-neon">
      {formatarCronometro(segundos)}
    </span>
  );
}

export function PartidaDetalhe(props: PartidaDetalheProps) {
  const { partida } = props;
  const router = useRouter();
  const [agindo, start] = useTransition();
  const [scoreA, setScoreA] = useState<string>(String(partida.scoreA ?? 0));
  const [scoreB, setScoreB] = useState<string>(String(partida.scoreB ?? 0));
  const [confete, setConfete] = useState(false);

  const finalizada = partida.status === "FINALIZADA";
  const emAndamento = partida.status === "EM_ANDAMENTO";

  function iniciar() {
    start(async () => {
      const r = await iniciarPartida(partida.id);
      if (r.success) {
        toast.success("Partida iniciada! Bola rolando ⚽");
        router.refresh();
      } else toast.error(r.error);
    });
  }

  function confirmar() {
    const elapsed = partida.startedAt
      ? Math.floor((Date.now() - new Date(partida.startedAt).getTime()) / 1000)
      : undefined;
    start(async () => {
      const r = await confirmarResultado({
        matchId: partida.id,
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        durationSeconds: elapsed,
      });
      if (r.success) {
        setConfete(true);
        toast.success("Resultado confirmado! Votação do melhor em campo aberta.");
        router.refresh();
      } else toast.error(r.error);
    });
  }

  function encerrar() {
    start(async () => {
      const r = await encerrarVotacao(partida.id);
      if (r.success) {
        toast.success("Votação apurada! Melhor em campo definido.");
        router.refresh();
      } else toast.error(r.error);
    });
  }

  function excluir() {
    start(async () => {
      const r = await excluirPartida(partida.id);
      if (r.success) {
        toast.success("Partida excluída.");
        router.push("/partidas");
      } else toast.error(r.error);
    });
  }

  const pontosA = props.pontosDoDia.filter((p) => p.team === "A");
  const pontosB = props.pontosDoDia.filter((p) => p.team === "B");
  const pontosTorcida = props.pontosDoDia.filter((p) => p.role === "TORCIDA");

  return (
    <div className="space-y-5">
      <Confete ativo={confete} onFim={() => setConfete(false)} />

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/partidas" className="text-xs text-muted-foreground hover:underline">
            ← Todas as partidas
          </Link>
          <h1 className="text-2xl md:text-3xl font-black texto-neon">{partida.number}ª partida</h1>
          <p className="text-sm text-muted-foreground">{formatarData(partida.data)}</p>
        </div>
        <div className="flex items-center gap-2">
          {partida.status === "CRIADA" && <Badge variant="secondary">Agendada</Badge>}
          {emAndamento && <Badge className="bg-[var(--neon-green)] text-black">Em andamento</Badge>}
          {finalizada && <Badge variant="success">Finalizada</Badge>}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir esta partida?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga o resultado, as participações e os votos. A pontuação dos jogadores
                  volta a desconsiderar esta partida. Não dá para desfazer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Placar / cronômetro */}
      <Card>
        <CardContent className="p-5">
          {finalizada ? (
            <div className="flex items-center justify-center gap-6 text-center">
              <div>
                <p className="text-xs font-bold text-[var(--neon-gold)] uppercase">Time A</p>
                <p className="text-5xl font-black tabular-nums">{partida.scoreA}</p>
              </div>
              <span className="text-2xl text-muted-foreground">×</span>
              <div>
                <p className="text-xs font-bold text-[var(--neon-blue)] uppercase">Time B</p>
                <p className="text-5xl font-black tabular-nums">{partida.scoreB}</p>
              </div>
            </div>
          ) : emAndamento ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Timer className="h-5 w-5" />
                <Cronometro startedAt={partida.startedAt} />
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <p className="text-xs font-bold text-[var(--neon-gold)]">TIME A</p>
                  <Input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-16 text-center text-2xl font-black h-14"
                  />
                </div>
                <span className="text-xl text-muted-foreground pt-5">×</span>
                <div className="text-center">
                  <p className="text-xs font-bold text-[var(--neon-blue)]">TIME B</p>
                  <Input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-16 text-center text-2xl font-black h-14"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <Button onClick={confirmar} disabled={agindo} size="lg" className="gap-2">
                  <Flag className="h-4 w-4" /> Confirmar resultado
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-sm">Times definidos. Quando a bola rolar, inicie a partida.</p>
              <Button onClick={iniciar} disabled={agindo} size="lg" className="gap-2">
                <Play className="h-4 w-4" /> Iniciar partida
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Votação */}
      {finalizada && (
        <Card className="border-[var(--neon-gold)]/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-bold flex items-center gap-2">
                <Vote className="h-5 w-5 text-[var(--neon-gold)]" /> Melhor em campo
              </h2>
              {partida.votingOpen ? (
                <div className="flex items-center gap-2">
                  <Link href="/votar">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir votação
                    </Button>
                  </Link>
                  <Button onClick={encerrar} disabled={agindo} size="sm" className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Encerrar e apurar
                  </Button>
                </div>
              ) : (
                <Badge variant="secondary">Votação encerrada</Badge>
              )}
            </div>

            {partida.votingOpen && (
              <p className="text-xs text-muted-foreground">
                A votação está aberta na aba <b>Votação</b>. Cada pessoa vota uma vez por CPF.
                {props.habilitadosVotacao.length === 2
                  ? " Empate: vota-se no melhor de cada time."
                  : ` Só o time vencedor (Time ${props.habilitadosVotacao[0]}) escolhe o melhor.`}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {props.resumoVotos.map((r) => {
                const max = r.totais[0]?.votos ?? 0;
                return (
                  <div key={r.team} className="rounded-lg border p-3">
                    <p className="text-sm font-bold mb-2" style={{ color: r.team === "A" ? "var(--neon-gold)" : "var(--neon-blue)" }}>
                      Time {r.team} · {r.totalVotos} voto(s)
                    </p>
                    {r.totais.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum voto ainda.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {r.totais.map((t, i) => (
                          <li key={t.playerId}>
                            <div className="flex items-center justify-between text-sm">
                              <span className={cn(i === 0 && !partida.votingOpen && "font-bold")}>
                                {i === 0 && !partida.votingOpen && <Star className="h-3.5 w-3.5 inline fill-[var(--neon-gold)] text-[var(--neon-gold)] mr-1" />}
                                {t.nome}
                              </span>
                              <span className="tabular-nums text-muted-foreground">{t.votos}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted mt-0.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--neon-gold)]"
                                style={{ width: `${max ? (t.votos / max) * 100 : 0}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo */}
      <CampoTimes timeA={props.timeA} timeB={props.timeB} />

      {/* Pontos do dia */}
      {finalizada && (
        <div className="grid sm:grid-cols-2 gap-3">
          <PontosTime titulo="Time A" cor="var(--neon-gold)" pontos={pontosA} />
          <PontosTime titulo="Time B" cor="var(--neon-blue)" pontos={pontosB} />
          {pontosTorcida.length > 0 && (
            <PontosTime titulo="Torcida" cor="var(--neon-purple)" pontos={pontosTorcida} />
          )}
        </div>
      )}
    </div>
  );
}

function PontosTime({ titulo, cor, pontos }: { titulo: string; cor: string; pontos: PontoDia[] }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="font-bold mb-2" style={{ color: cor }}>{titulo} · pontos do dia</p>
        <ul className="space-y-1">
          {pontos.map((p) => (
            <li key={p.playerId} className="flex items-center gap-2 text-sm">
              <Avatar nome={p.nome} foto={p.foto} size={24} />
              <span className="flex-1 truncate">
                {p.nome}
                {p.isMotm && <Star className="h-3.5 w-3.5 inline ml-1 fill-[var(--neon-gold)] text-[var(--neon-gold)]" />}
              </span>
              <span className="text-xs text-muted-foreground">
                {p.presenca}
                {p.resultado > 0 && ` +${p.resultado}`}
                {p.melhor > 0 && ` +${p.melhor}`}
              </span>
              <span className="font-bold tabular-nums w-7 text-right">{p.total}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
