import { notFound } from "next/navigation";
import { getPartida } from "@/lib/actions/partidas";
import { resumoVotos } from "@/lib/actions/votacao";
import { formarTime, type JogadorTime } from "@/lib/times";
import { pontosDaPartida, timesVencedores } from "@/lib/partidas-helpers";
import { PartidaDetalhe } from "@/components/partidas/partida-detalhe";
import type { Posicao } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PartidaPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const partida = await getPartida(id);
  if (!partida) notFound();

  const comoJogadorTime = (team: string): JogadorTime[] =>
    partida.participations
      .filter((p) => p.team === team && p.role === "JOGADOR")
      .map((p) => ({
        id: p.player.id,
        nome: p.player.nickname || p.player.name,
        apelido: p.player.nickname,
        posicao: p.player.position as Posicao,
        overall: p.player.overall,
        foto: p.player.photoUrl,
        forca: p.player.overall,
      }));

  const jogadoresA = comoJogadorTime("A");
  const jogadoresB = comoJogadorTime("B");
  // Todos como titulares (sem banco) na visualizacao do historico.
  const timeA = formarTime(jogadoresA, jogadoresA.length || 1);
  const timeB = formarTime(jogadoresB, jogadoresB.length || 1);

  const torcida = partida.participations
    .filter((p) => p.role === "TORCIDA")
    .map((p) => ({ id: p.player.id, nome: p.player.nickname || p.player.name, foto: p.player.photoUrl }));

  const pontosDoDia = partida.participations.map((p) => {
    const pts = pontosDaPartida({
      role: p.role,
      team: p.team,
      isMotm: p.isMotm,
      scoreA: partida.scoreA,
      scoreB: partida.scoreB,
    });
    return {
      playerId: p.player.id,
      nome: p.player.nickname || p.player.name,
      foto: p.player.photoUrl,
      team: p.team,
      role: p.role,
      isMotm: p.isMotm,
      presenca: pts.presenca,
      resultado: pts.resultado,
      melhor: pts.melhor,
      total: pts.total,
    };
  });

  const [votos] = await Promise.all([resumoVotos(id)]);

  return (
    <PartidaDetalhe
      partida={{
        id: partida.id,
        number: partida.number,
        data: partida.date.toISOString(),
        status: partida.status,
        scoreA: partida.scoreA,
        scoreB: partida.scoreB,
        startedAt: partida.startedAt ? partida.startedAt.toISOString() : null,
        durationSeconds: partida.durationSeconds,
        votingOpen: partida.votingOpen,
      }}
      timeA={timeA}
      timeB={timeB}
      torcida={torcida}
      pontosDoDia={pontosDoDia}
      resumoVotos={votos}
      habilitadosVotacao={timesVencedores(partida.scoreA, partida.scoreB)}
    />
  );
}
