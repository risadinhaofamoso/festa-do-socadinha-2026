import { cn } from "@/lib/utils";
import { iniciais, corAvatar } from "@/lib/jogadores";

/** Foto do jogador, ou as iniciais num circulo colorido quando nao tem foto. */
export function Avatar({
  nome,
  foto,
  size = 48,
  className,
}: {
  nome: string;
  foto?: string | null;
  size?: number;
  className?: string;
}) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={foto}
        alt={nome}
        width={size}
        height={size}
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center font-bold text-black/80",
        className
      )}
      style={{
        width: size,
        height: size,
        background: corAvatar(nome),
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </div>
  );
}
