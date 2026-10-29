import { prisma } from "@/lib/prisma";
import { timesVencedores } from "@/lib/partidas-helpers";
import { VotacaoClient, type PartidaVoto } from "@/components/votar/votacao-client";
import type { Time } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VotarPage() {
  const abertas = await prisma.match.findMany({
    where: { status: "FINALIZADA", votingOpen: true },
    orderBy: { number: "desc" },
    include: { participations: { include: { player: true } } },
  });

  const partidas: PartidaVoto[] = abertas.map((p) => {
    const habilitados = timesVencedores(p.scoreA, p.scoreB);
    const times = habilitados.map((team: Time) => ({
      team,
      jogadores: p.participations
        .filter((x) => x.team === team && x.role === "JOGADOR")
        .map((x) => ({ id: x.player.id, nome: x.player.nickname || x.player.name, foto: x.player.photoUrl })),
    }));
    return { id: p.id, number: p.number, data: p.date.toISOString(), times };
  });

  return <VotacaoClient partidas={partidas} />;
}
