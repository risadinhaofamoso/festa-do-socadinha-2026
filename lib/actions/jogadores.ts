"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { jogadorSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/action-result";

export async function listarJogadores() {
  return prisma.player.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
}

export async function getJogador(id: number) {
  return prisma.player.findUnique({ where: { id } });
}

function normalizar(raw: unknown) {
  const parsed = jogadorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.errors[0]?.message ?? "Dados invalidos." };
  }
  const d = parsed.data;
  return {
    ok: true as const,
    data: {
      name: d.name,
      nickname: d.nickname ? d.nickname : null,
      position: d.position,
      photoUrl: d.photoUrl ? d.photoUrl : null,
      active: d.active,
      overall: d.overall,
      pace: d.pace,
      shooting: d.shooting,
      passing: d.passing,
      dribbling: d.dribbling,
      defending: d.defending,
      physical: d.physical,
      crossing: d.crossing,
      preferredFoot: d.preferredFoot,
      weakFoot: d.weakFoot,
      skillMoves: d.skillMoves,
    },
  };
}

export async function criarJogador(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const r = normalizar(raw);
  if (!r.ok) return { success: false, error: r.error };

  const jogador = await prisma.player.create({ data: r.data });
  revalidatePath("/");
  revalidatePath("/jogadores");
  revalidatePath("/usuarios");
  return { success: true, data: { id: jogador.id } };
}

export async function atualizarJogador(id: number, raw: unknown): Promise<ActionResult> {
  const r = normalizar(raw);
  if (!r.ok) return { success: false, error: r.error };

  const existe = await prisma.player.findUnique({ where: { id } });
  if (!existe) return { success: false, error: "Jogador nao encontrado." };

  await prisma.player.update({ where: { id }, data: r.data });
  revalidatePath("/");
  revalidatePath("/jogadores");
  revalidatePath("/usuarios");
  return { success: true, data: undefined };
}

export async function alternarAtivo(id: number): Promise<ActionResult> {
  const jogador = await prisma.player.findUnique({ where: { id } });
  if (!jogador) return { success: false, error: "Jogador nao encontrado." };
  await prisma.player.update({ where: { id }, data: { active: !jogador.active } });
  revalidatePath("/jogadores");
  revalidatePath("/usuarios");
  return { success: true, data: undefined };
}

export async function removerJogador(id: number): Promise<ActionResult> {
  const participou = await prisma.participation.count({ where: { playerId: id } });
  if (participou > 0) {
    return {
      success: false,
      error:
        "Este jogador ja participou de partidas no site. Para preservar o historico, desative-o em vez de excluir.",
    };
  }
  await prisma.player.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/jogadores");
  revalidatePath("/usuarios");
  return { success: true, data: undefined };
}
