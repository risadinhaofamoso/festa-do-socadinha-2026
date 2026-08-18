"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/config";

/**
 * Participantes elegíveis ao sorteio: quem já fez check-in (está na festa)
 * e ainda não foi sorteado nenhuma vez.
 */
export async function listarElegiveis() {
  return prisma.invite.findMany({
    where: { checkedIn: true, draw: null },
    include: { guest: true, seat: { include: { table: true } } },
    orderBy: { number: "asc" },
  });
}

export async function listarSorteios() {
  return prisma.draw.findMany({
    orderBy: { drawnAt: "desc" },
    include: {
      invite: { include: { guest: true, seat: { include: { table: true } } } },
    },
  });
}

export async function getSorteioStats() {
  const [elegiveis, sorteados, entregues, naFesta] = await Promise.all([
    prisma.invite.count({ where: { checkedIn: true, draw: null } }),
    prisma.draw.count(),
    prisma.draw.count({ where: { delivered: true } }),
    prisma.invite.count({ where: { checkedIn: true } }),
  ]);
  return { elegiveis, sorteados, entregues, pendentesEntrega: sorteados - entregues, naFesta };
}

export async function listarPremiosUsados() {
  const premios = await prisma.draw.findMany({
    select: { prize: true },
    distinct: ["prize"],
    orderBy: { prize: "asc" },
  });
  return premios.map((p) => p.prize);
}

/**
 * Sorteia um vencedor aleatório entre os elegíveis.
 * Não grava nada — só devolve quem saiu. O registro acontece em
 * registrarSorteio(), depois que o prêmio é informado.
 */
export async function sortearVencedor(): Promise<
  ActionResult<{ inviteId: number; number: number; attendeeName: string }>
> {
  const elegiveis = await prisma.invite.findMany({
    where: { checkedIn: true, draw: null },
    select: { id: true, number: true, attendeeName: true },
  });

  if (elegiveis.length === 0) {
    return {
      success: false,
      error:
        "Não há ninguém elegível para o sorteio. Só entram convidados que já fizeram check-in e que ainda não foram sorteados.",
    };
  }

  const escolhido = elegiveis[randomInt(elegiveis.length)];
  return {
    success: true,
    data: {
      inviteId: escolhido.id,
      number: escolhido.number,
      attendeeName: escolhido.attendeeName,
    },
  };
}

export async function registrarSorteio(input: {
  inviteId: number;
  prize: string;
  delivered: boolean;
}): Promise<ActionResult> {
  const prize = input.prize.trim();
  if (!prize) {
    return { success: false, error: "Informe qual foi o prêmio sorteado." };
  }

  const invite = await prisma.invite.findUnique({
    where: { id: input.inviteId },
    include: { draw: true },
  });

  if (!invite) return { success: false, error: "Convite não encontrado." };
  if (!invite.checkedIn) {
    return { success: false, error: "Este convidado ainda não fez check-in." };
  }
  if (invite.draw) {
    return {
      success: false,
      error: `${invite.attendeeName} já foi sorteado(a) e ganhou: ${invite.draw.prize}.`,
    };
  }

  await prisma.draw.create({
    data: {
      inviteId: input.inviteId,
      prize,
      delivered: input.delivered,
      deliveredAt: input.delivered ? new Date() : null,
    },
  });

  revalidatePath("/sorteio");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function marcarEntrega(input: {
  drawId: number;
  delivered: boolean;
}): Promise<ActionResult> {
  await prisma.draw.update({
    where: { id: input.drawId },
    data: {
      delivered: input.delivered,
      deliveredAt: input.delivered ? new Date() : null,
    },
  });

  revalidatePath("/sorteio");
  return { success: true, data: undefined };
}

export async function atualizarPremio(input: {
  drawId: number;
  prize: string;
}): Promise<ActionResult> {
  const prize = input.prize.trim();
  if (!prize) {
    return { success: false, error: "Informe qual foi o prêmio." };
  }
  await prisma.draw.update({ where: { id: input.drawId }, data: { prize } });
  revalidatePath("/sorteio");
  return { success: true, data: undefined };
}

/**
 * Remove um sorteio — a pessoa volta a ser elegível e entra de novo na roleta.
 */
export async function removerSorteio(drawId: number): Promise<ActionResult> {
  await prisma.draw.delete({ where: { id: drawId } });
  revalidatePath("/sorteio");
  revalidatePath("/");
  return { success: true, data: undefined };
}
