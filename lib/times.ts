import type { Posicao, ResultadoUltimaPartida } from "@/lib/types";

export type JogadorTime = {
  id: number;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  overall: number;
  foto: string | null;
  /** Forca usada no balanceamento (overall + peso da colocacao na tabela). */
  forca: number;
  resultadoAnterior?: ResultadoUltimaPartida;
};

export type SlotCampo = { jogador: JogadorTime; x: number; y: number };

export type TimeGerado = {
  jogadores: JogadorTime[];
  titulares: JogadorTime[];
  reservas: JogadorTime[];
  formacao: SlotCampo[];
  forcaTotal: number;
  overallMedio: number;
};

export type TimesGerados = { timeA: TimeGerado; timeB: TimeGerado };

const ORDEM_POSICAO: Posicao[] = ["GOLEIRO", "ZAGUEIRO", "LATERAL", "VOLANTE", "MEIA", "ATACANTE"];

function ordenarPorPosicao(a: JogadorTime, b: JogadorTime) {
  const pa = ORDEM_POSICAO.indexOf(a.posicao);
  const pb = ORDEM_POSICAO.indexOf(b.posicao);
  if (pa !== pb) return pa - pb;
  return b.forca - a.forca;
}

/**
 * Monta a formacao (x,y em 0..1 na metade do time) agrupando por linha:
 * goleiro atras, defesa, meio e ataque a frente. x distribui a linha na largura.
 */
function montarFormacao(titulares: JogadorTime[]): SlotCampo[] {
  const linhas: { y: number; membros: JogadorTime[] }[] = [
    { y: 0.1, membros: titulares.filter((j) => j.posicao === "GOLEIRO") },
    { y: 0.34, membros: titulares.filter((j) => j.posicao === "ZAGUEIRO" || j.posicao === "LATERAL") },
    { y: 0.61, membros: titulares.filter((j) => j.posicao === "VOLANTE" || j.posicao === "MEIA") },
    { y: 0.87, membros: titulares.filter((j) => j.posicao === "ATACANTE") },
  ];

  const slots: SlotCampo[] = [];
  for (const linha of linhas) {
    const k = linha.membros.length;
    linha.membros.forEach((jogador, i) => {
      slots.push({ jogador, x: (i + 1) / (k + 1), y: linha.y });
    });
  }
  return slots;
}

/**
 * Monta um TimeGerado a partir de um conjunto FIXO de jogadores (sem
 * redistribuir), definindo titulares/reservas e a formacao. Usado para
 * reconstruir os times de uma partida ja salva.
 */
export function formarTime(jogadores: JogadorTime[], titularesPorTime: number): TimeGerado {
  return montarTime(jogadores, titularesPorTime);
}

function montarTime(jogadores: JogadorTime[], titularesPorTime: number): TimeGerado {
  const ordenados = [...jogadores].sort(ordenarPorPosicao);

  // Titular: o goleiro sempre entra; o resto preenche por forca.
  const goleiros = ordenados.filter((j) => j.posicao === "GOLEIRO");
  const linha = ordenados
    .filter((j) => j.posicao !== "GOLEIRO")
    .sort((a, b) => b.forca - a.forca);

  const titulares: JogadorTime[] = [];
  if (goleiros.length > 0) titulares.push(goleiros[0]);
  for (const j of linha) {
    if (titulares.length >= titularesPorTime) break;
    titulares.push(j);
  }
  const reservas = ordenados.filter((j) => !titulares.includes(j));

  const forcaTotal = jogadores.reduce((s, j) => s + j.forca, 0);
  const overallMedio = jogadores.length
    ? Math.round(jogadores.reduce((s, j) => s + j.overall, 0) / jogadores.length)
    : 0;

  return {
    jogadores: ordenados,
    titulares: [...titulares].sort(ordenarPorPosicao),
    reservas: reservas.sort(ordenarPorPosicao),
    formacao: montarFormacao([...titulares].sort(ordenarPorPosicao)),
    forcaTotal,
    overallMedio,
  };
}

/**
 * Divide os presentes em dois times equilibrados.
 *
 * - Goleiros vao um para cada time (os dois mais fortes). Goleiro sobrando
 *   entra no sorteio como jogador de linha.
 * - Os demais sao distribuidos do mais forte para o mais fraco, sempre caindo
 *   no time atualmente mais fraco (e mantendo os tamanhos parelhos). Isso
 *   equilibra a soma de forca dos dois lados.
 */
export function gerarTimes(
  jogadores: JogadorTime[],
  opcoes?: { titularesPorTime?: number }
): TimesGerados {
  const titularesPorTime = opcoes?.titularesPorTime ?? 7;

  const goleiros = jogadores.filter((j) => j.posicao === "GOLEIRO").sort((a, b) => b.forca - a.forca);
  const demais = jogadores.filter((j) => j.posicao !== "GOLEIRO");

  const a: JogadorTime[] = [];
  const b: JogadorTime[] = [];

  // Um goleiro para cada lado.
  if (goleiros[0]) a.push(goleiros[0]);
  if (goleiros[1]) b.push(goleiros[1]);
  // Goleiros extras entram no pool de linha.
  const pool = [...goleiros.slice(2), ...demais].sort((x, y) => y.forca - x.forca);

  const total = jogadores.length;
  const metade = Math.ceil(total / 2);

  for (const j of pool) {
    const somaA = a.reduce((s, p) => s + p.forca, 0);
    const somaB = b.reduce((s, p) => s + p.forca, 0);
    const aCheio = a.length >= metade;
    const bCheio = b.length >= metade;

    let destino: JogadorTime[];
    if (aCheio) destino = b;
    else if (bCheio) destino = a;
    else destino = somaA <= somaB ? a : b;
    destino.push(j);
  }

  return {
    timeA: montarTime(a, titularesPorTime),
    timeB: montarTime(b, titularesPorTime),
  };
}
