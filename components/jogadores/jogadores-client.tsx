"use client";

import { useMemo, useState } from "react";
import { Search, Star, Footprints, Trophy } from "lucide-react";
import { Carta, type DadosCarta } from "@/components/jogadores/carta";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { POSICOES, POSICAO_INFO, type Posicao } from "@/lib/types";

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

  const rotulosGk = aberto?.position === "GOLEIRO";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-black texto-neon">Jogadores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clique numa cartinha para ver todos os atributos.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFiltroPos("TODAS")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              filtroPos === "TODAS" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            Todas
          </button>
          {POSICOES.map((p) => (
            <button
              key={p}
              onClick={() => setFiltroPos(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                filtroPos === p ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              {POSICAO_INFO[p].curto}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtrados.map((j) => (
          <button
            key={j.id}
            onClick={() => setAberto(j)}
            className={cn("text-left transition-transform hover:-translate-y-1", !j.active && "opacity-50")}
          >
            <Carta jogador={j} destaque={j.posicaoTabela <= 6} />
          </button>
        ))}
      </div>
      {filtrados.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum jogador encontrado.</p>
      )}

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{aberto.name}</DialogTitle>
              </DialogHeader>
              <div className="grid sm:grid-cols-[180px_1fr] gap-4">
                <div className="mx-auto w-[160px]">
                  <Carta jogador={aberto} destaque={aberto.posicaoTabela <= 6} />
                </div>
                <div className="space-y-3">
                  <div>
                    <h2 className="text-xl font-black leading-tight">{aberto.name}</h2>
                    {aberto.nickname && <p className="text-sm text-muted-foreground">“{aberto.nickname}”</p>}
                    <p className="text-sm mt-1">
                      <span className="font-semibold">{POSICAO_INFO[aberto.position as Posicao]?.rotulo}</span>
                      {" · "}
                      <span className="text-[var(--neon-gold)] font-bold">Overall {aberto.overall}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Footprints className="h-4 w-4 text-muted-foreground" />
                      Pé {aberto.preferredFoot === "D" ? "direito" : "esquerdo"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">Perna ruim</span>
                      <Estrelas n={aberto.weakFoot} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">Dribles</span>
                      <Estrelas n={aberto.skillMoves} />
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 col-span-2 text-[var(--neon-gold)] font-semibold">
                      <Trophy className="h-4 w-4" /> {aberto.posicaoTabela}º na tabela · {aberto.pontos} pts
                    </div>
                    <span>Jogos: <b>{aberto.jogos}</b></span>
                    <span>Melhor em campo: <b>{aberto.melhorEmCampo}</b></span>
                    <span className="text-[var(--neon-green)]">V: {aberto.vitorias}</span>
                    <span>E: {aberto.empates} · <span className="text-[var(--neon-red)]">D: {aberto.derrotas}</span></span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-2">
                <Barra rotulo={rotulosGk ? "Elasticidade (MGL)" : "Ritmo (RIT)"} valor={aberto.pace} />
                <Barra rotulo={rotulosGk ? "Manejo (MAN)" : "Chute (CHU)"} valor={aberto.shooting} />
                <Barra rotulo={rotulosGk ? "Reposição (CHT)" : "Passe (PAS)"} valor={aberto.passing} />
                <Barra rotulo={rotulosGk ? "Reflexos (REF)" : "Drible (DRI)"} valor={aberto.dribbling} />
                <Barra rotulo={rotulosGk ? "Velocidade (VEL)" : "Defesa (DEF)"} valor={aberto.defending} />
                <Barra rotulo={rotulosGk ? "Posicionamento (POS)" : "Físico (FIS)"} valor={aberto.physical} />
                <Barra rotulo="Cruzamento" valor={aberto.crossing} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
