import Link from "next/link";
import { CalendarDays, Plus, ChevronRight, Vote } from "lucide-react";
import { listarPartidas } from "@/lib/actions/partidas";
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
  if (status === "EM_ANDAMENTO") return <Badge className="bg-[var(--neon-green)] text-black">em andamento</Badge>;
  return <Badge variant="outline">agendada</Badge>;
}

export default async function PartidasPage() {
  const partidas = await listarPartidas();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black texto-neon">Partidas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lance uma nova partida gerando os times, depois inicie e confirme o resultado.
          </p>
        </div>
        <Link href="/gerar">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova partida
          </Button>
        </Link>
      </div>

      {partidas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Nenhuma partida lançada ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vá em <b>Gerar Times</b>, escolha quem veio e salve a partida.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {partidas.map((p) => {
            const emCampo = p.participations.filter((x) => x.role === "JOGADOR").length;
            return (
              <Link
                key={p.id}
                href={`/partidas/${p.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors card-hover"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.number}ª partida</span>
                    <StatusBadge status={p.status} votingOpen={p.votingOpen} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatarData(p.date)} · {emCampo} em campo
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {p.status === "FINALIZADA" && p.scoreA != null && (
                    <span className="font-mono font-bold text-lg">
                      {p.scoreA} <span className="text-muted-foreground">x</span> {p.scoreB}
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
