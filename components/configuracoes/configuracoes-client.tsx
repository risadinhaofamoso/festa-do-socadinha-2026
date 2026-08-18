"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

import {
  criarConfiguracaoInicial,
  adicionarMesas,
  removerMesa,
  editarMesa,
  aplicarLayoutRealDoSalao,
} from "@/lib/actions/config";
import {
  TOTAL_MESAS_LAYOUT,
  TOTAL_LUGARES_LAYOUT,
  TOTAL_MESAS_GRANDES,
} from "@/lib/layout-salao";

type Mesa = {
  id: number;
  number: number;
  label: string | null;
  capacity: number;
  posicionada: boolean;
  ocupados: number;
  totalLugares: number;
};

export function ConfiguracoesClient({ mesasIniciais }: { mesasIniciais: Mesa[] }) {
  const router = useRouter();

  if (mesasIniciais.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PlantaRealCard router={router} />
        <ConfiguracaoInicial router={router} />
      </div>
    );
  }

  const totalLugares = mesasIniciais.reduce((acc, m) => acc + m.totalLugares, 0);
  const totalOcupados = mesasIniciais.reduce((acc, m) => acc + m.ocupados, 0);

  const semPosicao = mesasIniciais.filter((m) => !m.posicionada).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>
            {mesasIniciais.length} mesas cadastradas · {totalLugares} lugares no total ·{" "}
            {totalOcupados} já atribuídos
            {semPosicao > 0 && ` · ${semPosicao} sem posição na planta`}
          </CardDescription>
        </CardHeader>
      </Card>

      <PlantaRealCard router={router} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Mesas</CardTitle>
            <CardDescription>Edite ou remova mesas existentes.</CardDescription>
          </div>
          <AdicionarMesasDialog router={router} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Grupo / família</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Ocupação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mesasIniciais.map((mesa) => (
                <TableRow key={mesa.id}>
                  <TableCell className="font-medium">Mesa {mesa.number}</TableCell>
                  <TableCell>{mesa.label || "—"}</TableCell>
                  <TableCell>{mesa.capacity}</TableCell>
                  <TableCell>
                    {mesa.ocupados}/{mesa.totalLugares}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditarMesaDialog mesa={mesa} router={router} />
                      <RemoverMesaButton mesa={mesa} router={router} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PlantaRealCard({ router }: { router: ReturnType<typeof useRouter> }) {
  const [aplicando, setAplicando] = useState(false);

  async function aplicar() {
    setAplicando(true);
    const res = await aplicarLayoutRealDoSalao();
    setAplicando(false);
    if (res.success) {
      toast.success(
        `Planta aplicada: ${res.data.mesas} mesas e ${res.data.lugares} lugares.`
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Planta real da festa
          </CardTitle>
          <CardDescription className="mt-1.5">
            Monta o salão exatamente como no seu mapa: {TOTAL_MESAS_LAYOUT} mesas (
            {TOTAL_MESAS_LAYOUT - TOTAL_MESAS_GRANDES} de 4 lugares e {TOTAL_MESAS_GRANDES}{" "}
            grandes de 8 lugares ao lado do WC), totalizando {TOTAL_LUGARES_LAYOUT} lugares, já
            posicionadas em volta da pista.
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={aplicando} className="shrink-0">
              {aplicando ? "Aplicando..." : "Aplicar planta"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aplicar a planta real do salão?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso <strong>apaga todas as mesas atuais</strong> e recria as{" "}
                {TOTAL_MESAS_LAYOUT} mesas da planta. Só funciona se nenhum convite estiver
                ocupando lugar — se houver, o sistema avisa e não altera nada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={aplicar} disabled={aplicando}>
                Aplicar planta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
    </Card>
  );
}

function ConfiguracaoInicial({ router }: { router: ReturnType<typeof useRouter> }) {
  const [quantidadeMesas, setQuantidadeMesas] = useState("30");
  const [capacidadePorMesa, setCapacidadePorMesa] = useState("8");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await criarConfiguracaoInicial({
      quantidadeMesas: Number(quantidadeMesas),
      capacidadePorMesa: Number(capacidadePorMesa),
    });
    setEnviando(false);
    if (res.success) {
      toast.success(
        `${quantidadeMesas} mesas com ${capacidadePorMesa} lugares cada foram criadas.`
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração inicial</CardTitle>
        <CardDescription>
          Ainda não há mesas cadastradas. Defina quantas mesas o salão terá e quantos lugares cada
          uma comporta — os lugares serão gerados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 max-w-md">
          <div className="grid gap-1.5">
            <Label htmlFor="quantidadeMesas">Quantidade de mesas</Label>
            <Input
              id="quantidadeMesas"
              type="number"
              min={1}
              required
              value={quantidadeMesas}
              onChange={(e) => setQuantidadeMesas(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="capacidadePorMesa">Lugares por mesa</Label>
            <Input
              id="capacidadePorMesa"
              type="number"
              min={1}
              required
              value={capacidadePorMesa}
              onChange={(e) => setCapacidadePorMesa(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Gerando..." : "Gerar mesas e lugares"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AdicionarMesasDialog({ router }: { router: ReturnType<typeof useRouter> }) {
  const [open, setOpen] = useState(false);
  const [quantidade, setQuantidade] = useState("5");
  const [capacidade, setCapacidade] = useState("8");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await adicionarMesas({ quantidade: Number(quantidade), capacidade: Number(capacidade) });
    setEnviando(false);
    if (res.success) {
      toast.success("Mesas adicionadas com sucesso.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Adicionar mesas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar mesas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="quantidade">Quantidade de novas mesas</Label>
            <Input id="quantidade" type="number" min={1} required value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="capacidade">Lugares por mesa</Label>
            <Input id="capacidade" type="number" min={1} required value={capacidade} onChange={(e) => setCapacidade(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarMesaDialog({
  mesa,
  router,
}: {
  mesa: Mesa;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState(String(mesa.number));
  const [label, setLabel] = useState(mesa.label ?? "");
  const [capacity, setCapacity] = useState(String(mesa.capacity));
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await editarMesa({
      id: mesa.id,
      number: Number(number),
      label: label || null,
      capacity: Number(capacity),
    });
    setEnviando(false);
    if (res.success) {
      toast.success("Mesa atualizada.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar mesa {mesa.number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`number-${mesa.id}`}>Número da mesa</Label>
            <Input id={`number-${mesa.id}`} type="number" min={1} required value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`label-${mesa.id}`}>Nome/etiqueta (opcional)</Label>
            <Input id={`label-${mesa.id}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder='Ex: "Mesa da família Silva"' />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`capacity-${mesa.id}`}>Capacidade (lugares)</Label>
            <Input id={`capacity-${mesa.id}`} type="number" min={1} required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Reduzir a capacidade só é permitido se os lugares removidos não tiverem convites.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoverMesaButton({ mesa, router }: { mesa: Mesa; router: ReturnType<typeof useRouter> }) {
  const [enviando, setEnviando] = useState(false);

  async function handleConfirm() {
    setEnviando(true);
    const res = await removerMesa(mesa.id);
    setEnviando(false);
    if (res.success) {
      toast.success(`Mesa ${mesa.number} removida.`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="outline">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover mesa {mesa.number}?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Só é possível remover mesas sem convites atribuídos aos
            lugares.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={enviando} onClick={handleConfirm}>
            {enviando ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
