import { carregarTabela } from "@/lib/tabela";
import { listarPartidas } from "@/lib/actions/partidas";
import { TabelaGeral, type ResumoPartida } from "@/components/tabela/tabela-geral";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dados, partidas] = await Promise.all([carregarTabela(), listarPartidas()]);

  const resumo: ResumoPartida[] = partidas.map((p) => ({
    id: p.id,
    number: p.number,
    data: p.date.toISOString(),
    status: p.status,
    scoreA: p.scoreA,
    scoreB: p.scoreB,
    jogadores: p.participations.length,
    votingOpen: p.votingOpen,
  }));

  return (
    <TabelaGeral
      linhas={dados.linhas}
      destaques={dados.destaques}
      partidasRealizadas={dados.partidasRealizadas}
      partidas={resumo}
    />
  );
}
