/**
 * Planta do salão da festa.
 *
 * As coordenadas vivem num canvas fixo de LARGURA x ALTURA (unidades arbitrárias),
 * na mesma proporção da planta original. O mapa na tela apenas escala esse canvas,
 * então mexer nos números aqui reposiciona tudo sem tocar no componente.
 *
 * Origem (0,0) = canto superior esquerdo.
 */

export const SALAO_LARGURA = 1920;
export const SALAO_ALTURA = 1920;

export type Orientacao = "H" | "V";

export type TipoZona = "pista" | "palco" | "servico" | "banheiro" | "porta" | "corredor";

export type ZonaSalao = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tipo: TipoZona;
  /** Graus. Usado nos corredores escritos na vertical. */
  rotacao?: number;
};

export const ZONAS_SALAO: ZonaSalao[] = [
  { id: "wc-m", label: "WC MASCULINO", x: 1080, y: 18, w: 270, h: 267, tipo: "banheiro" },
  { id: "wc-f", label: "WC FEMININO", x: 1352, y: 18, w: 268, h: 267, tipo: "banheiro" },
  { id: "pista", label: "PISTA", x: 418, y: 690, w: 787, h: 778, tipo: "pista" },
  { id: "bufett", label: "BUFETT", x: 1563, y: 1165, w: 110, h: 375, tipo: "servico", rotacao: 90 },
  { id: "porta", label: "PORTA", x: 8, y: 1550, w: 117, h: 100, tipo: "porta" },
  { id: "guiche", label: "GUICHE", x: 2, y: 1655, w: 338, h: 145, tipo: "servico" },
  { id: "palco", label: "PALCO", x: 420, y: 1660, w: 655, h: 258, tipo: "palco" },
  { id: "camarim", label: "CAMARIM", x: 1078, y: 1785, w: 204, h: 133, tipo: "servico" },
  { id: "copa", label: "COPA", x: 1417, y: 1690, w: 443, h: 228, tipo: "servico" },

  // Corredores: só marcação, não ocupam área clicável
  { id: "corr-1", label: "CORREDOR", x: 440, y: 245, w: 220, h: 26, tipo: "corredor" },
  { id: "corr-2", label: "CORREDOR", x: 430, y: 412, w: 220, h: 26, tipo: "corredor" },
  { id: "corr-3", label: "CORREDOR", x: 60, y: 1040, w: 200, h: 26, tipo: "corredor", rotacao: 90 },
  { id: "corr-4", label: "CORREDOR", x: 1240, y: 940, w: 200, h: 26, tipo: "corredor", rotacao: 90 },
  { id: "corr-5", label: "CORREDOR", x: 1390, y: 800, w: 200, h: 26, tipo: "corredor", rotacao: 90 },
];

export type PosicaoMesa = {
  numero: number;
  x: number;
  y: number;
  capacidade: number;
  orientacao: Orientacao;
};

/** Mesa comum de 4 lugares, deitada. */
export const MESA_H_LARGURA = 110;
export const MESA_H_ALTURA = 46;

/** Mesa comum de 4 lugares, em pé (bloco de cima da planta). */
export const MESA_V_LARGURA = 58;
export const MESA_V_ALTURA = 102;

/** Mesa grande de 8 lugares, na coluna da direita ao lado do WC. */
export const MESA_GRANDE_LARGURA = 177;
export const MESA_GRANDE_ALTURA = 90;

type BlocoGrade = {
  colunas: number[];
  linhas: number[];
  capacidade: number;
  orientacao: Orientacao;
  /** Posições da grade a pular, no formato "linha,coluna" (base 0). */
  pular?: string[];
};

/**
 * Blocos de mesas na ordem em que são numeradas — segue a leitura natural da
 * planta: blocos de cima → coluna da esquerda → direita da pista → mesas grandes.
 */
