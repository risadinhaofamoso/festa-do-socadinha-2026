import {
  listarElegiveis,
  listarSorteios,
  getSorteioStats,
  listarPremiosUsados,
} from "@/lib/actions/sorteio";
import { SorteioClient } from "@/components/sorteio/sorteio-client";

export const dynamic = "force-dynamic";

export default async function SorteioPage() {
  const [elegiveis, sorteios, stats, premios] = await Promise.all([
    listarElegiveis(),
    listarSorteios(),
    getSorteioStats(),
    listarPremiosUsados(),
  ]);

  return (
    <SorteioClient
      elegiveis={elegiveis}
      sorteios={sorteios}
      stats={stats}
      premiosUsados={premios}
    />
  );
}
