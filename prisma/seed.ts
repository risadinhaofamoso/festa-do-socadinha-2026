import { PrismaClient } from "@prisma/client";
import { overallPorRanking, gerarAtributos, hashString } from "../lib/jogadores";
import type { Posicao } from "../lib/types";

const prisma = new PrismaClient();

/**
 * Estado consolidado na 35a partida, transcrito da planilha oficial.
 * Ordem = colocacao na tabela. Pts = pontuacao exibida (vira basePoints).
 *   nome, apelido?, jogos, V, E, D, participacao(torcida), melhorEmCampo, pts, goleiro?
 */
type Entrada = {
  nome: string;
  apelido?: string;
  j: number;
  v: number;
  e: number;
  d: number;
  p: number;
  m: number;
  pts: number;
  goleiro?: boolean;
};

const JOGADORES: Entrada[] = [
  { nome: "Caio Couto", j: 34, v: 14, e: 7, d: 13, p: 0, m: 3, pts: 120 },
  { nome: "Allan Minossi", j: 29, v: 16, e: 6, d: 7, p: 1, m: 5, pts: 119 },
  { nome: "Gabriel Aguilera", j: 31, v: 13, e: 7, d: 11, p: 3, m: 1, pts: 115 },
  { nome: "Canela", j: 33, v: 13, e: 6, d: 14, p: 1, m: 1, pts: 114 },
  { nome: "Bruno Toffoli", j: 33, v: 11, e: 7, d: 15, p: 0, m: 1, pts: 107 },
  { nome: "Matheus Castilho", j: 28, v: 13, e: 5, d: 10, p: 1, m: 0, pts: 102 },
  { nome: "Matheus Hasse", j: 27, v: 11, e: 5, d: 11, p: 2, m: 1, pts: 97 },
  { nome: "Everton Hommer", j: 26, v: 10, e: 5, d: 11, p: 0, m: 1, pts: 88 },
  { nome: "Rafael", j: 22, v: 12, e: 4, d: 6, p: 1, m: 1, pts: 87 },
  { nome: "Matheus Kern", j: 22, v: 7, e: 4, d: 11, p: 5, m: 0, pts: 79 },
  { nome: "Cavani", j: 21, v: 8, e: 5, d: 8, p: 4, m: 0, pts: 79 },
  { nome: "Claitinho", j: 18, v: 9, e: 4, d: 5, p: 3, m: 5, pts: 78 },
  { nome: "Matheus Angellos", j: 18, v: 9, e: 4, d: 5, p: 0, m: 1, pts: 68 },
  { nome: "Dudu", j: 19, v: 7, e: 3, d: 9, p: 0, m: 0, pts: 63 },
  { nome: "Guilherme Coletto", j: 14, v: 4, e: 2, d: 8, p: 9, m: 1, pts: 61 },
  { nome: "Naum", j: 9, v: 3, e: 2, d: 4, p: 14, m: 1, pts: 58 },
  { nome: "Odilon", j: 16, v: 6, e: 4, d: 6, p: 0, m: 1, pts: 55 },
  { nome: "Rodrigo Toffoli", j: 15, v: 4, e: 5, d: 6, p: 1, m: 0, pts: 49 },
  { nome: "Lucas Castagna", j: 10, v: 3, e: 2, d: 5, p: 6, m: 2, pts: 45 },
  { nome: "Léo Cunha", j: 13, v: 4, e: 4, d: 5, p: 1, m: 1, pts: 45, goleiro: true },
  { nome: "José Otávio", j: 11, v: 6, e: 1, d: 4, p: 0, m: 2, pts: 43, goleiro: true },
  { nome: "Lucca", j: 11, v: 6, e: 2, d: 3, p: 0, m: 0, pts: 42 },
  { nome: "Alemão", j: 11, v: 3, e: 4, d: 4, p: 2, m: 1, pts: 40, goleiro: true },
  { nome: "Giuliano Leal", j: 11, v: 3, e: 2, d: 6, p: 0, m: 0, pts: 33 },
  { nome: "Leandro Luz", apelido: "Porco", j: 10, v: 2, e: 2, d: 6, p: 2, m: 0, pts: 32, goleiro: true },
  { nome: "Gianluca", j: 8, v: 4, e: 2, d: 2, p: 0, m: 0, pts: 30 },
  { nome: "Eduardo", apelido: "Duca", j: 8, v: 2, e: 2, d: 3, p: 0, m: 2, pts: 29, goleiro: true },
  { nome: "Diego", j: 7, v: 3, e: 1, d: 3, p: 0, m: 1, pts: 25 },
  { nome: "Dodo", j: 8, v: 1, e: 4, d: 3, p: 0, m: 0, pts: 23 },
  { nome: "Jonathan", apelido: "Jaja", j: 5, v: 2, e: 2, d: 1, p: 1, m: 0, pts: 20 },
  { nome: "Guilherme", j: 6, v: 2, e: 0, d: 4, p: 0, m: 0, pts: 18 },
  { nome: "Jonathan Rodrigues", apelido: "Jow", j: 4, v: 3, e: 0, d: 1, p: 0, m: 0, pts: 17 },
  { nome: "Lopes", j: 4, v: 3, e: 0, d: 1, p: 0, m: 0, pts: 17 },
  { nome: "Augusto Fraga", j: 5, v: 1, e: 1, d: 3, p: 1, m: 0, pts: 16 },
  { nome: "Lorenzo", j: 5, v: 2, e: 0, d: 3, p: 0, m: 0, pts: 16 },
  { nome: "Gabriel", j: 5, v: 1, e: 2, d: 2, p: 0, m: 0, pts: 15 },
  { nome: "João Victor", apelido: "JV", j: 3, v: 1, e: 1, d: 1, p: 0, m: 1, pts: 11, goleiro: true },
  { nome: "Raul Kober", j: 3, v: 1, e: 1, d: 1, p: 0, m: 0, pts: 10 },
  { nome: "Mãezinha", j: 3, v: 1, e: 0, d: 2, p: 0, m: 1, pts: 10 },
  { nome: "Marlon", j: 2, v: 2, e: 0, d: 0, p: 0, m: 0, pts: 10 },
  { nome: "Vini", j: 3, v: 0, e: 1, d: 2, p: 0, m: 0, pts: 7 },
  { nome: "João Pedro", j: 2, v: 1, e: 0, d: 1, p: 0, m: 0, pts: 7, goleiro: true },
  { nome: "Vicenzo", j: 2, v: 1, e: 0, d: 1, p: 0, m: 0, pts: 7 },
  { nome: "Lipe", j: 3, v: 0, e: 0, d: 0, p: 0, m: 0, pts: 6 },
  { nome: "Pedro", j: 1, v: 1, e: 0, d: 0, p: 0, m: 0, pts: 5 },
  { nome: "John", j: 1, v: 0, e: 0, d: 1, p: 0, m: 0, pts: 2 },
  { nome: "Mânica", j: 1, v: 0, e: 0, d: 1, p: 0, m: 0, pts: 2 },
];

