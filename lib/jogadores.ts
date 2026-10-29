import type { Posicao } from "./types";

/** Hash estavel de uma string -> inteiro positivo (para variacao deterministica). */
export function hashString(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Iniciais para o avatar quando o jogador nao tem foto. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Cor de fundo neon deterministica para o avatar sem foto. */
export function corAvatar(nome: string): string {
  const cores = ["#f5c518", "#60a5fa", "#4ade80", "#c084fc", "#f87171", "#2dd4bf", "#fb923c"];
  return cores[hashString(nome) % cores.length];
}

/**
 * Overall (0-99) a partir da colocacao na tabela.
 * 1o lugar ~ 90, ultimo ~ 62. Generico, so para ter numeros iniciais.
 */
export function overallPorRanking(rank: number, total: number): number {
  if (total <= 1) return 85;
  const t = (rank - 1) / (total - 1); // 0 (topo) -> 1 (fim)
  return Math.round(90 - t * 28);
}

/** Estrelas de habilidade (1-5, meios permitidos) a partir do overall. */
export function estrelasPorOverall(overall: number): number {
  if (overall >= 87) return 5;
  if (overall >= 83) return 4.5;
  if (overall >= 79) return 4;
  if (overall >= 75) return 3.5;
  if (overall >= 71) return 3;
  if (overall >= 67) return 2.5;
  return 2;
}

type Atributos = {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  crossing: number;
};

const clamp = (n: number) => Math.max(40, Math.min(99, Math.round(n)));

/**
 * Gera atributos genericos estilo FIFA a partir do overall e da posicao.
 * A variacao por atributo e deterministica (depende do nome), entao os
 * numeros nao mudam a cada render. Peso por posicao da "cara" certa a carta:
 * goleiro forte em defesa, atacante em chute, etc.
 */
export function gerarAtributos(overall: number, posicao: Posicao, seed: string): Atributos {
  const h = hashString(seed);
  // Jitter deterministico de -4 a +4 por atributo, variando a semente.
  const jit = (i: number) => (((h >> (i * 3)) % 9) - 4);

  const base = overall;
  const pesos: Record<Posicao, Partial<Atributos>> = {
    GOLEIRO: { pace: -8, shooting: -18, passing: -4, dribbling: -12, defending: +8, physical: +4, crossing: -16 },
    ZAGUEIRO: { pace: -2, shooting: -12, passing: -2, dribbling: -8, defending: +9, physical: +7, crossing: -6 },
    LATERAL: { pace: +6, shooting: -6, passing: +2, dribbling: +2, defending: +2, physical: 0, crossing: +6 },
    VOLANTE: { pace: 0, shooting: -4, passing: +4, dribbling: 0, defending: +6, physical: +5, crossing: 0 },
    MEIA: { pace: +2, shooting: +2, passing: +7, dribbling: +6, defending: -6, physical: -3, crossing: +4 },
    ATACANTE: { pace: +6, shooting: +9, passing: 0, dribbling: +6, defending: -12, physical: +2, crossing: +2 },
  };
  const p = pesos[posicao];

  return {
    overall,
    pace: clamp(base + (p.pace ?? 0) + jit(0)),
    shooting: clamp(base + (p.shooting ?? 0) + jit(1)),
    passing: clamp(base + (p.passing ?? 0) + jit(2)),
    dribbling: clamp(base + (p.dribbling ?? 0) + jit(3)),
    defending: clamp(base + (p.defending ?? 0) + jit(4)),
    physical: clamp(base + (p.physical ?? 0) + jit(5)),
    crossing: clamp(base + (p.crossing ?? 0) + jit(6)),
  };
}

/** Cor da faixa da carta conforme o overall (ouro / prata / bronze). */
export function nivelCarta(overall: number): "ouro" | "prata" | "bronze" {
  if (overall >= 80) return "ouro";
  if (overall >= 72) return "prata";
  return "bronze";
}
