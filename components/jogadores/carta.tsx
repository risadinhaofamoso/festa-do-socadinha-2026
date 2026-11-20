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
  weakFoot?: number;
  skillMoves?: number;
  preferredFoot?: string;
};

/** Fundo da carta por nível, com brilho e profundidade estilo Ultimate Team. */
const FUNDOS: Record<"ouro" | "prata" | "bronze", string> = {
  ouro:
    "radial-gradient(120% 80% at 50% 0%, #fff4c2 0%, #f8d24a 34%, #e4ab21 62%, #a9760f 100%)",
  prata:
    "radial-gradient(120% 80% at 50% 0%, #fbfdff 0%, #dde3ec 34%, #b6becd 64%, #7c8595 100%)",
  bronze:
    "radial-gradient(120% 80% at 50% 0%, #f6cca0 0%, #e2a265 34%, #c97f3c 64%, #8f561f 100%)",
};

/** Rótulos da carta. Goleiro usa as métricas de goleiro. */
function rotulos(posicao: Posicao): [string, string, string, string, string, string] {
  if (posicao === "GOLEIRO") return ["ELA", "MAN", "REP", "REF", "VEL", "POS"];
  return ["RIT", "CHU", "PAS", "DRI", "DEF", "FÍS"];
}

function Estrelinhas({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="tracking-tight">
      {"★".repeat(Math.max(0, Math.min(max, n)))}
      <span className="opacity-30">{"★".repeat(Math.max(0, max - n))}</span>
    </span>
  );
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
  const esquerda: [string, number][] = [
    [r1, jogador.pace],
    [r2, jogador.shooting],
    [r3, jogador.passing],
  ];
  const direita: [string, number][] = [
    [r4, jogador.dribbling],
    [r5, jogador.defending],
    [r6, jogador.physical],
  ];
  const temRodape = jogador.skillMoves != null || jogador.weakFoot != null;

  return (
    <div
      className={cn(
        "fut-brilho relative aspect-[7/10] w-full rounded-[14px] overflow-hidden text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]",
        "ring-1 ring-black/10",
        destaque && "ring-2 ring-[var(--neon-gold)] shadow-[0_0_24px_-4px_rgba(255,203,45,0.6)]",
        className
      )}
      style={{ background: FUNDOS[nivel] }}
    >
      {/* leve textura/vinheta */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_120%,rgba(0,0,0,0.28),transparent_60%)]" />

      <div className="relative h-full w-full px-[7%] pt-[7%] pb-[5%] flex flex-col">
        {/* topo: OVR + posição à esquerda, foto à direita */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center leading-[0.95] w-[30%] shrink-0 pt-1">
            <span className="text-[26px] font-black">{jogador.overall}</span>
            <span className="text-[12px] font-extrabold -mt-0.5">{info.curto}</span>
            <span className="my-1 h-px w-5 bg-black/35" />
            {/* "escudinhos": bola (nação) + posição (clube) */}
            <span className="text-[13px] leading-none">⚽</span>
            <span
              className="mt-1 h-3 w-3 rounded-full ring-1 ring-black/30"
              style={{ background: info.cor }}
            />
          </div>

          <div className="flex-1 flex justify-center items-start">
            {jogador.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={jogador.photoUrl}
                alt={nome}
                className="h-[74px] w-[74px] object-cover rounded-full ring-2 ring-black/15 drop-shadow"
              />
            ) : (
              <div
                className="h-[74px] w-[74px] rounded-full ring-2 ring-black/15 flex items-center justify-center font-black text-2xl"
                style={{ background: corAvatar(jogador.name), color: "rgba(0,0,0,.72)" }}
              >
                {iniciais(jogador.name)}
              </div>
            )}
          </div>
        </div>

        {/* nome */}
        <div className="mt-2 text-center">
          <span className="block font-black uppercase tracking-wide text-[13px] leading-tight truncate border-b border-black/25 pb-1">
            {nome}
          </span>
        </div>

        {/* stats em 2 colunas (estilo FUT) */}
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-[3px] text-[12px] font-bold px-1">
          {esquerda.map(([rot, val], i) => (
            <div key={rot} className="contents">
              <div className="flex items-center gap-1.5 justify-start">
                <span className="tabular-nums w-5 text-right">{val}</span>
                <span className="opacity-70 font-extrabold">{rot}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-start">
                <span className="tabular-nums w-5 text-right">{direita[i][1]}</span>
                <span className="opacity-70 font-extrabold">{direita[i][0]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* rodapé: perna ruim / habilidade */}
        {temRodape && (
          <div className="mt-auto pt-1.5 flex items-center justify-center gap-3 text-[9px] font-bold text-black/70">
            {jogador.skillMoves != null && (
              <span className="flex items-center gap-1">
                HAB <Estrelinhas n={jogador.skillMoves} />
              </span>
            )}
            {jogador.weakFoot != null && (
              <span className="flex items-center gap-1">
                PR <Estrelinhas n={jogador.weakFoot} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
