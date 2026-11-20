"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Trophy,
  Shield,
  CalendarCheck,
  Star,
  Medal,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
} from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { POSICAO_INFO, type FormaResultado, type LinhaTabela, type Posicao } from "@/lib/types";
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

function Variacao({ v }: { v: number }) {
  if (v > 0)
    return (
      <span className="inline-flex items-center text-[var(--neon-green)] text-xs font-bold tabular-nums">
        <ArrowUp className="h-3 w-3" />
        {v}
      </span>
    );
  if (v < 0)
    return (
      <span className="inline-flex items-center text-[var(--neon-red)] text-xs font-bold tabular-nums">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(v)}
      </span>
    );
  return <Minus className="h-3 w-3 text-muted-foreground/40 inline" />;
}

function Forma({ forma }: { forma: FormaResultado[] }) {
  if (!forma || forma.length === 0) return <span className="text-xs text-muted-foreground/40">–</span>;
  // mais recente à direita
  const ordenada = [...forma].reverse();
  return (
    <span className="inline-flex gap-0.5">
      {ordenada.map((r, i) => (
        <span key={i} className={cn("chip-forma", r === "V" ? "chip-v" : r === "E" ? "chip-e" : "chip-d")}>
          {r}
        </span>
      ))}
    </span>
  );
}

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
    <div
      className="painel-destaque card-hover rounded-xl border bg-card p-4"
      style={{ ["--cor-faixa" as string]: cor }}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: cor }}>
        {icone}
        {titulo}
      </div>
      {linha ? (
        <div className="mt-3 flex items-center gap-3">
          <Avatar nome={linha.nome} foto={linha.foto} size={46} className="ring-2 ring-border" />
          <div className="min-w-0">
            <p className="font-bold truncate font-display text-lg leading-tight">{linha.apelido || linha.nome}</p>
            <p className="text-xs text-muted-foreground">{stat}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sem dados ainda.</p>
      )}
    </div>
  );
}