/** Posicoes de linha, distribuidas de forma deterministica entre os nao-goleiros. */
const POSICOES_LINHA: Posicao[] = ["ZAGUEIRO", "LATERAL", "VOLANTE", "MEIA", "ATACANTE"];

async function main() {
  console.log("Limpando dados antigos...");
  await prisma.vote.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();

  const total = JOGADORES.length;
  let indiceLinha = 0;

  for (let i = 0; i < total; i++) {
    const e = JOGADORES[i];
    const rank = i + 1;
    const overall = overallPorRanking(rank, total);
    const posicao: Posicao = e.goleiro
      ? "GOLEIRO"
      : POSICOES_LINHA[indiceLinha++ % POSICOES_LINHA.length];

    const attrs = gerarAtributos(overall, posicao, e.nome);
    const h = hashString(e.nome);

    await prisma.player.create({
      data: {
        name: e.nome,
        nickname: e.apelido ?? null,
        position: posicao,
        active: true,
        overall: attrs.overall,
        pace: attrs.pace,
        shooting: attrs.shooting,
        passing: attrs.passing,
        dribbling: attrs.dribbling,
        defending: attrs.defending,
        physical: attrs.physical,
        crossing: attrs.crossing,
        preferredFoot: h % 5 === 0 ? "E" : "D",
        weakFoot: 2 + (h % 4),
        skillMoves: posicao === "GOLEIRO" ? 1 + (h % 2) : 2 + (h % 4),
        baseWins: e.v,
        baseDraws: e.e,
        baseLosses: e.d,
        baseJogos: e.j,
        baseParticipacoes: e.p,
        baseMelhorEmCampo: e.m,
        basePoints: e.pts,
      },
    });
  }

  console.log(`Seed concluida: ${total} jogadores cadastrados (estado da 35a partida).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
