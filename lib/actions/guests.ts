"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guestSchema, inviteSchema, inviteUpdateSchema, csvInviteRowSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/config";
import type { GiftType, PaymentStatus } from "@/lib/types";

export async function listarTitulares() {
  return prisma.guest.findMany({ orderBy: { name: "asc" } });
}

export type ConviteFiltro = {
  busca?: string;
  paymentStatus?: PaymentStatus | "TODOS";
  giftType?: GiftType | "TODOS";
  checkedIn?: "TODOS" | "SIM" | "NAO";
  tableId?: number | "TODOS";
};

export async function listarConvites(filtro: ConviteFiltro = {}) {
  const where: Record<string, unknown> = {};

  if (filtro.paymentStatus && filtro.paymentStatus !== "TODOS") {
    where.paymentStatus = filtro.paymentStatus;
  }
  if (filtro.giftType && filtro.giftType !== "TODOS") {
    where.giftType = filtro.giftType;
  }
  if (filtro.checkedIn && filtro.checkedIn !== "TODOS") {
    where.checkedIn = filtro.checkedIn === "SIM";
  }
  if (filtro.tableId && filtro.tableId !== "TODOS") {
    where.seat = { tableId: filtro.tableId };
  }
  if (filtro.busca) {
    const busca = filtro.busca.trim();
    const numero = Number(busca);
    where.OR = [
      { attendeeName: { contains: busca } },
      { guest: { name: { contains: busca } } },
      ...(Number.isFinite(numero) && busca !== "" ? [{ number: numero }] : []),
    ];
  }

  const convites = await prisma.invite.findMany({
    where,
    orderBy: { number: "asc" },
    include: {
      guest: true,
      seat: { include: { table: true } },
    },
  });
  return convites;
}

export async function criarTitularComConvite(input: {
  guest: { name: string; phone?: string | null; notes?: string | null };
  invite: {
    number: number;
    attendeeName: string;
    price: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string | null;
    giftType: GiftType;
  };
}): Promise<ActionResult<{ guestId: number; inviteId: number }>> {
  const guestParsed = guestSchema.safeParse(input.guest);
  if (!guestParsed.success) {
    return { success: false, error: guestParsed.error.issues[0].message };
  }

  const numeroExistente = await prisma.invite.findUnique({ where: { number: input.invite.number } });
  if (numeroExistente) {
    return { success: false, error: `Já existe um convite com o número ${input.invite.number}.` };
  }

  const inviteParsed = inviteSchema.omit({ guestId: true }).safeParse(input.invite);
  if (!inviteParsed.success) {
    return { success: false, error: inviteParsed.error.issues[0].message };
  }

  const guest = await prisma.guest.create({ data: guestParsed.data });
  const invite = await prisma.invite.create({
    data: { ...inviteParsed.data, guestId: guest.id },
  });

  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/financeiro");
  return { success: true, data: { guestId: guest.id, inviteId: invite.id } };
}

export async function criarConvitePorTitularExistente(
  input: {
    guestId: number;
    number: number;
    attendeeName: string;
    price: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string | null;
    giftType: GiftType;
  }
): Promise<ActionResult<{ inviteId: number }>> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const numeroExistente = await prisma.invite.findUnique({ where: { number: parsed.data.number } });
  if (numeroExistente) {
    return { success: false, error: `Já existe um convite com o número ${parsed.data.number}.` };
  }

  const invite = await prisma.invite.create({ data: parsed.data });

  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/financeiro");
  return { success: true, data: { inviteId: invite.id } };
}

