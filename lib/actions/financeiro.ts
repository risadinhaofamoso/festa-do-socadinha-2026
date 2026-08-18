"use server";

import { prisma } from "@/lib/prisma";

export async function getFinanceiroStats() {
  const convites = await prisma.invite.findMany({
    include: { guest: true, seat: { include: { table: true } } },
    orderBy: { number: "asc" },
  });

  const totais = { PAGO: 0, PENDENTE: 0, PARCIAL: 0 } as Record<string, number>;
  const quantidadePorStatus = { PAGO: 0, PENDENTE: 0, PARCIAL: 0 } as Record<string, number>;
  const porFormaPagamento = new Map<string, { quantidade: number; total: number }>();
  const porBrinde = { SOMENTE_CONVITE: { quantidade: 0, total: 0 }, CONVITE_CAMISA_CANECA: { quantidade: 0, total: 0 } };

  for (const c of convites) {
    totais[c.paymentStatus] = (totais[c.paymentStatus] ?? 0) + c.price;
    quantidadePorStatus[c.paymentStatus] = (quantidadePorStatus[c.paymentStatus] ?? 0) + 1;

    const forma = c.paymentMethod ?? "Não informado";
    const atual = porFormaPagamento.get(forma) ?? { quantidade: 0, total: 0 };
    atual.quantidade++;
    if (c.paymentStatus === "PAGO") atual.total += c.price;
    porFormaPagamento.set(forma, atual);

    const brinde = porBrinde[c.giftType as keyof typeof porBrinde];
    if (brinde) {
      brinde.quantidade++;
      brinde.total += c.price;
    }
  }

  const pendentes = convites.filter((c) => c.paymentStatus !== "PAGO");

  return {
    arrecadado: totais.PAGO,
    pendenteValor: totais.PENDENTE,
    parcialValor: totais.PARCIAL,
    quantidadePorStatus,
    porFormaPagamento: Array.from(porFormaPagamento.entries()).map(([forma, v]) => ({
      forma,
      ...v,
    })),
    porBrinde,
    pendentes,
    convites,
  };
}

export async function gerarCsvFinanceiro(): Promise<string> {
  const { convites } = await getFinanceiroStats();

  const cabecalho = [
    "Numero",
    "Titular",
    "Atendente",
    "Mesa",
    "Lugar",
    "Preco",
    "StatusPagamento",
    "FormaPagamento",
    "Brinde",
    "CheckIn",
  ];

  const linhas = convites.map((c) =>
    [
      c.number,
      c.guest.name,
      c.attendeeName,
      c.seat?.table.number ?? "",
      c.seat?.seatNumber ?? "",
      c.price.toFixed(2),
      c.paymentStatus,
      c.paymentMethod ?? "",
      c.giftType,
      c.checkedIn ? "SIM" : "NAO",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [cabecalho.join(","), ...linhas].join("\n");
}
