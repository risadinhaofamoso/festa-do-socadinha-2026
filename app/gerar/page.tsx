import { redirect } from "next/navigation";
import { listarJogadores } from "@/lib/actions/jogadores";
import { resultadosUltimaPartida } from "@/lib/tabela";
import { ehAdmin } from "@/lib/sessao";
import { GerarClient } from "@/components/gerar/gerar-client";
import type { Posicao } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GerarPage() {
  if (!(await ehAdmin())) redirect("/login?destino=/gerar");

  const [jogadores, ultimos] = await Promise.all([listarJogadores(), resultadosUltimaPartida()]);

  const lista = jogadores
    .filter((j) => j.active)
    .map((j) => ({
      id: j.id,
      nome: j.name,
      apelido: j.nickname,
      posicao: j.position as Posicao,
      overall: j.overall,
      foto: j.photoUrl,
      resultadoAnterior: ultimos.get(j.id),
    }));

  return <GerarClient jogadores={lista} />;
}