export async function atualizarConvite(input: {
  id: number;
  number: number;
  guestId: number;
  attendeeName: string;
  price: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  giftType: GiftType;
}): Promise<ActionResult> {
  const parsed = inviteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const conflito = await prisma.invite.findFirst({
    where: { number: parsed.data.number, NOT: { id: parsed.data.id } },
  });
  if (conflito) {
    return { success: false, error: `Já existe um convite com o número ${parsed.data.number}.` };
  }

  const { id, ...data } = parsed.data;
  await prisma.invite.update({ where: { id }, data });

  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/financeiro");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}

export async function excluirConvite(id: number): Promise<ActionResult> {
  await prisma.invite.delete({ where: { id } });
  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/financeiro");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}

export async function excluirTitular(id: number): Promise<ActionResult> {
  await prisma.guest.delete({ where: { id } });
  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/financeiro");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}

export async function atualizarTitular(input: {
  id: number;
  name: string;
  phone?: string | null;
  notes?: string | null;
}): Promise<ActionResult> {
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  await prisma.guest.update({ where: { id: input.id }, data: parsed.data });
  revalidatePath("/convidados");
  return { success: true, data: undefined };
}

export type LinhaValidacaoCsv = {
  linha: number;
  valido: boolean;
  erro?: string;
  dados?: {
    titular: string;
    atendente: string;
    numero: number;
    preco: number;
    formaPagamento?: string | null;
    statusPagamento: PaymentStatus;
    brinde: GiftType;
  };
};

export async function validarImportacaoCsv(
  linhas: Record<string, string>[]
): Promise<LinhaValidacaoCsv[]> {
  const numerosExistentes = new Set(
    (await prisma.invite.findMany({ select: { number: true } })).map((i) => i.number)
  );
  const numerosNoLote = new Set<number>();
  const resultado: LinhaValidacaoCsv[] = [];

  linhas.forEach((linha, idx) => {
    const numeroLinha = idx + 2; // considerando cabeçalho na linha 1
    const candidato = {
      titular: linha.titular ?? "",
      atendente: linha.atendente ?? "",
      numero: Number(linha.numero),
      preco: Number(String(linha.preco ?? "").replace(",", ".")),
      formaPagamento: linha.formaPagamento || null,
      statusPagamento: (linha.statusPagamento || "PENDENTE") as PaymentStatus,
      brinde: linha.brinde as GiftType,
    };

    const parsed = csvInviteRowSchema.safeParse(candidato);
    if (!parsed.success) {
      resultado.push({ linha: numeroLinha, valido: false, erro: parsed.error.issues[0].message });
      return;
    }

    if (numerosExistentes.has(parsed.data.numero) || numerosNoLote.has(parsed.data.numero)) {
      resultado.push({
        linha: numeroLinha,
        valido: false,
        erro: `Número de convite ${parsed.data.numero} duplicado.`,
      });
      return;
    }

    numerosNoLote.add(parsed.data.numero);
    resultado.push({
      linha: numeroLinha,
      valido: true,
      dados: {
        titular: parsed.data.titular,
        atendente: parsed.data.atendente,
        numero: parsed.data.numero,
        preco: parsed.data.preco,
        formaPagamento: parsed.data.formaPagamento,
        statusPagamento: parsed.data.statusPagamento ?? "PENDENTE",
        brinde: parsed.data.brinde,
      },
    });
  });

  return resultado;
}

export async function confirmarImportacaoCsv(
  linhasValidas: NonNullable<LinhaValidacaoCsv["dados"]>[]
): Promise<ActionResult<{ importados: number }>> {
  let importados = 0;

  for (const linha of linhasValidas) {
    const existente = await prisma.invite.findUnique({ where: { number: linha.numero } });
    if (existente) continue;

    let guest = await prisma.guest.findFirst({ where: { name: linha.titular } });
    if (!guest) {
      guest = await prisma.guest.create({ data: { name: linha.titular } });
    }

    await prisma.invite.create({
      data: {
        number: linha.numero,
        guestId: guest.id,
        attendeeName: linha.atendente,
        price: linha.preco,
        paymentStatus: linha.statusPagamento,
        paymentMethod: linha.formaPagamento,
        giftType: linha.brinde,
      },
    });
    importados++;
  }

  revalidatePath("/convidados");
  revalidatePath("/");
  revalidatePath("/financeiro");
  return { success: true, data: { importados } };
}
