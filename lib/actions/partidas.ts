"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PARTIDAS_BASE } from "@/lib/types";
import { criarComTimesSchema, definirTimesSchema, resultadoSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/action-result";

export async function listarPartidas() {
  return prisma.match.findMany({
    orderBy: { number: "desc" },
    include: {
      participations: { include: { player: true } },
      _count: { select: { votes: true } },
    },
  });
}

export async function getPartida(id: number) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      participations: { include: { player: true } },
      votes: { include: { votedPlayer: true } },
    },
  });
}

async function proximoNumero(): Promise<number> {
  const ultima = await prisma.match.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
  return ultima ? ultima.number + 1 : PARTIDAS_BASE + 1;
}

/** Monta as linhas de Participation a partir dos times e torcida. */
function montarParticipacoes(timeA: number[], timeB: number[], torcida: number[]) {
  const vistos = new Set<number>();
  const linhas: { playerId: number; team: string | null; role: string }[] = [];
  for (const id of timeA) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    linhas.push({ playerId: id, team: "A", role: "JOGADOR" });
  }
  for (const id of timeB) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    linhas.push({ playerId: id, team: "B", role: "JOGADOR" });
  }
  for (const id of torcida) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    linhas.push({ playerId: id, team: null, role: "TORCIDA" });
  }
  return linhas;
}

export async function criarPartida(raw: unknown): Promise<ActionResult<{ id: number; number: number }>> {
  const parsed = criarComTimesSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos." };
  }
  const { data, timeA, timeB, torcida } = parsed.data;
  const number = await proximoNumero();

  const partida = await prisma.match.create({
    data: {
      number,
      date: data ?? new Date(),
      status: "CRIADA",
      participations: { create: montarParticipacoes(timeA, timeB, torcida) },
    },
  });

  revalidatePath("/partidas");
  revalidatePath("/gerar");
  revalidatePath("/");
  return { success: true, data: { id: partida.id, number } };
}

/** Reajusta os times de uma partida ainda nao finalizada. */
export async function definirTimes(raw: unknown): Promise<ActionResult> {
  const parsed = definirTimesSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos." };
  }
  const { matchId, timeA, timeB, torcida } = parsed.data;
  const partida = await prisma.match.findUnique({ where: { id: matchId } });
  if (!partida) return { success: false, error: "Partida nao encontrada." };
  if (partida.status === "FINALIZADA") {
    return { success: false, error: "A partida ja foi finalizada; os times nao podem mudar." };
  }

  await prisma.$transaction([
    prisma.participation.deleteMany({ where: { matchId } }),
    prisma.participation.createMany({
      data: montarParticipacoes(timeA, timeB, torcida).map((l) => ({ ...l, matchId })),
    }),
  ]);

  revalidatePath("/partidas");
  revalidatePath(`/partidas/${matchId}`);
  return { success: true, data: undefined };
}

export async function iniciarPartida(matchId: number): Promise<ActionResult> {
  const partida = await prisma.match.findUnique({ where: { id: matchId } });
  if (!partida) return { success: false, error: "Partida nao encontrada." };
  if (partida.status === "FINALIZADA") {
    return { success: false, error: "Esta partida ja foi finalizada." };
  }
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "EM_ANDAMENTO", startedAt: partida.startedAt ?? new Date() },
  });
  revalidatePath("/partidas");
  revalidatePath(`/partidas/${matchId}`);
  return { success: true, data: undefined };
}

export async function confirmarResultado(raw: unknown): Promise<ActionResult> {
  const parsed = resultadoSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos." };
  }
  const { matchId, scoreA, scoreB, durationSeconds } = parsed.data;
  const partida = await prisma.match.findUnique({ where: { id: matchId } });
  if (!partida) return { success: false, error: "Partida nao encontrada." };

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "FINALIZADA",
      scoreA,
      scoreB,
      finishedAt: new Date(),
      durationSeconds: durationSeconds ?? partida.durationSeconds ?? null,
      // Abre a votacao de melhor em campo automaticamente ao confirmar.
      votingOpen: true,
    },
  });

  revalidatePath("/partidas");
  revalidatePath(`/partidas/${matchId}`);
  revalidatePath("/votar");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function definirVotacao(matchId: number, aberta: boolean): Promise<ActionResult> {
  const partida = await prisma.match.findUnique({ where: { id: matchId } });
  if (!partida) return { success: false, error: "Partida nao encontrada." };
  if (partida.status !== "FINALIZADA") {
    return { success: false, error: "So da para abrir a votacao depois de confirmar o resultado." };
  }
  await prisma.match.update({ where: { id: matchId }, data: { votingOpen: aberta } });
  revalidatePath("/partidas");
  revalidatePath(`/partidas/${matchId}`);
  revalidatePath("/votar");
  return { success: true, data: undefined };
}

export async function excluirPartida(matchId: number): Promise<ActionResult> {
  await prisma.match.delete({ where: { id: matchId } });
  revalidatePath("/partidas");
  revalidatePath("/");
  return { success: true, data: undefined };
}