function Placar({ p }: { p: ResumoPartida }) {
  if (p.status !== "FINALIZADA" || p.scoreA == null) {
    return <Badge variant="secondary">{p.status === "EM_ANDAMENTO" ? "Ao vivo" : "Agendada"}</Badge>;
  }
  return (
    <span className="font-mono font-bold text-lg">
      {p.scoreA} <span className="text-muted-foreground">×</span> {p.scoreB}
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
  const lider = destaques.campeao;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="hero-estadio relative overflow-hidden rounded-2xl border border-border p-5 sm:p-7">
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="font-display uppercase tracking-[0.2em] text-[var(--neon-green)] text-xs font-bold">
              Futebol de Quarta · Temporada 2026
            </p>
            <h1 className="titulo-fc text-4xl sm:text-5xl mt-1">Tabela Geral</h1>
            <p className="text-sm text-muted-foreground mt-2">
              <b className="text-foreground">{partidasRealizadas}</b> partidas ·{" "}
              <b className="text-foreground">{linhas.length}</b> jogadores na disputa
            </p>
          </div>

          {lider && (
            <div className="flex items-center gap-4 rounded-xl border border-[var(--neon-gold)]/40 bg-black/25 px-4 py-3 backdrop-blur-sm">
              <div className="relative">
                <Avatar nome={lider.nome} foto={lider.foto} size={62} className="ring-2 ring-[var(--neon-gold)]" />
                <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 text-[var(--neon-gold)] fill-[var(--neon-gold)] drop-shadow" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neon-gold)]">Líder do ano</p>
                <p className="font-display text-xl font-extrabold leading-tight">{lider.apelido || lider.nome}</p>
                <p className="text-sm">
                  <span className="texto-ouro font-black tabular-nums">{lider.pontos}</span>
                  <span className="text-muted-foreground"> pts · OVR {lider.overall}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* DESTAQUES */}
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
              ? `${destaques.melhorGoleiro.pontos} pts · ${destaques.melhorGoleiro.posicaoTabela}º geral`
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
        <div
          className="painel-destaque card-hover rounded-xl border bg-card p-4"
          style={{ ["--cor-faixa" as string]: "var(--neon-purple)" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--neon-purple)]">
            <Medal className="h-4 w-4" />
            G6 · Premiação
          </div>
          <div className="mt-3 flex -space-x-2.5">
            {g6Jogadores.map((l) => (
              <div key={l.playerId} title={l.nome} className="ring-2 ring-card rounded-full">
                <Avatar nome={l.nome} foto={l.foto} size={36} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Os 6 primeiros levam premiação.</p>
        </div>
      </div>

      {/* BUSCA */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar jogador..."
          className="pl-9"
        />
      </div>

      {/* TABELA */}
      <div className="rounded-2xl border overflow-hidden bg-card/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground font-display">
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-1 py-3 text-center" title="Variação desde a última partida">↕</th>
                <th className="px-3 py-3 text-left">Jogador</th>
                <th className="px-2 py-3 text-center font-bold text-foreground">Pts</th>
                <th className="px-2 py-3 text-center hidden sm:table-cell">J</th>
                <th className="px-2 py-3 text-center">V</th>
                <th className="px-2 py-3 text-center hidden sm:table-cell">E</th>
                <th className="px-2 py-3 text-center">D</th>
                <th className="px-2 py-3 text-center hidden lg:table-cell" title="Saldo de gols do time">SG</th>
                <th className="px-2 py-3 text-center hidden lg:table-cell" title="Média de pontos por presença">Méd</th>
                <th className="px-2 py-3 text-center hidden md:table-cell" title="Melhor em campo">
                  <Star className="h-3.5 w-3.5 inline" />
                </th>
                <th className="px-3 py-3 text-center hidden md:table-cell">Forma</th>
                <th className="px-2 py-3 text-center hidden xl:table-cell">Pres.%</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l) => {
                const info = POSICAO_INFO[l.posicao as Posicao] ?? POSICAO_INFO.MEIA;
                const noG6 = g6.has(l.playerId);
                const top3 = l.posicaoTabela <= 3 && !busca;
                return (
                  <tr
                    key={l.playerId}
                    className={cn(
                      "border-b border-border/60 last:border-0 hover:bg-accent/40 transition-colors",
                      noG6 && "bg-[var(--neon-gold)]/[0.055]"
                    )}
                  >
                    <td className="px-3 py-2.5 font-bold tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        {top3 && (
                          <Medal
                            className="h-3.5 w-3.5"
                            style={{
                              color:
                                l.posicaoTabela === 1
                                  ? "var(--neon-gold)"
                                  : l.posicaoTabela === 2
                                  ? "#cbd5e1"
                                  : "#d08b50",
                            }}
                          />
                        )}
                        <span className={cn(noG6 && "text-[var(--neon-gold)]")}>{l.posicaoTabela}º</span>
                      </span>
                    </td>
                    <td className="px-1 py-2.5 text-center">
                      <Variacao v={l.variacao} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href="/jogadores" className="flex items-center gap-2.5 group">
                        <Avatar nome={l.nome} foto={l.foto} size={32} className="ring-1 ring-border" />
                        <div className="min-w-0">
                          <span className="font-semibold group-hover:text-[var(--neon-green)] transition-colors">
                            {l.apelido || l.nome}
                          </span>
                          <span
                            className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded text-black align-middle"
                            style={{ background: info.cor }}
                          >
                            {info.curto}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-center font-black tabular-nums text-base">{l.pontos}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground hidden sm:table-cell">{l.jogos}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--neon-green)] font-semibold">{l.vitorias}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums hidden sm:table-cell">{l.empates}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--neon-red)]">{l.derrotas}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums hidden lg:table-cell text-muted-foreground">
                      {l.saldo > 0 ? `+${l.saldo}` : l.saldo}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums hidden lg:table-cell font-semibold">
                      {l.mediaPontos.toFixed(1)}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums font-semibold hidden md:table-cell">{l.melhorEmCampo}</td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell">
                      <Forma forma={l.forma} />
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums hidden xl:table-cell text-muted-foreground">
                      {l.aproveitamentoPresenca.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-10 text-center text-muted-foreground">
                    Nenhum jogador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTÓRICO */}
      <div>
        <h2 className="titulo-fc text-2xl mb-3 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-[var(--neon-gold)]" />
          Histórico de partidas
        </h2>
        {partidas.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma partida lançada no site ainda. As {partidasRealizadas} anteriores já estão consolidadas na tabela acima.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {partidas.map((p) => (
              <Link
                key={p.id}
                href={`/partidas/${p.id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-accent/40 transition-colors card-hover"
              >
                <div>
                  <p className="font-bold font-display text-lg leading-tight">
                    {p.number}ª partida
                    {p.votingOpen && (
                      <Badge variant="success" className="ml-2 align-middle text-[10px]">
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
