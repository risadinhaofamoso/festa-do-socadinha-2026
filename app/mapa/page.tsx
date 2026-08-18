import { getMapaData } from "@/lib/actions/mapa";
import { MapaClient } from "@/components/mapa/mapa-client";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const tables = await getMapaData();

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mapa do salão</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Clique em um lugar livre para atribuir um convite, ou em um lugar ocupado para ver
          detalhes.
        </p>
      </div>
      <MapaClient tables={tables} />
    </div>
  );
}
