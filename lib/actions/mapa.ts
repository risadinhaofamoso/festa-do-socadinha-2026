"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/config";

export async function getMapaData() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      seats: {
        orderBy: { seatNumber: "asc" },
        include: {
          invite: { include: { guest: true } },
        },
      },
    },
  });
  return tables;
}

export async function buscarConvitesParaAtribuicao(query: string) {
  const busca = query.trim();
  if (!busca) {
    return prisma.invite.findMany({
      where: { seatId: null },
      include: { guest: true, seat: { include: { table: true } } },
      orderBy: { number: "asc" },
      take: 20,
    });
  }

  const numero = Number(busca);
  return prisma.invite.findMany({
    where: {
      OR: [
        { attendeeName: { contains: busca } },
        { guest: { name: { contains: busca } } },
        ...(Number.isFinite(numero) && busca !== "" ? [{ number: numero }] : []),
      ],
    },
    include: { guest: true, seat: { include: { table: true } } },
    orderBy: { number: "asc" },
    take: 20,
  });
}

export async function atribuirConviteAoLugar(input: {
  seatId: number;
  inviteId: number;
}): Promise<ActionResult> {
  const seat = await prisma.seat.findUnique({ where: { id: input.seatId }, include: { invite: true } });
  if (!seat) return { success: false, error: "Lugar não encontrado." };
  if (seat.invite) {
    return { success: false, error: "Este lugar já está ocupado por outro convite." };
  }

  const invite = await prisma.invite.findUnique({ where: { id: input.inviteId } });
  if (!invite) return { success: false, error: "Convite não encontrado." };

  await prisma.invite.update({
    where: { id: input.inviteId },
    data: { seatId: input.seatId },
  });

  revalidatePath("/mapa");
  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/checkin");
  return { success: true, data: undefined };
}

export async function desvincularLugar(inviteId: number): Promise<ActionResult> {
  await prisma.invite.update({ where: { id: inviteId }, data: { seatId: null } });
  revalidatePath("/mapa");
  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/checkin");
  return { success: true, data: undefined };
}
