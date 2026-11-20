import Link from "next/link";
import { CalendarDays, Plus, ChevronRight, Vote, Users } from "lucide-react";
import { listarPartidas } from "@/lib/actions/partidas";
import { ehAdmin } from "@/lib/sessao";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatarData } from "@/lib/format";

export const dynamic = "force-dynamic";

function StatusBadge({ status, votingOpen }: { status: string; votingOpen: boolean }) {
  if (status === "FINALIZADA") {
    return votingOpen ? (
      <Badge variant="success" className="gap-1">
        <Vote className="h-3 w-3" /> votação aberta
      </Badge>
    ) : (
      <Badge variant="secondary">finalizada</Badge>
    );
  }
  if (status === "EM_ANDAMENTO") return <Badge className="bg-[var(--neon-green)] text-black">ao vivo</Badge>;
  return <Badge variant="outline">agendada</Badge>;
}

export default async function PartidasPage() {
  const [partidas, isAdmin] = await Promise.all([listarPartidas(), ehAdmin()]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display uppercase tracking-[0.2em] text-[var(--neon-green)] text-xs font-bold">
            Jogos · 2026
          </p>
          <h1 className="titulo-fc text-4xl sm:text-5xl mt-1">Partidas</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isAdmin
              ? "Gere os times, inicie e confirme o resultado de cada quarta."
              : "Acompanhe os resultados e as votações de craque da partida."}
          </p>
        </div>
        {isAdmin && (
          <Link href="/gerar">
            <Button className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> Nova partida
            </Button>
          </Link>
        )}
      </div>

      {partidas.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Nenhuma partida lançada ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? (
              <>
                Vá em <b>Gerar Times</b>, escolha quem veio e salve a partida.
              </>
            ) : (
              "Assim que a gestão lançar a primeira partida, ela aparece aqui."
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {partidas.map((p) => {
            const emCampo = p.participations.filter((x) => x.role === "JOGADOR").length;
            return (
              <Link
                key={p.id}
                href={`/partidas/${p.id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 hover:bg-accent/40 transition-colors card-hover"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-display text-lg">{p.number}ª partida</span>
                    <StatusBadge status={p.status} votingOpen={p.votingOpen} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    {formatarData(p.date)} · <Users className="h-3 w-3" /> {emCampo} em campo
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {p.status === "FINALIZADA" && p.scoreA != null && (
                    <span className="font-mono font-bold text-xl">
                      {p.scoreA} <span className="text-muted-foreground">×</span> {p.scoreB}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
