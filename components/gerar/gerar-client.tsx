"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shuffle, Save, Users, Eye, Check } from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { CampoTimes } from "@/components/campo/campo-times";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { POSICAO_INFO, type Posicao, type ResultadoUltimaPartida } from "@/lib/types";
import { gerarTimes, type JogadorTime, type TimesGerados } from "@/lib/times";
import { criarPartida } from "@/lib/actions/partidas";

type JogadorBase = {
  id: number;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  overall: number;
  foto: string | null;
  resultadoAnterior?: ResultadoUltimaPartida;
};

function ListaTime({ time, rotulo, cor }: { time: TimesGerados["timeA"]; rotulo: string; cor: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold" style={{ color: cor }}>{rotulo}</span>
          <span className="text-xs text-muted-foreground">
            Overall médio {time.overallMedio}
          </span>
        </div>
        <ul className="space-y-1">
          {time.titulares.map((j) => {
            const info = POSICAO_INFO[j.posicao];
            return (
              <li key={j.id} className="flex items-center gap-2 text-sm">
                <Avatar nome={j.nome} foto={j.foto} size={24} />
                <span className="font-medium flex-1 truncate">{j.nome}</span>
                <span className="text-[10px] font-bold px-1 rounded text-black" style={{ background: info.cor }}>
                  {info.curto}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">{j.overall}</span>
              </li>
            );
          })}
          {time.reservas.map((j) => (
            <li key={j.id} className="flex items-center gap-2 text-sm opacity-60">
              <Avatar nome={j.nome} foto={j.foto} size={24} />
              <span className="flex-1 truncate">{j.nome}</span>
              <span className="text-[10px] uppercase text-muted-foreground">banco</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function GerarClient({ jogadores }: { jogadores: JogadorBase[] }) {
  const router = useRouter();
  const [salvando, startSalvar] = useTransition();
  const [presentes, setPresentes] = useState<Set<number>>(new Set());
  const [torcida, setTorcida] = useState<Set<number>>(new Set());
  const [titularesPorTime, setTitulares] = useState(7);
  const [times, setTimes] = useState<TimesGerados | null>(null);
  const [seed, setSeed] = useState(0);

  const porId = useMemo(() => new Map(jogadores.map((j) => [j.id, j])), [jogadores]);

  function toggle(id: number) {
    setTimes(null);
    setPresentes((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    setTorcida((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }

  function toggleTorcida(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setTimes(null);
    setTorcida((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const idsJogadores = [...presentes].filter((id) => !torcida.has(id));
  const idsTorcida = [...presentes].filter((id) => torcida.has(id));

  function gerar(novoSeed = seed) {
    if (idsJogadores.length < 2) {
      toast.error("Selecione pelo menos 2 jogadores em campo.");
      return;
    }
    const lista: JogadorTime[] = idsJogadores.map((id) => {
      const j = porId.get(id)!;
      // Pequeno ruido deterministico por sorteio, para variar os times a cada re-sorteio.
      const ruido = ((((id * 9301 + novoSeed * 49297) % 233280) / 233280) - 0.5) * 1.2;
      return {
        id: j.id,
        nome: j.nome,
        apelido: j.apelido,
        posicao: j.posicao,
        overall: j.overall,
        foto: j.foto,
        forca: j.overall + ruido,
        resultadoAnterior: j.resultadoAnterior,
      };
    });
    setTimes(gerarTimes(lista, { titularesPorTime }));
  }

  function reSortear() {
    const s = seed + 1;
    setSeed(s);
    gerar(s);
  }

  function salvar() {
    if (!times) return;
    const timeA = times.timeA.jogadores.map((j) => j.id);
    const timeB = times.timeB.jogadores.map((j) => j.id);
    startSalvar(async () => {
      const r = await criarPartida({ timeA, timeB, torcida: idsTorcida });
      if (r.success) {
        toast.success(`${r.data.number}ª partida criada! Agora é só iniciar.`);
        router.push(`/partidas/${r.data.id}`);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-black texto-neon">Gerar Times</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marque quem veio hoje. Os times saem equilibrados pela colocação na tabela e pelas cartinhas.
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <b>{idsJogadores.length}</b> em campo
          <span className="text-muted-foreground">·</span>
          <Eye className="h-4 w-4 text-muted-foreground" />
          <b>{idsTorcida.length}</b> torcida
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Titulares/time:</span>
          {[5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => {
                setTitulares(n);
                setTimes(null);
              }}
              className={cn(
                "w-8 h-8 rounded-md border text-sm font-semibold",
                titularesPorTime === n ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button onClick={() => gerar()} className="gap-2">
            <Shuffle className="h-4 w-4" /> Gerar Times
          </Button>
          {times && (
            <Button variant="outline" onClick={reSortear} className="gap-2">
              <Shuffle className="h-4 w-4" /> Re-sortear
            </Button>
          )}
        </div>
      </div>

      {/* Seleção de jogadores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {jogadores.map((j) => {
          const sel = presentes.has(j.id);
          const ehTorcida = torcida.has(j.id);
          const info = POSICAO_INFO[j.posicao];
          return (
            <button
              key={j.id}
              onClick={() => toggle(j.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg border p-2 text-left transition-all",
                sel ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10" : "hover:bg-accent/50"
              )}
            >
              <Avatar nome={j.nome} foto={j.foto} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{j.nome}</p>
                <span className="text-[10px] font-bold px-1 rounded text-black" style={{ background: info.cor }}>
                  {info.curto} · {j.overall}
                </span>
              </div>
              {sel && (
                <>
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[var(--neon-gold)] text-black flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </span>
                  <span
                    onClick={(e) => toggleTorcida(j.id, e)}
                    className={cn(
                      "absolute bottom-1 right-1 text-[9px] px-1 rounded cursor-pointer border",
                      ehTorcida ? "bg-[var(--neon-purple)] text-black" : "bg-background text-muted-foreground"
                    )}
                    title="Alternar torcida (veio mas não joga)"
                  >
                    torcida
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Resultado */}
      {times && (
        <div className="space-y-4 animate-fade-up">
          <div className="grid sm:grid-cols-2 gap-3">
            <ListaTime time={times.timeA} rotulo="Time A" cor="var(--neon-gold)" />
            <ListaTime time={times.timeB} rotulo="Time B" cor="var(--neon-blue)" />
          </div>

          <CampoTimes timeA={times.timeA} timeB={times.timeB} />

          <div className="flex justify-center">
            <Button onClick={salvar} disabled={salvando} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar como partida"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
