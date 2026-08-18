import { listarConvites, listarTitulares } from "@/lib/actions/guests";
import { listarMesasComOcupacao } from "@/lib/actions/config";
import { ConvidadosClient } from "@/components/convidados/convidados-client";

export const dynamic = "force-dynamic";

export default async function ConvidadosPage() {
  const [convites, titulares, mesas] = await Promise.all([
    listarConvites(),
    listarTitulares(),
    listarMesasComOcupacao(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Convidados e convites</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cadastre, edite e importe convites. Cada convite tem um número único.
        </p>
      </div>
      <ConvidadosClient convitesIniciais={convites} titulares={titulares} mesas={mesas} />
    </div>
  );
}
