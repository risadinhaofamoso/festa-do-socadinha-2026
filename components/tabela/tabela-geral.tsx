"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trophy, Shield, CalendarCheck, Star, Medal, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { POSICAO_INFO, type LinhaTabela, type Posicao } from "@/lib/types";
import { formatarData } from "@/lib/format";

export type ResumoPartida = {
  id: number;
  number: number;
  data: string;
  status: string;
  scoreA: number | null;
  scoreB: number | null;
  jogadores: number;
  votingOpen: boolean;
};

type Destaques = {
  campeao: LinhaTabela | null;
  melhorGoleiro: LinhaTabela | null;
  maisPresencas: LinhaTabela | null;
  g6: number[];
};

function CardDestaque({
  icone,
  titulo,
  linha,
  stat,
  cor,
}: {
  icone: React.ReactNode;
  titulo: string;
  linha: LinhaTabela | null;
  stat: string;
  cor: string;
}) {
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: cor }}>
          {icone}
          {titulo}
        </div>
        {linha ? (
          <div className="mt-3 flex items-center gap-3">
            <Avatar nome={linha.nome} foto={linha.foto} size={44} />
            <div className="min-w-0">
              <p className="font-bold truncate">{linha.apelido || linha.nome}</p>
              <p className="text-sm text-muted-foreground">{stat}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Sem dados ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Placar({ p }: { p: ResumoPartida }) {
  if (p.status !== "FINALIZADA" || p.scoreA == null) {
    return <Badge variant="secondary">{p.status === "EM_ANDAMENTO" ? "Em andamento" : "Agendada"}</Badge>;
  }
  return (
    <span className="font-mono font-bold">
      {p.scoreA} <span className="text-muted-foreground">x</span> {p.scoreB}
    </span>
  );
}

export function TabelaGeral({
  linhas,
  destaques,
  partidasRealizadas,
  partidas,
}: {
  linhas: LinhaTabela[];
  destaques: Destaques;
  partidasRealizadas: number;
  partidas: ResumoPartida[];
}) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter(
      (l) => l.nome.toLowerCase().includes(q) || (l.apelido ?? "").toLowerCase().includes(q)
    );
  }, [busca, linhas]);

  const g6 = new Set(destaques.g6);
  const g6Jogadores = destaques.g6
    .map((id) => linhas.find((l) => l.playerId === id))
    .filter(Boolean) as LinhaTabela[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black texto-neon">Tabela Geral · 2026</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {partidasRealizadas} partidas realizadas · {linhas.length} jogadores
          </p>
        </div>
      </div>

      {/* Destaques */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardDestaque
          icone={<Trophy className="h-4 w-4" />}
          titulo="Melhor do Ano"
          linha={destaques.campeao}
          stat={destaques.campeao ? `${destaques.campeao.pontos} pts · 1º lugar` : ""}
          cor="var(--neon-gold)"
        />
        <CardDestaque
          icone={<Shield className="h-4 w-4" />}
          titulo="Melhor Goleiro"
          linha={destaques.melhorGoleiro}
          stat={
            destaques.melhorGoleiro
              ? `${destaques.melhorGoleiro.pontos} pts · ${destaques.melhorGoleiro.posicaoTabela}º na tabela`
              : ""
          }
          cor="var(--neon-blue)"
        />
        <CardDestaque
          icone={<CalendarCheck className="h-4 w-4" />}
          titulo="Mais Presente"
          linha={destaques.maisPresencas}
          stat={
            destaques.maisPresencas
              ? `${destaques.maisPresencas.presencas} presenças · ${destaques.maisPresencas.aproveitamentoPresenca.toFixed(0)}%`
              : ""
          }
          cor="var(--neon-green)"
        />
        <Card className="card-hover overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--neon-purple)]">
              <Medal className="h-4 w-4" />
              G6 · Premiação
            </div>
            <div className="mt-3 flex -space-x-2">
              {g6Jogadores.map((l) => (
                <div key={l.playerId} title={l.nome} className="ring-2 ring-card rounded-full">
                  <Avatar nome={l.nome} foto={l.foto} size={34} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Os 6 primeiros levam premiação.</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar jogador..."
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2.5 text-left">#</th>
              <th className="px-3 py-2.5 text-left">Jogador</th>
              <th className="px-2 py-2.5 text-center font-bold">Pts</th>
              <th className="px-2 py-2.5 text-center">J</th>
              <th className="px-2 py-2.5 text-center">V</th>
              <th className="px-2 py-2.5 text-center">E</th>
              <th className="px-2 py-2.5 text-center">D</th>
              <th className="px-2 py-2.5 text-center" title="Participação (torcida)">Part</th>
              <th className="px-2 py-2.5 text-center" title="Melhor em campo">
                <Star className="h-3.5 w-3.5 inline" />
              </th>
              <th className="px-2 py-2.5 text-center hidden sm:table-cell">Pres.%</th>
              <th className="px-2 py-2.5 text-center hidden sm:table-cell">Aprov.%</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => {
              const info = POSICAO_INFO[l.posicao as Posicao] ?? POSICAO_INFO.MEIA;
              const noG6 = g6.has(l.playerId);
              return (
                <tr
                  key={l.playerId}
                  className={cn(
                    "border-b last:border-0 hover:bg-accent/40 transition-colors",
                    noG6 && "bg-[var(--neon-gold)]/[0.06]"
                  )}
                >
                  <td className="px-3 py-2 font-bold tabular-nums">
                    <span className={cn(noG6 && "text-[var(--neon-gold)]")}>{l.posicaoTabela}º</span>
                  </td>
                  <td className="px-3 py-2">
                    <Link href="/jogadores" className="flex items-center gap-2.5 group">
                      <Avatar nome={l.nome} foto={l.foto} size={30} />
                      <div className="min-w-0">
                        <span className="font-medium group-hover:underline">{l.apelido || l.nome}</span>
                        <span
                          className="ml-2 text-[10px] font-bold px-1 rounded text-black align-middle"
                          style={{ background: info.cor }}
                        >
                          {info.curto}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-center font-black tabular-nums text-base">{l.pontos}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{l.jogos}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-[var(--neon-green)]">{l.vitorias}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{l.empates}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-[var(--neon-red)]">{l.derrotas}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{l.participacoes}</td>
                  <td className="px-2 py-2 text-center tabular-nums font-semibold">{l.melhorEmCampo}</td>
                  <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell text-muted-foreground">
                    {l.aproveitamentoPresenca.toFixed(0)}%
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell text-muted-foreground">
                    {l.aproveitamentoVitoria.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                  Nenhum jogador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Histórico de partidas */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-[var(--neon-gold)]" />
          Histórico de partidas
        </h2>
        {partidas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma partida lançada no site ainda. As 35 anteriores estão consolidadas na tabela acima.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {partidas.map((p) => (
              <Link
                key={p.id}
                href={`/partidas/${p.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors card-hover"
              >
                <div>
                  <p className="font-bold">
                    {p.number}ª partida
                    {p.votingOpen && (
                      <Badge variant="success" className="ml-2 align-middle">
                        votação aberta
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(p.data)} · {p.jogadores} presentes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Placar p={p} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
