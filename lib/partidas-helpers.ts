import { PONTOS, type Time } from "@/lib/types";

/** Times habilitados a votar no melhor em campo: o vencedor, ou os dois no empate. */
export function timesVencedores(scoreA: number | null, scoreB: number | null): Time[] {
  if (scoreA == null || scoreB == null) return [];
  if (scoreA === scoreB) return ["A", "B"];
  return scoreA > scoreB ? ["A"] : ["B"];
}

export type ResultadoTime = "VITORIA" | "EMPATE" | "DERROTA";

export function resultadoDoTime(
  team: string | null,
  scoreA: number | null,
  scoreB: number | null
): ResultadoTime | null {
  if (team == null || scoreA == null || scoreB == null) return null;
  if (scoreA === scoreB) return "EMPATE";
  const venceuA = scoreA > scoreB;
  if ((team === "A" && venceuA) || (team === "B" && !venceuA)) return "VITORIA";
  return "DERROTA";
}

/**
 * Pontos que um jogador ganhou numa partida ja finalizada:
 *   presenca (2) + resultado (3/1/0 se jogou) + melhor em campo (1).
 */
export function pontosDaPartida(input: {
  role: string;
  team: string | null;
  isMotm: boolean;
  scoreA: number | null;
  scoreB: number | null;
}): { presenca: number; resultado: number; melhor: number; total: number } {
  const presenca = PONTOS.presenca;
  let resultado = 0;
  if (input.role === "JOGADOR") {
    const r = resultadoDoTime(input.team, input.scoreA, input.scoreB);
    if (r === "VITORIA") resultado = PONTOS.vitoria;
    else if (r === "EMPATE") resultado = PONTOS.empate;
    else resultado = PONTOS.derrota;
  }
  const melhor = input.isMotm ? PONTOS.melhorEmCampo : 0;
  return { presenca, resultado, melhor, total: presenca + resultado + melhor };
}

/** Formata segundos como mm:ss (cronometro da partida). */
export function formatarCronometro(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
