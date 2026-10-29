import { prisma } from "@/lib/prisma";
import {
  PARTIDAS_BASE,
  PONTOS,
  type LinhaTabela,
  type Posicao,
  type ResultadoUltimaPartida,
} from "@/lib/types";

function vitoriaDoTime(team: string | null, scoreA: number | null, scoreB: number | null) {
  if (scoreA == null || scoreB == null || team == null) return "SEM";
  if (scoreA === scoreB) return "EMPATE";
  const venceuA = scoreA > scoreB;
  if ((team === "A" && venceuA) || (team === "B" && !venceuA)) return "VITORIA";
  return "DERROTA";
}

export type DadosTabela = {
  linhas: LinhaTabela[];
  partidasRealizadas: number;
  destaques: {
    campeao: LinhaTabela | null;
    melhorGoleiro: LinhaTabela | null;
    maisPresencas: LinhaTabela | null;
    g6: number[];
  };
};

/**
 * Monta a tabela geral do ano.
 *
 * Cada jogador parte do "carry-over" historico (estado na 35a partida,
 * importado da planilha) e as partidas FINALIZADAS no site somam por cima:
 *   +2 por presenca (jogando ou torcida), +3/+1/+0 por vitoria/empate/derrota,
 *   +1 por melhor em campo.
 */
export async function carregarTabela(): Promise<DadosTabela> {
  const [players, partidasNovas] = await Promise.all([
    prisma.player.findMany({
      orderBy: { id: "asc" },
      include: { participations: { include: { match: true } } },
    }),
    prisma.match.count({ where: { status: "FINALIZADA" } }),
  ]);

  const partidasRealizadas = PARTIDAS_BASE + partidasNovas;

  // Numero da ultima partida finalizada (para calcular a variacao de posicao).
  const ultimoNumero = players
    .flatMap((p) => p.participations)
    .filter((pp) => pp.match.status === "FINALIZADA")
    .reduce((max, pp) => Math.max(max, pp.match.number), 0);

  /** Acumula a tabela, opcionalmente ignorando uma partida (para a tabela "de antes"). */
  const acumular = (ignorarNumero?: number): LinhaTabela[] => {
    const linhas: LinhaTabela[] = players.map((p) => {
      let pts = p.basePoints;
      let vit = p.baseWins;
      let emp = p.baseDraws;
      let der = p.baseLosses;
      let jogos = p.baseJogos;
      let torcida = p.baseParticipacoes;
      let motm = p.baseMelhorEmCampo;

      for (const pp of p.participations) {
        if (pp.match.status !== "FINALIZADA") continue;
        if (ignorarNumero != null && pp.match.number === ignorarNumero) continue;
        pts += PONTOS.presenca;
        if (pp.role === "TORCIDA") {
          torcida += 1;
        } else {
          jogos += 1;
          const r = vitoriaDoTime(pp.team, pp.match.scoreA, pp.match.scoreB);
          if (r === "VITORIA") {
            vit += 1;
            pts += PONTOS.vitoria;
          } else if (r === "EMPATE") {
            emp += 1;
            pts += PONTOS.empate;
          } else if (r === "DERROTA") {
            der += 1;
          }
        }
        if (pp.isMotm) {
          motm += 1;
          pts += PONTOS.melhorEmCampo;
        }
      }

      const presencas = jogos + torcida;
      return {
        playerId: p.id,
        nome: p.name,
        apelido: p.nickname,
        posicao: p.position as Posicao,
        foto: p.photoUrl,
        overall: p.overall,
        pontos: pts,
        jogos,
        vitorias: vit,
        empates: emp,
        derrotas: der,
        participacoes: torcida,
        melhorEmCampo: motm,
        presencas,
        aproveitamentoPresenca: partidasRealizadas > 0 ? (presencas / partidasRealizadas) * 100 : 0,
        aproveitamentoVitoria: jogos > 0 ? (vit / jogos) * 100 : 0,
        posicaoTabela: 0,
        variacao: 0,
      };
    });
    // Ordena por pontos; empate mantem a ordem original (id = ranking da planilha).
    linhas.sort((a, b) => b.pontos - a.pontos || a.playerId - b.playerId);
    linhas.forEach((l, i) => (l.posicaoTabela = i + 1));
    return linhas;
  };

  const linhas = acumular();

  // Variacao = posicao antes da ultima partida menos a posicao agora (+ subiu, - caiu).
  if (ultimoNumero > 0) {
    const antes = acumular(ultimoNumero);
    const posAntes = new Map(antes.map((l) => [l.playerId, l.posicaoTabela]));
    for (const l of linhas) {
      const anterior = posAntes.get(l.playerId);
      l.variacao = anterior != null ? anterior - l.posicaoTabela : 0;
    }
  }

  const melhorGoleiro = linhas.find((l) => l.posicao === "GOLEIRO") ?? null;
  const maisPresencas =
    linhas.length > 0
      ? [...linhas].sort(
          (a, b) =>
            b.presencas - a.presencas || b.aproveitamentoPresenca - a.aproveitamentoPresenca
        )[0]
      : null;

  return {
    linhas,
    partidasRealizadas,
    destaques: {
      campeao: linhas[0] ?? null,
      melhorGoleiro,
      maisPresencas,
      g6: linhas.slice(0, 6).map((l) => l.playerId),
    },
  };
}

/**
 * Resultado da ULTIMA partida realizada no site, por jogador (para a setinha
 * de "vem de vitoria/derrota" na geracao de times). Empate ou nao ter jogado
 * contam como NEUTRO.
 */
export async function resultadosUltimaPartida(): Promise<Map<number, ResultadoUltimaPartida>> {
  const mapa = new Map<number, ResultadoUltimaPartida>();
  const ultima = await prisma.match.findFirst({
    where: { status: "FINALIZADA" },
    orderBy: { number: "desc" },
    include: { participations: true },
  });
  if (!ultima) return mapa;

  for (const pp of ultima.participations) {
    if (pp.role !== "JOGADOR") {
      mapa.set(pp.playerId, "NEUTRO");
      continue;
    }
    const r = vitoriaDoTime(pp.team, ultima.scoreA, ultima.scoreB);
    mapa.set(pp.playerId, r === "VITORIA" ? "VITORIA" : r === "DERROTA" ? "DERROTA" : "NEUTRO");
  }
  return mapa;
}
