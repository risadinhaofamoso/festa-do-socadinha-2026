import { listarMesasComOcupacao } from "@/lib/actions/config";
import { ConfiguracoesClient } from "@/components/configuracoes/configuracoes-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const mesas = await listarMesasComOcupacao();

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do salão</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Defina a quantidade de mesas e lugares por mesa. Você pode ajustar depois sem perder os
          convites já atribuídos.
        </p>
      </div>
      <ConfiguracoesClient mesasIniciais={mesas} />
    </div>
  );
}
