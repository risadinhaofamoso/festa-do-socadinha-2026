"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { baixarCsv } from "@/lib/csv";
import { gerarCsvFinanceiro } from "@/lib/actions/financeiro";

export function ExportarCsvButton() {
  const [gerando, setGerando] = useState(false);

  async function handleClick() {
    setGerando(true);
    try {
      const csv = await gerarCsvFinanceiro();
      const data = new Date().toISOString().slice(0, 10);
      baixarCsv(csv, `relatorio-financeiro-${data}.csv`);
      toast.success("Relatório exportado.");
    } catch {
      toast.error("Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={gerando} variant="outline">
      <Download className="h-4 w-4" />
      {gerando ? "Gerando..." : "Exportar CSV"}
    </Button>
  );
}
