/**
 * Valores validos dos campos "enum" (SQLite nao tem enum nativo no Prisma).
 * Tudo aqui e validado por Zod em lib/validations.ts.
 */

export const POSICOES = [
  "GOLEIRO",
  "ZAGUEIRO",
  "LATERAL",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
] as const;
export type Posicao = (typeof POSICOES)[number];

/** Rotulo curto e cor neon de cada posicao (usado nas cartas e no campo). */
export const POSICAO_INFO: Record<
  Posicao,
  { curto: string; rotulo: string; cor: string }
> = {
  GOLEIRO: { curto: "GOL", rotulo: "Goleiro", cor: "var(--neon-gold)" },
  ZAGUEIRO: { curto: "ZAG", rotulo: "Zagueiro", cor: "var(--neon-blue)" },
  LATERAL: { curto: "LAT", rotulo: "Lateral", cor: "var(--neon-purple)" },
  VOLANTE: { curto: "VOL", rotulo: "Volante", cor: "var(--neon-green)" },
  MEIA: { curto: "MEI", rotulo: "Meia", cor: "var(--neon-green)" },
  ATACANTE: { curto: "ATA", rotulo: "Atacante", cor: "var(--neon-red)" },
};

export const STATUS_PARTIDA = ["CRIADA", "EM_ANDAMENTO", "FINALIZADA"] as const;
export type StatusPartida = (typeof STATUS_PARTIDA)[number];

export const TIMES = ["A", "B"] as const;
export type Time = (typeof TIMES)[number];

export const PAPEIS = ["JOGADOR", "TORCIDA"] as const;
export type PapelPartida = (typeof PAPEIS)[number];

export const PE_PREFERIDO = ["D", "E"] as const;
export type PePreferido = (typeof PE_PREFERIDO)[number];

/** Partidas ja realizadas antes do site existir (planilha ate a 35a partida). */
export const PARTIDAS_BASE = 35;

/** Regras de pontuacao da pelada. */
export const PONTOS = {
  vitoria: 3,
  empate: 1,
  derrota: 0,
  presenca: 2, // por comparecimento (jogando ou como torcida)
  melhorEmCampo: 1,
} as const;

/** Linha da tabela geral ja com tudo computado (base + partidas do site). */
export type LinhaTabela = {
  playerId: number;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  foto: string | null;
  overall: number;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  participacoes: number; // torcida
  melhorEmCampo: number;
  presencas: number; // jogos + participacoes
  aproveitamentoPresenca: number; // 0-100
  aproveitamentoVitoria: number; // 0-100
  posicaoTabela: number;
  variacao: number; // reservado para futuro (0 por enquanto)
};

export type ResultadoUltimaPartida = "VITORIA" | "DERROTA" | "NEUTRO";
