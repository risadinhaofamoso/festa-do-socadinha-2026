"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/config";

export async function buscarParaCheckin(query: string) {
  const busca = query.trim();
  if (!busca) return [];

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
    take: 15,
  });
}

export async function confirmarCheckin(inviteId: number): Promise<ActionResult> {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) return { success: false, error: "Convite não encontrado." };
  if (invite.checkedIn) {
    return { success: false, error: "Este convite já teve entrada confirmada." };
  }

  await prisma.invite.update({
    where: { id: inviteId },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  revalidatePath("/checkin");
  revalidatePath("/mapa");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function desfazerCheckin(inviteId: number): Promise<ActionResult> {
  await prisma.invite.update({
    where: { id: inviteId },
    data: { checkedIn: false, checkedInAt: null },
  });

  revalidatePath("/checkin");
  revalidatePath("/mapa");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function getUltimosCheckins(limit = 15) {
  return prisma.invite.findMany({
    where: { checkedIn: true },
    orderBy: { checkedInAt: "desc" },
    take: limit,
    include: { guest: true, seat: { include: { table: true } } },
  });
}

export async function getContadorCheckins() {
  const [total, confirmados] = await Promise.all([
    prisma.invite.count(),
    prisma.invite.count({ where: { checkedIn: true } }),
  ]);
  return { total, confirmados };
}
