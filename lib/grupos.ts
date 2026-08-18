/**
 * Cores dos grupos/famílias no mapa.
 *
 * A mesa não guarda cor no banco — a cor é derivada do nome do grupo
 * (campo `label` da mesa). Assim, todas as mesas do "GRUPO VILLELA" saem
 * automaticamente na mesma cor, sem ninguém precisar escolher nada.
 *
 * Mesa sem grupo fica na cor padrão (neutra).
 */

export const CORES_GRUPO = [
  { nome: "Verde", cor: "#4ade80" },
  { nome: "Vermelho", cor: "#f87171" },
  { nome: "Azul", cor: "#60a5fa" },
  { nome: "Roxo", cor: "#c084fc" },
  { nome: "Laranja", cor: "#fb923c" },
  { nome: "Amarelo", cor: "#facc15" },
  { nome: "Ciano", cor: "#22d3ee" },
  { nome: "Rosa", cor: "#f472b6" },
  { nome: "Lima", cor: "#a3e635" },
  { nome: "Turquesa", cor: "#2dd4bf" },
  { nome: "Âmbar", cor: "#fbbf24" },
  { nome: "Índigo", cor: "#818cf8" },
] as const;

export const COR_SEM_GRUPO = "#94a3b8";

/** Hash estável: o mesmo nome sempre devolve a mesma cor, entre sessões. */
function hashTexto(texto: string) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash << 5) - hash + texto.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function normalizarGrupo(label: string | null | undefined) {
  const limpo = (label ?? "").trim();
  return limpo.length > 0 ? limpo : null;
}

export function corDoGrupo(label: string | null | undefined) {
  const grupo = normalizarGrupo(label);
  if (!grupo) return COR_SEM_GRUPO;
  return CORES_GRUPO[hashTexto(grupo.toUpperCase()) % CORES_GRUPO.length].cor;
}

/** Lista de grupos distintos com sua cor, para legenda e filtros. */
export function listarGrupos(labels: (string | null)[]) {
  const grupos = new Map<string, string>();
  for (const label of labels) {
    const grupo = normalizarGrupo(label);
    if (grupo && !grupos.has(grupo)) grupos.set(grupo, corDoGrupo(grupo));
  }
  return Array.from(grupos.entries())
    .map(([nome, cor]) => ({ nome, cor }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
