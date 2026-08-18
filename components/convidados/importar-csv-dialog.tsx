"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { parseCsv } from "@/lib/csv";
import {
  validarImportacaoCsv,
  confirmarImportacaoCsv,
  type LinhaValidacaoCsv,
} from "@/lib/actions/guests";

const EXEMPLO = `titular,atendente,numero,preco,formaPagamento,statusPagamento,brinde
João Silva,Maria Silva,101,120,Pix,PAGO,SOMENTE_CONVITE
João Silva,João Silva,102,180,Pix,PAGO,CONVITE_CAMISA_CANECA
Ana Souza,Ana Souza,103,120,,PENDENTE,SOMENTE_CONVITE`;

export function ImportarCsvDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<LinhaValidacaoCsv[] | null>(null);
  const [processando, setProcessando] = useState(false);

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const conteudo = await file.text();
    setTexto(conteudo);
    setResultados(null);
  }

  async function validar() {
    setProcessando(true);
    setResultados(null);
    try {
      const linhas = parseCsv(texto);
      if (linhas.length === 0) {
        toast.error("Nenhuma linha de dados encontrada no CSV.");
        return;
      }
      const res = await validarImportacaoCsv(linhas);
      setResultados(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ler o CSV.");
    } finally {
      setProcessando(false);
    }
  }

  async function importar() {
    if (!resultados) return;
    const validas = resultados.filter((r) => r.valido && r.dados).map((r) => r.dados!);
    if (validas.length === 0) {
      toast.error("Nenhuma linha válida para importar.");
      return;
    }
    setProcessando(true);
    const res = await confirmarImportacaoCsv(validas);
    setProcessando(false);
    if (res.success) {
      toast.success(`${res.data.importados} convite(s) importado(s).`);
      setOpen(false);
      setTexto("");
      setResultados(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const validas = resultados?.filter((r) => r.valido).length ?? 0;
  const invalidas = resultados?.filter((r) => !r.valido).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4" /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar convites via CSV</DialogTitle>
          <DialogDescription>
            Colunas esperadas: <code>titular, atendente, numero, preco, formaPagamento,
            statusPagamento, brinde</code>. Brinde deve ser <code>SOMENTE_CONVITE</code> ou{" "}
            <code>CONVITE_CAMISA_CANECA</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="arquivo">Arquivo CSV</Label>
            <input
              id="arquivo"
              type="file"
              accept=".csv,text/csv"
              onChange={handleArquivo}
              className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="texto">Ou cole o conteúdo aqui</Label>
            <Textarea
              id="texto"
              rows={7}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setResultados(null);
              }}
              placeholder={EXEMPLO}
              className="font-mono text-xs"
            />
          </div>

          {resultados && (
            <div className="border rounded-md">
              <div className="flex items-center gap-4 border-b px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> {validas} válida(s)
                </span>
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-4 w-4" /> {invalidas} com erro
                </span>
              </div>
              <div className="max-h-[220px] overflow-y-auto divide-y text-sm">
                {resultados.map((r) => (
                  <div key={r.linha} className="px-3 py-1.5 flex gap-2">
                    <span className="text-muted-foreground shrink-0 font-mono">L{r.linha}</span>
                    {r.valido ? (
                      <span>
                        Convite #{r.dados!.numero} — {r.dados!.atendente} (titular:{" "}
                        {r.dados!.titular})
                      </span>
                    ) : (
                      <span className="text-destructive">{r.erro}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={validar} disabled={processando || !texto.trim()}>
            {processando ? "Validando..." : "Validar CSV"}
          </Button>
          <Button onClick={importar} disabled={processando || !resultados || validas === 0}>
            Importar {validas > 0 ? `${validas} convite(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
