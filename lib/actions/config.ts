"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { configSalaoSchema, novaMesaSchema, editarMesaSchema } from "@/lib/validations";
import { LAYOUT_MESAS, TOTAL_LUGARES_LAYOUT, TOTAL_MESAS_LAYOUT } from "@/lib/layout-salao";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getResumoSalao() {
  const [totalMesas, totalLugares, lugaresOcupados] = await Promise.all([
    prisma.table.count(),
    prisma.seat.count(),
    prisma.seat.count({ where: { invite: { isNot: null } } }),
  ]);
  return { totalMesas, totalLugares, lugaresOcupados };
}

export async function listarMesasComOcupacao() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      seats: {
        orderBy: { seatNumber: "asc" },
        include: { invite: true },
      },
    },
  });
  return tables.map((t) => ({
    id: t.id,
    number: t.number,
    label: t.label,
    capacity: t.capacity,
    posicionada: t.positionX !== null && t.positionY !== null,
    ocupados: t.seats.filter((s) => s.invite !== null).length,
    totalLugares: t.seats.length,
  }));
}

/**
 * Recria o salão inteiro na planta real da festa: 67 mesas posicionadas,
 * sendo 57 de 4 lugares e 10 grandes de 8 lugares na coluna da direita.
 *
 * Apaga as mesas existentes, então só roda se nenhum convite estiver
 * ocupando lugar — assim ninguém perde reserva sem perceber.
 */
export async function aplicarLayoutRealDoSalao(): Promise<
  ActionResult<{ mesas: number; lugares: number }>
> {
  const ocupados = await prisma.seat.count({ where: { invite: { isNot: null } } });
  if (ocupados > 0) {
    return {
      success: false,
      error: `Existem ${ocupados} lugar(es) com convite atribuído. Como esta ação recria todas as mesas, desvincule esses convites antes (ou use "Zerar o banco" se ainda forem dados de teste).`,
    };
  }

  await prisma.table.deleteMany();

  await prisma.$transaction(
    LAYOUT_MESAS.map((mesa) =>
      prisma.table.create({
        data: {
          number: mesa.numero,
          capacity: mesa.capacidade,
          positionX: mesa.x,
          positionY: mesa.y,
          orientation: mesa.orientacao,
          seats: {
            create: Array.from({ length: mesa.capacidade }, (_, i) => ({
              seatNumber: i + 1,
            })),
          },
        },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/mapa");
  return {
    success: true,
    data: { mesas: TOTAL_MESAS_LAYOUT, lugares: TOTAL_LUGARES_LAYOUT },
  };
}

export async function criarConfiguracaoInicial(input: {
  quantidadeMesas: number;
  capacidadePorMesa: number;
}): Promise<ActionResult> {
  const parsed = configSalaoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existentes = await prisma.table.count();
  if (existentes > 0) {
    return {
      success: false,
      error:
        "Já existem mesas cadastradas. Use as opções de adicionar/remover mesas para ajustar a configuração.",
    };
  }

  const { quantidadeMesas, capacidadePorMesa } = parsed.data;

  await prisma.$transaction(
    Array.from({ length: quantidadeMesas }, (_, i) =>
      prisma.table.create({
        data: {
          number: i + 1,
          capacity: capacidadePorMesa,
          seats: {
            create: Array.from({ length: capacidadePorMesa }, (_, s) => ({
              seatNumber: s + 1,
            })),
          },
        },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}

/**
 * Define (ou limpa) o grupo/família dono da mesa. A cor no mapa vem daqui.
 */
export async function definirGrupoDaMesa(input: {
  tableId: number;
  grupo: string | null;
}): Promise<ActionResult> {
  const grupo = input.grupo?.trim() ?? "";
  await prisma.table.update({
    where: { id: input.tableId },
    data: { label: grupo.length > 0 ? grupo : null },
  });

  revalidatePath("/mapa");
  revalidatePath("/configuracoes");
  return { success: true, data: undefined };
}

export async function adicionarMesas(input: {
  quantidade: number;
  capacidade: number;
}): Promise<ActionResult> {
  if (input.quantidade < 1 || input.capacidade < 1) {
    return { success: false, error: "Informe valores válidos para quantidade e capacidade." };
  }

  const maior = await prisma.table.findFirst({ orderBy: { number: "desc" } });
  const proximoNumero = (maior?.number ?? 0) + 1;

  await prisma.$transaction(
    Array.from({ length: input.quantidade }, (_, i) =>
      prisma.table.create({
        data: {
          number: proximoNumero + i,
          capacity: input.capacidade,
          seats: {
            create: Array.from({ length: input.capacidade }, (_, s) => ({
              seatNumber: s + 1,
            })),
          },
        },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}

export async function removerMesa(tableId: number): Promise<ActionResult> {
  const ocupados = await prisma.seat.count({
    where: { tableId, invite: { isNot: null } },
  });

  if (ocupados > 0) {
    return {
      success: false,
      error: `Não é possível remover: esta mesa tem ${ocupados} lugar(es) com convite atribuído. Desvincule os convites antes de remover a mesa.`,
    };
  }

  await prisma.table.delete({ where: { id: tableId } });

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}

export async function editarMesa(input: {
  id: number;
  number: number;
  label?: string | null;
  capacity: number;
}): Promise<ActionResult> {
  const parsed = editarMesaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { id, number, label, capacity } = parsed.data;

  const mesaAtual = await prisma.table.findUnique({
    where: { id },
    include: { seats: { include: { invite: true }, orderBy: { seatNumber: "asc" } } },
  });
  if (!mesaAtual) {
    return { success: false, error: "Mesa não encontrada." };
  }

  const numeroDuplicado = await prisma.table.findFirst({
    where: { number, NOT: { id } },
  });
  if (numeroDuplicado) {
    return { success: false, error: `Já existe uma mesa com o número ${number}.` };
  }

  if (capacity > mesaAtual.capacity) {
    const novosLugares = Array.from(
      { length: capacity - mesaAtual.capacity },
      (_, i) => ({ seatNumber: mesaAtual.capacity + i + 1, tableId: id })
    );
    await prisma.seat.createMany({ data: novosLugares });
  } else if (capacity < mesaAtual.capacity) {
    const lugaresParaRemover = mesaAtual.seats.filter(
      (s) => s.seatNumber > capacity
    );
    const algumOcupado = lugaresParaRemover.some((s) => s.invite !== null);
    if (algumOcupado) {
      return {
        success: false,
        error:
          "Não é possível reduzir a capacidade: há convites atribuídos aos últimos lugares desta mesa.",
      };
    }
    await prisma.seat.deleteMany({
      where: { id: { in: lugaresParaRemover.map((s) => s.id) } },
    });
  }

  await prisma.table.update({
    where: { id },
    data: { number, label: label || null, capacity },
  });

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/mapa");
  return { success: true, data: undefined };
}