const BLOCOS: BlocoGrade[] = [
  // Bloco superior: 6 colunas × 2 fileiras, mesas em pé
  {
    colunas: [267, 402, 537, 672, 795, 928],
    linhas: [28, 133],
    capacidade: 4,
    orientacao: "V",
  },
  // Segundo bloco (depois do primeiro corredor): 4 mesas em pé
  {
    colunas: [345, 478, 607, 740],
    linhas: [305],
    capacidade: 4,
    orientacao: "V",
  },
  // Terceiro bloco: fileira de 5 e fileira de 4 (a coluna da esquerda só tem a de cima)
  {
    colunas: [418, 532, 647, 762, 877],
    linhas: [470, 578],
    capacidade: 4,
    orientacao: "V",
    pular: ["1,0"],
  },
  // Coluna solitária da extrema esquerda: 8 mesas deitadas
  {
    colunas: [15],
    linhas: [710, 800, 890, 978, 1068, 1157, 1247, 1337],
    capacidade: 4,
    orientacao: "H",
  },
  // Par de colunas da esquerda: 7 fileiras × 2
  {
    colunas: [183, 293],
    linhas: [710, 800, 890, 978, 1068, 1157, 1247],
    capacidade: 4,
    orientacao: "H",
  },
  // Mesa solta embaixo, entre a coluna solitária e a pista
  {
    colunas: [240],
    linhas: [1337],
    capacidade: 4,
    orientacao: "H",
  },
  // Duas colunas à direita da pista: 7 fileiras cada
  {
    colunas: [1215, 1363],
    linhas: [710, 800, 890, 978, 1068, 1157, 1247],
    capacidade: 4,
    orientacao: "H",
  },
  // Mesas grandes de 8 lugares, coluna da direita
  {
    colunas: [1563, 1740],
    linhas: [345, 483, 620, 758, 895],
    capacidade: 8,
    orientacao: "H",
  },
];

function gerarPosicoes(): PosicaoMesa[] {
  const posicoes: PosicaoMesa[] = [];
  let numero = 1;

  for (const bloco of BLOCOS) {
    const pular = new Set(bloco.pular ?? []);
    bloco.linhas.forEach((y, indiceLinha) => {
      bloco.colunas.forEach((x, indiceColuna) => {
        if (pular.has(`${indiceLinha},${indiceColuna}`)) return;
        posicoes.push({
          numero: numero++,
          x,
          y,
          capacidade: bloco.capacidade,
          orientacao: bloco.orientacao,
        });
      });
    });
  }

  return posicoes;
}

export const LAYOUT_MESAS: PosicaoMesa[] = gerarPosicoes();

export const TOTAL_MESAS_LAYOUT = LAYOUT_MESAS.length;
export const TOTAL_LUGARES_LAYOUT = LAYOUT_MESAS.reduce((soma, m) => soma + m.capacidade, 0);
export const TOTAL_MESAS_GRANDES = LAYOUT_MESAS.filter((m) => m.capacidade > 4).length;

export function dimensoesMesa(capacidade: number, orientacao: Orientacao) {
  if (capacidade > 4) {
    return { largura: MESA_GRANDE_LARGURA, altura: MESA_GRANDE_ALTURA };
  }
  return orientacao === "V"
    ? { largura: MESA_V_LARGURA, altura: MESA_V_ALTURA }
    : { largura: MESA_H_LARGURA, altura: MESA_H_ALTURA };
}

/**
 * Onde desenhar cada lugar em volta da mesa.
 *
 * Mesa deitada: metade dos lugares em cima, metade embaixo.
 * Mesa em pé: metade na lateral esquerda, metade na direita.
 * Em ambos os casos a numeração vai 1..N, começando pelo lado "de cima".
 */
export function posicoesDosLugares(capacidade: number, orientacao: Orientacao) {
  const { largura, altura } = dimensoesMesa(capacidade, orientacao);
  const porLado = Math.ceil(capacidade / 2);
  const afastamento = 10;

  return Array.from({ length: capacidade }, (_, i) => {
    const primeiroLado = i < porLado;
    const indiceNoLado = primeiroLado ? i : i - porLado;

    if (orientacao === "V") {
      const passo = altura / porLado;
      return {
        seatNumber: i + 1,
        x: primeiroLado ? -afastamento : largura + afastamento,
        y: passo * indiceNoLado + passo / 2,
      };
    }

    const passo = largura / porLado;
    return {
      seatNumber: i + 1,
      x: passo * indiceNoLado + passo / 2,
      y: primeiroLado ? -afastamento : altura + afastamento,
    };
  });
}
