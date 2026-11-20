"use client";

import { useMemo, useState } from "react";
import { Search, Star, Footprints, Trophy, Flame, Target, Percent } from "lucide-react";
import { Carta, type DadosCarta } from "@/components/jogadores/carta";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { POSICOES, POSICAO_INFO, type FormaResultado, type Posicao } from "@/lib/types";

export type JogadorCompleto = DadosCarta & {
  crossing: number;
  preferredFoot: string;
  weakFoot: number;
  skillMoves: number;
  active: boolean;
  posicaoTabela: number;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  melhorEmCampo: number;
  presencas: number;
  aproveitamentoPresenca: number;
  aproveitamentoVitoria: number;
  mediaPontos: number;
  saldo: number;
  forma: FormaResultado[];
};

function Estrelas({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < n ? "fill-[var(--neon-gold)] text-[var(--neon-gold)]" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

function corAtributo(v: number): string {
  if (v >= 85) return "var(--neon-green)";
  if (v >= 75) return "var(--neon-gold)";
  if (v >= 65) return "#fb923c";
  return "var(--neon-red)";
}

function Barra({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{rotulo}</span>
        <span className="font-bold tabular-nums">{valor}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${valor}%`, background: corAtributo(valor) }} />
      </div>
    </div>
  );
}

function Tile({ rotulo, valor, cor }: { rotulo: string; valor: React.ReactNode; cor?: string }) {
  return (
    <div className="rounded-lg border bg-background/40 px-2.5 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="font-black font-display text-lg tabular-nums leading-tight" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  );
}

function FormaChips({ forma }: { forma: FormaResultado[] }) {
  if (!forma || forma.length === 0) return <span className="text-xs text-muted-foreground">sem jogos no site</span>;
  const ordenada = [...forma].reverse();
  return (
    <span className="inline-flex gap-1">
      {ordenada.map((r, i) => (
        <span key={i} className={cn("chip-forma", r === "V" ? "chip-v" : r === "E" ? "chip-e" : "chip-d")}>
          {r}
        </span>
      ))}
    </span>
  );
}

export function JogadoresClient({ jogadores }: { jogadores: JogadorCompleto[] }) {
  const [busca, setBusca] = useState("");
  const [filtroPos, setFiltroPos] = useState<Posicao | "TODAS">("TODAS");
  const [aberto, setAberto] = useState<JogadorCompleto | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return jogadores.filter((j) => {
      const okPos = filtroPos === "TODAS" || j.position === filtroPos;
      const okBusca =
        !q || j.name.toLowerCase().includes(q) || (j.nickname ?? "").toLowerCase().includes(q);
      return okPos && okBusca;
    });
  }, [jogadores, busca, filtroPos]);

  const gk = aberto?.position === "GOLEIRO";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <p className="font-display uppercase tracking-[0.2em] text-[var(--neon-green)] text-xs font-bold">
          Elenco · 2026
        </p>
        <h1 className="titulo-fc text-4xl sm:text-5xl mt-1">Jogadores</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {jogadores.length} cartas. Clique numa carta para ver atributos e estatísticas.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFiltroPos("TODAS")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors font-display uppercase tracking-wide",
              filtroPos === "TODAS" ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-accent"
            )}
          >
            Todas
          </button>
          {POSICOES.map((p) => (
            <button
              key={p}
              onClick={() => setFiltroPos(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors font-display uppercase tracking-wide",
                filtroPos === p ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-accent"
              )}
            >
              {POSICAO_INFO[p].curto}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de cartas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {filtrados.map((j) => (
          <button
            key={j.id}
            onClick={() => setAberto(j)}
            className={cn("text-left transition-transform hover:-translate-y-1.5 focus:outline-none", !j.active && "opacity-50")}
          >
            <Carta jogador={j} destaque={j.posicaoTabela <= 6} />
          </button>
        ))}
      </div>
      {filtrados.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum jogador encontrado.</p>
      )}

      {/* Modal perfil */}
      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{aberto.name}</DialogTitle>
              </DialogHeader>

              <div className="grid sm:grid-cols-[190px_1fr] gap-5">
                <div className="mx-auto w-[180px]">
                  <Carta jogador={aberto} destaque={aberto.posicaoTabela <= 6} />
                </div>

                <div className="space-y-3">
                  <div>
                    <h2 className="titulo-fc text-2xl leading-none">{aberto.name}</h2>
                    {aberto.nickname && <p className="text-sm text-muted-foreground mt-0.5">“{aberto.nickname}”</p>}
                    <p className="text-sm mt-1.5 flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded text-black"
                        style={{ background: POSICAO_INFO[aberto.position as Posicao]?.cor }}
                      >
                        {POSICAO_INFO[aberto.position as Posicao]?.rotulo}
                      </span>
                      <span className="texto-ouro font-black">OVR {aberto.overall}</span>
                      {aberto.posicaoTabela <= 6 && (
                        <span className="text-[10px] font-bold uppercase text-[var(--neon-gold)]">G6</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Footprints className="h-4 w-4 text-muted-foreground" />
                      Pé {aberto.preferredFoot === "D" ? "direito" : "esquerdo"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">P. ruim</span>
                      <Estrelas n={aberto.weakFoot} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">Habilidade</span>
                      <Estrelas n={aberto.skillMoves} />
                    </div>
                  </div>

                  {/* Forma */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" /> Forma
                    </span>
                    <FormaChips forma={aberto.forma} />
                  </div>

                  {/* Tiles de estatística */}
                  <div className="grid grid-cols-3 gap-2">
                    <Tile rotulo="Posição" valor={`${aberto.posicaoTabela}º`} cor="var(--neon-gold)" />
                    <Tile rotulo="Pontos" valor={aberto.pontos} />
                    <Tile rotulo="Média" valor={aberto.mediaPontos.toFixed(1)} />
                    <Tile rotulo="Jogos" valor={aberto.jogos} />
                    <Tile rotulo="Craque" valor={aberto.melhorEmCampo} cor="var(--neon-gold)" />
                    <Tile rotulo="Saldo" valor={aberto.saldo > 0 ? `+${aberto.saldo}` : aberto.saldo} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg border px-2 py-1.5">
                      <span className="text-[var(--neon-green)] font-black">{aberto.vitorias}</span>
                      <p className="text-[10px] text-muted-foreground uppercase">Vitórias</p>
                    </div>
                    <div className="rounded-lg border px-2 py-1.5">
                      <span className="font-black">{aberto.empates}</span>
                      <p className="text-[10px] text-muted-foreground uppercase">Empates</p>
                    </div>
                    <div className="rounded-lg border px-2 py-1.5">
                      <span className="text-[var(--neon-red)] font-black">{aberto.derrotas}</span>
                      <p className="text-[10px] text-muted-foreground uppercase">Derrotas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Atributos */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <Target className="h-4 w-4" /> Atributos da carta
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  <Barra rotulo={gk ? "Elasticidade (ELA)" : "Ritmo (RIT)"} valor={aberto.pace} />
                  <Barra rotulo={gk ? "Manejo (MAN)" : "Chute (CHU)"} valor={aberto.shooting} />
                  <Barra rotulo={gk ? "Reposição (REP)" : "Passe (PAS)"} valor={aberto.passing} />
                  <Barra rotulo={gk ? "Reflexos (REF)" : "Drible (DRI)"} valor={aberto.dribbling} />
                  <Barra rotulo={gk ? "Velocidade (VEL)" : "Defesa (DEF)"} valor={aberto.defending} />
                  <Barra rotulo={gk ? "Posicionamento (POS)" : "Físico (FÍS)"} valor={aberto.physical} />
                  <Barra rotulo="Cruzamento" valor={aberto.crossing} />
                  <div className="flex items-end">
                    <div className="w-full rounded-lg border bg-background/40 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" /> Aproveitamento
                      </span>
                      <span className="font-bold tabular-nums">{aberto.aproveitamentoVitoria.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
