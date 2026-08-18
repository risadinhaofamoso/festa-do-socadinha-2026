/*
  Ilustrações SVG originais no estilo da festa (amarelo/azul, rosquinha, nuvens).
  Desenhos próprios — nenhum personagem protegido por direitos autorais.
*/

export function Rosquinha({ className, size = 48 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="42" fill="#E8A33D" />
      <path
        d="M50 12c21 0 38 17 38 38S71 88 50 88 12 71 12 50s17-38 38-38Z"
        fill="#F2B75B"
      />
      <path
        d="M50 15c19.3 0 35 15.7 35 35 0 3.4-.5 6.6-1.4 9.7-1 3.3-5.3 3.3-7.4.9-2.4-2.8-6.6-3-9.2-.4-2.4 2.4-6.4 2.2-8.6-.4-2.4-2.9-6.9-2.9-9.3 0-2.2 2.6-6.2 2.8-8.6.4-2.6-2.6-6.8-2.4-9.2.4-2.1 2.4-6.4 2.4-7.4-.9A35.2 35.2 0 0 1 15 50c0-19.3 15.7-35 35-35Z"
        fill="#FF9DBB"
      />
      <circle cx="50" cy="50" r="15" fill="#C98A2E" />
      <circle cx="50" cy="50" r="13" fill="#FDF6E3" />
      <g>
        <rect x="33" y="27" width="7" height="3" rx="1.5" fill="#4FC3F7" transform="rotate(-25 33 27)" />
        <rect x="58" y="26" width="7" height="3" rx="1.5" fill="#8BC34A" transform="rotate(20 58 26)" />
        <rect x="24" y="42" width="7" height="3" rx="1.5" fill="#FFEB3B" transform="rotate(60 24 42)" />
        <rect x="70" y="41" width="7" height="3" rx="1.5" fill="#FF7043" transform="rotate(-50 70 41)" />
        <rect x="44" y="20" width="7" height="3" rx="1.5" fill="#AB47BC" transform="rotate(10 44 20)" />
        <rect x="64" y="55" width="7" height="3" rx="1.5" fill="#4FC3F7" transform="rotate(35 64 55)" />
        <rect x="27" y="57" width="7" height="3" rx="1.5" fill="#8BC34A" transform="rotate(-40 27 57)" />
      </g>
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

export function Camiseta({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M22 8 12 14l-4 12 8 3 2-5v32h28V24l2 5 8-3-4-12L42 8l-10 6-10-6Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M22 8c0 5.5 4.5 10 10 10s10-4.5 10-10" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export function Caneca({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="18" width="34" height="34" rx="5" fill="currentColor" opacity="0.9" />
      <path d="M44 26h6a7 7 0 0 1 0 14h-6" stroke="currentColor" strokeWidth="4" fill="none" />
      <path d="M20 10c0 3-3 3-3 6M28 10c0 3-3 3-3 6M36 10c0 3-3 3-3 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
