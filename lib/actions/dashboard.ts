"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalConvites,
    totalLugares,
    lugaresOcupados,
    checkinsFeitos,
    somaPago,
    somaPendente,
    somaParcial,
    somenteConvite,
    conviteComBrinde,
  ] = await Promise.all([
    prisma.invite.count(),
    prisma.seat.count(),
    prisma.seat.count({ where: { invite: { isNot: null } } }),
    prisma.invite.count({ where: { checkedIn: true } }),
    prisma.invite.aggregate({ where: { paymentStatus: "PAGO" }, _sum: { price: true } }),
    prisma.invite.aggregate({ where: { paymentStatus: "PENDENTE" }, _sum: { price: true } }),
    prisma.invite.aggregate({ where: { paymentStatus: "PARCIAL" }, _sum: { price: true } }),
    prisma.invite.count({ where: { giftType: "SOMENTE_CONVITE" } }),
    prisma.invite.count({ where: { giftType: "CONVITE_CAMISA_CANECA" } }),
  ]);

  const arrecadado = somaPago._sum.price ?? 0;
  const pendente = (somaPendente._sum.price ?? 0) + (somaParcial._sum.price ?? 0);

  return {
    totalConvites,
    totalLugares,
    lugaresOcupados,
    ocupacaoPercentual: totalLugares > 0 ? Math.round((lugaresOcupados / totalLugares) * 100) : 0,
    checkinsFeitos,
    checkinsRestantes: totalConvites - checkinsFeitos,
    arrecadado,
    pendente,
    somenteConvite,
    conviteComBrinde,
  };
}
