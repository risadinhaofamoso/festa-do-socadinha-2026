"use client";

import { useEffect, useState } from "react";

const CORES = ["#FFD90F", "#3B7DD8", "#FF9DBB", "#8BC34A", "#FF7043", "#AB47BC"];

type Particula = { id: number; left: number; cor: string; duracao: number; atraso: number };

export function Confete({ ativo, onFim }: { ativo: boolean; onFim?: () => void }) {
  const [particulas, setParticulas] = useState<Particula[]>([]);

  useEffect(() => {
    if (!ativo) {
      setParticulas([]);
      return;
    }

    setParticulas(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        cor: CORES[i % CORES.length],
        duracao: 1.6 + Math.random() * 1.4,
        atraso: Math.random() * 0.4,
      }))
    );

    const timer = setTimeout(() => {
      setParticulas([]);
      onFim?.();
    }, 3200);

    return () => clearTimeout(timer);
  }, [ativo, onFim]);

  if (particulas.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true">
      {particulas.map((p) => (
        <span
          key={p.id}
          className="confete"
          style={{
            left: `${p.left}%`,
            background: p.cor,
            animationDuration: `${p.duracao}s`,
            animationDelay: `${p.atraso}s`,
            borderRadius: p.id % 3 === 0 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}
