import { carregarTabela } from "@/lib/tabela";
import { listarJogadores } from "@/lib/actions/jogadores";
import { JogadoresClient, type JogadorCompleto } from "@/components/jogadores/jogadores-client";

export const dynamic = "force-dynamic";

export default async function JogadoresPage() {
  const [jogadores, dados] = await Promise.all([listarJogadores(), carregarTabela()]);
  const porId = new Map(dados.linhas.map((l) => [l.playerId, l]));

  const lista: JogadorCompleto[] = jogadores.map((j) => {
    const l = porId.get(j.id);
    return {
      id: j.id,
      name: j.name,
      nickname: j.nickname,
      position: j.position,
      photoUrl: j.photoUrl,
      overall: j.overall,
      pace: j.pace,
      shooting: j.shooting,
      passing: j.passing,
      dribbling: j.dribbling,
      defending: j.defending,
      physical: j.physical,
      crossing: j.crossing,
      preferredFoot: j.preferredFoot,
      weakFoot: j.weakFoot,
      skillMoves: j.skillMoves,
      active: j.active,
      posicaoTabela: l?.posicaoTabela ?? 999,
      pontos: l?.pontos ?? 0,
      jogos: l?.jogos ?? 0,
      vitorias: l?.vitorias ?? 0,
      empates: l?.empates ?? 0,
      derrotas: l?.derrotas ?? 0,
      melhorEmCampo: l?.melhorEmCampo ?? 0,
    };
  });

  // Ordena por colocacao na tabela (melhores primeiro).
  lista.sort((a, b) => a.posicaoTabela - b.posicaoTabela);

  return <JogadoresClient jogadores={lista} />;
}
