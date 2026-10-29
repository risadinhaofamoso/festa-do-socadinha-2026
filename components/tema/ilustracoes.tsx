/*
  Ilustracoes SVG originais no tema do futebol de quarta (dourado/neon).
  Desenhos proprios — nada protegido por direitos autorais.
*/

export function Bola({ className, size = 48 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="44" fill="#fdf6e3" stroke="#0c0c10" strokeWidth="3" />
      <path
        d="M50 22l14 10-5 17H41l-5-17 14-10Z"
        fill="#0c0c10"
      />
      <path d="M50 22V8M64 32l12-8M59 49l15 5M41 49l-15 5M36 32l-12-8" stroke="#0c0c10" strokeWidth="3" />
      <path d="M26 54l-4 15 14 9 11-9-6-15H26Z" fill="#0c0c10" opacity="0.9" />
      <path d="M74 54l4 15-14 9-11-9 6-15h15Z" fill="#0c0c10" opacity="0.9" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#f5c518" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function Trofeu({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M20 10h24v12a12 12 0 0 1-24 0V10Z" fill="currentColor" />
      <path d="M20 14H12v4a8 8 0 0 0 8 8M44 14h8v4a8 8 0 0 1-8 8" stroke="currentColor" strokeWidth="3" fill="none" />
      <rect x="28" y="34" width="8" height="10" fill="currentColor" />
      <rect x="20" y="44" width="24" height="6" rx="2" fill="currentColor" />
      <rect x="16" y="50" width="32" height="5" rx="2" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function Apito({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 30h26l8-6v18l-8-6H8a6 6 0 0 1 0-12Z" fill="currentColor" opacity="0.9" />
      <circle cx="46" cy="33" r="14" fill="currentColor" />
      <circle cx="46" cy="33" r="5" fill="#0c0c10" />
      <path d="M46 19V9M55 22l7-7M57 33h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function Chuteira({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 28c6-2 12-3 20-2 10 1 16 6 28 8 2 .4 2 6 0 8H10a2 2 0 0 1-2-2V28Z" fill="currentColor" opacity="0.9" />
      <path d="M12 22c4 0 6 3 8 6M20 20c4 0 6 3 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M14 44v4M24 44v4M34 44v4M44 44v4" stroke="#0c0c10" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function NuvensAnimadas({ quantidade = 6 }: { quantidade?: number }) {
  const nuvens = Array.from({ length: quantidade }, (_, i) => ({
    id: i,
    top: 6 + ((i * 37) % 70),
    largura: 60 + ((i * 53) % 90),
    duracao: 38 + ((i * 17) % 45),
    atraso: -(i * 9) % 40,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {nuvens.map((n) => (
        <div
          key={n.id}
          className="cloud"
          style={{
            top: `${n.top}%`,
            width: `${n.largura}px`,
            height: `${n.largura * 0.32}px`,
            animationDuration: `${n.duracao}s`,
            animationDelay: `${n.atraso}s`,
          }}
        />
      ))}
    </div>
  );
}
