import { ArrowDown, ArrowUp, Minus, Trophy } from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { cn } from "@/lib/utils";
import { POSICAO_INFO, type Posicao, type ResultadoUltimaPartida } from "@/lib/types";
import type { SlotCampo, TimeGerado } from "@/lib/times";

function Indicador({ resultado }: { resultado?: ResultadoUltimaPartida }) {
  if (!resultado) return null;
  if (resultado === "VITORIA") {
    return (
      <span className="absolute -top-1 -right-1 flex items-center rounded-full bg-[var(--neon-green)] text-black px-1 py-0.5 shadow">
        <Trophy className="h-2.5 w-2.5" />
        <ArrowUp className="h-2.5 w-2.5 -ml-0.5" />
      </span>
    );
  }
  if (resultado === "DERROTA") {
    return (
      <span className="absolute -top-1 -right-1 rounded-full bg-[var(--neon-red)] text-black p-0.5 shadow">
        <ArrowDown className="h-2.5 w-2.5" />
      </span>
    );
  }
  return (
    <span className="absolute -top-1 -right-1 rounded-full bg-muted text-muted-foreground p-0.5 shadow">
      <Minus className="h-2.5 w-2.5" />
    </span>
  );
}

function Chip({ slot, topPct, leftPct }: { slot: SlotCampo; topPct: number; leftPct: number }) {
  const j = slot.jogador;
  const info = POSICAO_INFO[j.posicao as Posicao] ?? POSICAO_INFO.MEIA;
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ top: `${topPct}%`, left: `${leftPct}%`, transform: "translate(-50%,-50%)", width: 64 }}
    >
      <div className="relative">
        <Avatar nome={j.nome} foto={j.foto} size={38} className="border-2 border-white/80 shadow-lg" />
        <Indicador resultado={j.resultadoAnterior} />
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 rounded text-black"
          style={{ background: info.cor }}
        >
          {info.curto}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-semibold text-white bg-black/55 rounded px-1 max-w-[64px] truncate">
        {j.nome}
      </span>
    </div>
  );
}

function Banco({ time, rotulo }: { time: TimeGerado; rotulo: string }) {
  if (time.reservas.length === 0) return null;
  return (
    <div className="text-xs text-muted-foreground">
      <span className="font-semibold">{rotulo} no banco:</span>{" "}
      {time.reservas.map((r) => r.nome).join(", ")}
    </div>
  );
}

/**
 * Campo visto de cima: Time B na metade de cima, Time A na metade de baixo.
 * Cada jogador aparece com a foto, a posicao e a setinha de como vem da
 * partida anterior.
 */
export function CampoTimes({ timeA, timeB }: { timeA: TimeGerado; timeB: TimeGerado }) {
  return (
    <div className="space-y-3">
      <div
        className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 border-white/15"
        style={{
          aspectRatio: "3 / 4",
          background:
            "repeating-linear-gradient(180deg,#15803d 0 9%,#166534 9% 18%)",
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-3 border-2 border-white/35 rounded-sm" />
        <div className="absolute left-3 right-3 top-1/2 h-[2px] bg-white/35" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
        {/* Grandes areas */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 h-10 w-28 border-2 border-t-0 border-white/35" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 h-10 w-28 border-2 border-b-0 border-white/35" />

        <span className="absolute top-1.5 left-2 text-[10px] font-bold text-white/80 bg-[var(--neon-blue)]/70 px-1.5 rounded">
          TIME B
        </span>
        <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-black bg-[var(--neon-gold)] px-1.5 rounded">
          TIME A
        </span>

        {/* Time B (cima): gol no topo, avanca para o meio */}
        {timeB.formacao.map((slot) => (
          <Chip key={`B-${slot.jogador.id}`} slot={slot} topPct={3 + slot.y * 44} leftPct={8 + slot.x * 84} />
        ))}
        {/* Time A (baixo): gol embaixo, avanca para o meio */}
        {timeA.formacao.map((slot) => (
          <Chip key={`A-${slot.jogador.id}`} slot={slot} topPct={97 - slot.y * 44} leftPct={8 + slot.x * 84} />
        ))}
      </div>

      <div className={cn("flex flex-col gap-1")}>
        <Banco time={timeB} rotulo="Time B" />
        <Banco time={timeA} rotulo="Time A" />
      </div>
    </div>
  );
}
