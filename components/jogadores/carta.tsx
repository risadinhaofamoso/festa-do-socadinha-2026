import { cn } from "@/lib/utils";
import { iniciais, corAvatar, nivelCarta } from "@/lib/jogadores";
import { POSICAO_INFO, type Posicao } from "@/lib/types";

export type DadosCarta = {
  id: number;
  name: string;
  nickname?: string | null;
  position: string;
  photoUrl?: string | null;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

const GRADIENTES: Record<"ouro" | "prata" | "bronze", string> = {
  ouro: "linear-gradient(160deg,#fbe38a 0%,#f5c518 45%,#b8860b 100%)",
  prata: "linear-gradient(160deg,#eef1f5 0%,#c3c9d4 45%,#878f9e 100%)",
  bronze: "linear-gradient(160deg,#e7b07a 0%,#cd7f32 45%,#8a551f 100%)",
};

/** Rotulos da cartinha. Goleiro usa as metricas de goleiro do FIFA. */
function rotulos(posicao: Posicao): [string, string, string, string, string, string] {
  if (posicao === "GOLEIRO") return ["MGL", "MAN", "CHT", "REF", "VEL", "POS"];
  return ["RIT", "CHU", "PAS", "DRI", "DEF", "FIS"];
}

export function Carta({
  jogador,
  destaque,
  className,
}: {
  jogador: DadosCarta;
  destaque?: boolean;
  className?: string;
}) {
  const posicao = jogador.position as Posicao;
  const nivel = nivelCarta(jogador.overall);
  const info = POSICAO_INFO[posicao] ?? POSICAO_INFO.MEIA;
  const nome = jogador.nickname || jogador.name;
  const [r1, r2, r3, r4, r5, r6] = rotulos(posicao);
  const stats: [string, number][] = [
    [r1, jogador.pace],
    [r2, jogador.shooting],
    [r3, jogador.passing],
    [r4, jogador.dribbling],
    [r5, jogador.defending],
    [r6, jogador.physical],
  ];

  return (
    <div
      className={cn(
        "relative rounded-xl p-[2px] shadow-lg transition-transform",
        destaque && "ring-2 ring-[var(--neon-gold)]",
        className
      )}
      style={{ background: GRADIENTES[nivel] }}
    >
      <div className="rounded-[10px] px-3 pt-3 pb-2.5 text-black/85" style={{ background: GRADIENTES[nivel] }}>
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center leading-none w-10 shrink-0">
            <span className="text-2xl font-black tracking-tight">{jogador.overall}</span>
            <span className="text-[11px] font-bold mt-0.5">{info.curto}</span>
            <div className="w-6 h-[2px] my-1 bg-black/30 rounded" />
          </div>
          <div className="flex-1 flex justify-center">
            {jogador.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={jogador.photoUrl}
                alt={nome}
                className="h-20 w-20 object-cover rounded-full border-2 border-black/15"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full border-2 border-black/15 flex items-center justify-center font-black text-2xl"
                style={{ background: corAvatar(jogador.name), color: "rgba(0,0,0,.75)" }}
              >
                {iniciais(jogador.name)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-1.5 text-center font-extrabold uppercase tracking-wide text-sm truncate border-t border-black/20 pt-1">
          {nome}
        </div>

        <div className="mt-1.5 grid grid-cols-3 gap-x-2 gap-y-0.5 text-[11px] font-bold">
          {stats.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex items-center justify-center gap-1">
              <span>{valor}</span>
              <span className="opacity-70">{rotulo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
