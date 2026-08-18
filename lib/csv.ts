export function parseCsv(texto: string): Record<string, string>[] {
  const linhas = texto
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");

  if (linhas.length < 2) return [];

  const separador = linhas[0].includes(";") && !linhas[0].includes(",") ? ";" : ",";
  const cabecalho = dividirLinha(linhas[0], separador).map((h) => h.trim());

  return linhas.slice(1).map((linha) => {
    const valores = dividirLinha(linha, separador);
    const registro: Record<string, string> = {};
    cabecalho.forEach((coluna, i) => {
      registro[coluna] = (valores[i] ?? "").trim();
    });
    return registro;
  });
}

function dividirLinha(linha: string, separador: string): string[] {
  const resultado: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (char === separador && !dentroDeAspas) {
      resultado.push(atual);
      atual = "";
    } else {
      atual += char;
    }
  }
  resultado.push(atual);
  return resultado;
}

export function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
