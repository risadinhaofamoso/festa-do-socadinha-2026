"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Upload, Armchair } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { formatarMoeda } from "@/lib/format";
import {
  GIFT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type GiftType,
  type PaymentStatus,
} from "@/lib/types";
import { excluirConvite, type listarConvites, type listarTitulares } from "@/lib/actions/guests";
import type { listarMesasComOcupacao } from "@/lib/actions/config";
import { ConviteFormDialog } from "@/components/convidados/convite-form-dialog";
import { ImportarCsvDialog } from "@/components/convidados/importar-csv-dialog";
import { AtribuirLugarDialog } from "@/components/convidados/atribuir-lugar-dialog";

type Convites = Awaited<ReturnType<typeof listarConvites>>;
type Titulares = Awaited<ReturnType<typeof listarTitulares>>;
type Mesas = Awaited<ReturnType<typeof listarMesasComOcupacao>>;

const STATUS_BADGE: Record<PaymentStatus, "success" | "warning"> = {
  PAGO: "success",
  PENDENTE: "warning",
  PARCIAL: "warning",
};

export function ConvidadosClient({
  convitesIniciais,
  titulares,
  mesas,
}: {
  convitesIniciais: Convites;
  titulares: Titulares;
  mesas: Mesas;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<PaymentStatus | "TODOS">("TODOS");
  const [filtroBrinde, setFiltroBrinde] = useState<GiftType | "TODOS">("TODOS");
  const [filtroCheckin, setFiltroCheckin] = useState<"TODOS" | "SIM" | "NAO">("TODOS");
  const [filtroMesa, setFiltroMesa] = useState<string>("TODOS");

  const convitesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const numero = Number(busca.trim());

    return convitesIniciais.filter((c) => {
      if (filtroStatus !== "TODOS" && c.paymentStatus !== filtroStatus) return false;
      if (filtroBrinde !== "TODOS" && c.giftType !== filtroBrinde) return false;
      if (filtroCheckin !== "TODOS" && c.checkedIn !== (filtroCheckin === "SIM")) return false;
      if (filtroMesa !== "TODOS") {
        if (filtroMesa === "SEM_LUGAR") {
          if (c.seat) return false;
        } else if (String(c.seat?.tableId ?? "") !== filtroMesa) {
          return false;
        }
      }
      if (termo) {
        const bate =
          c.attendeeName.toLowerCase().includes(termo) ||
          c.guest.name.toLowerCase().includes(termo) ||
          (Number.isFinite(numero) && c.number === numero);
        if (!bate) return false;
      }
      return true;
    });
  }, [convitesIniciais, busca, filtroStatus, filtroBrinde, filtroCheckin, filtroMesa]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as PaymentStatus | "TODOS")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os pagamentos</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="PARCIAL">Parcial</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroBrinde} onValueChange={(v) => setFiltroBrinde(v as GiftType | "TODOS")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Brinde" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os brindes</SelectItem>
            <SelectItem value="SOMENTE_CONVITE">Somente convite</SelectItem>
            <SelectItem value="CONVITE_CAMISA_CANECA">Convite + camisa e caneca</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroCheckin} onValueChange={(v) => setFiltroCheckin(v as "TODOS" | "SIM" | "NAO")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Check-in" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="SIM">Já chegaram</SelectItem>
            <SelectItem value="NAO">Não chegaram</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroMesa} onValueChange={setFiltroMesa}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Mesa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas as mesas</SelectItem>
            <SelectItem value="SEM_LUGAR">Sem lugar</SelectItem>
            {mesas.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                Mesa {m.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <ImportarCsvDialog />
          <ConviteFormDialog
            titulares={titulares}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Novo convite
              </Button>
            }
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {convitesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {convitesIniciais.length === 0
                ? "Nenhum convite cadastrado ainda. Crie o primeiro em “Novo convite” ou importe um CSV."
                : "Nenhum convite corresponde aos filtros selecionados."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Nº</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Quem vai usar</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Brinde</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convitesFiltrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.number}</TableCell>
                    <TableCell>{c.guest.name}</TableCell>
                    <TableCell className="font-medium">{c.attendeeName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.seat ? `Mesa ${c.seat.table.number}, lugar ${c.seat.seatNumber}` : "—"}
                    </TableCell>
                    <TableCell>{formatarMoeda(c.price)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[c.paymentStatus as PaymentStatus]}>
                        {PAYMENT_STATUS_LABELS[c.paymentStatus as PaymentStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {GIFT_TYPE_LABELS[c.giftType as GiftType]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.checkedIn ? "success" : "secondary"}>
                        {c.checkedIn ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <AtribuirLugarDialog
                          convite={c}
                          trigger={
                            <Button size="icon" variant="outline" title="Atribuir lugar">
                              <Armchair className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <ConviteFormDialog
                          titulares={titulares}
                          convite={c}
                          trigger={
                            <Button size="icon" variant="outline" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <ExcluirConviteButton id={c.id} numero={c.number} router={router} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Mostrando {convitesFiltrados.length} de {convitesIniciais.length} convites.
      </p>
    </div>
  );
}

function ExcluirConviteButton({
  id,
  numero,
  router,
}: {
  id: number;
  numero: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [enviando, setEnviando] = useState(false);

  async function handleConfirm() {
    setEnviando(true);
    const res = await excluirConvite(id);
    setEnviando(false);
    if (res.success) {
      toast.success(`Convite #${numero} excluído.`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="outline" title="Excluir">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir convite #{numero}?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. O lugar reservado, se houver, ficará livre novamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={enviando} onClick={handleConfirm}>
            {enviando ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
