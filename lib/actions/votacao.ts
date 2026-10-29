"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { votoSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/action-result";
import type { Time } from "@/lib/types";
import { timesVencedores } from "@/lib/partidas-helpers";

export async function registrarVoto(raw: unknown): Promise<ActionResult> {
  const parsed = votoSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos." };
  }
  const { matchId, team, votedPlayerId, voterName, voterCpf } = parsed.data;

  const partida = await prisma.match.findUnique({ where: { id: matchId } });
  if (!partida) return { success: false, error: "Partida nao encontrada." };
  if (partida.status !== "FINALIZADA" || !partida.votingOpen) {
    return { success: false, error: "A votacao desta partida nao esta aberta." };
  }

  const habilitados = timesVencedores(partida.scoreA, partida.scoreB);
  if (!habilitados.includes(team)) {
    return { success: false, error: "Esse time nao esta em votacao nesta partida." };
  }

  // O votado precisa ter jogado por aquele time.
  const alvo = await prisma.participation.findUnique({
    where: { matchId_playerId: { matchId, playerId: votedPlayerId } },
  });
  if (!alvo || alvo.role !== "JOGADOR" || alvo.team !== team) {
    return { success: false, error: "Esse jogador nao esta nesse time." };
  }

  try {
    await prisma.vote.create({
      data: { matchId, team, votedPlayerId, voterName, voterCpf },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { success: false, error: "Esse CPF ja votou no melhor desse time." };
    }
    throw e;
  }

  revalidatePath(`/partidas/${matchId}`);
  revalidatePath("/votar");
  return { success: true, data: undefined };
}

export type ResumoTime = {
  team: Time;
  totais: { playerId: number; nome: string; votos: number }[];
  totalVotos: number;
};

/** Contagem de votos por time, do mais votado ao menos votado. */
export async function resumoVotos(matchId: number): Promise<ResumoTime[]> {
  const partida = await prisma.match.findUnique({ where: { id: matchId } });
  if (!partida) return [];
  const habilitados = timesVencedores(partida.scoreA, partida.scoreB);

  const votos = await prisma.vote.findMany({
    where: { matchId },
    include: { votedPlayer: true },
  });

  return habilitados.map((team) => {
    const doTime = votos.filter((v) => v.team === team);
    const contagem = new Map<number, { nome: string; votos: number }>();
    for (const v of doTime) {
      const atual = contagem.get(v.votedPlayerId) ?? { nome: v.votedPlayer.name, votos: 0 };
      atual.votos += 1;
      contagem.set(v.votedPlayerId, atual);
    }
    const totais = Array.from(contagem.entries())
      .map(([playerId, info]) => ({ playerId, nome: info.nome, votos: info.votos }))
      .sort((a, b) => b.votos - a.votos);
    return { team, totais, totalVotos: doTime.length };
  });
}

/**
 * Encerra a votacao: apura os votos, marca o melhor em campo de cada time
 * habilitado (empate no voto desempata pelo maior overall) e fecha a urna.
 */
export async function encerrarVotacao(matchId: number): Promise<ActionResult> {
  const partida = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participations: { include: { player: true } } },
  });
  if (!partida) return { success: false, error: "Partida nao encontrada." };
  if (partida.status !== "FINALIZADA") {
    return { success: false, error: "A partida ainda nao foi finalizada." };
  }

  const habilitados = timesVencedores(partida.scoreA, partida.scoreB);
  const votos = await prisma.vote.findMany({ where: { matchId } });

  // Zera os melhores anteriores (recontagem).
  await prisma.participation.updateMany({ where: { matchId }, data: { isMotm: false } });

  for (const team of habilitados) {
    const doTime = votos.filter((v) => v.team === team);
    if (doTime.length === 0) continue;
    const contagem = new Map<number, number>();
    for (const v of doTime) contagem.set(v.votedPlayerId, (contagem.get(v.votedPlayerId) ?? 0) + 1);

    let melhor: number | null = null;
    let maisVotos = -1;
    let overallDoMelhor = -1;
    for (const [playerId, qtd] of contagem) {
      const p = partida.participations.find((pp) => pp.playerId === playerId);
      const ov = p?.player.overall ?? 0;
      if (qtd > maisVotos || (qtd === maisVotos && ov > overallDoMelhor)) {
        melhor = playerId;
        maisVotos = qtd;
        overallDoMelhor = ov;
      }
    }
    if (melhor != null) {
      await prisma.participation.updateMany({
        where: { matchId, playerId: melhor },
        data: { isMotm: true },
      });
    }
  }

  await prisma.match.update({ where: { id: matchId }, data: { votingOpen: false } });

  revalidatePath(`/partidas/${matchId}`);
  revalidatePath("/votar");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/** Define/ajusta o melhor em campo manualmente (correcao do organizador). */
export async function definirMelhorEmCampo(
  matchId: number,
  team: Time,
  playerId: number | null
): Promise<ActionResult> {
  const alvoTime = await prisma.participation.findMany({ where: { matchId, team } });
  const ids = alvoTime.map((p) => p.playerId);
  await prisma.participation.updateMany({
    where: { matchId, playerId: { in: ids } },
    data: { isMotm: false },
  });
  if (playerId != null) {
    await prisma.participation.updateMany({
      where: { matchId, playerId, team },
      data: { isMotm: true },
    });
  }
  revalidatePath(`/partidas/${matchId}`);
  revalidatePath("/");
  return { success: true, data: undefined };
}
