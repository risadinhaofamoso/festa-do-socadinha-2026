"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  PAYMENT_METHOD_OPTIONS,
  type GiftType,
  type PaymentStatus,
} from "@/lib/types";
import {
  criarTitularComConvite,
  criarConvitePorTitularExistente,
  atualizarConvite,
  type listarConvites,
  type listarTitulares,
} from "@/lib/actions/guests";

type Titulares = Awaited<ReturnType<typeof listarTitulares>>;
type Convite = Awaited<ReturnType<typeof listarConvites>>[number];

const SEM_FORMA = "__SEM_FORMA__";

export function ConviteFormDialog({
  titulares,
  convite,
  trigger,
}: {
  titulares: Titulares;
  convite?: Convite;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const editando = Boolean(convite);

  const [modoTitular, setModoTitular] = useState<"existente" | "novo">(
    editando ? "existente" : titulares.length > 0 ? "existente" : "novo"
  );
  const [guestId, setGuestId] = useState<string>(convite ? String(convite.guestId) : "");
  const [novoTitularNome, setNovoTitularNome] = useState("");
  const [novoTitularTelefone, setNovoTitularTelefone] = useState("");
  const [novoTitularObs, setNovoTitularObs] = useState("");

  const [numero, setNumero] = useState(convite ? String(convite.number) : "");
  const [attendeeName, setAttendeeName] = useState(convite?.attendeeName ?? "");
  const [price, setPrice] = useState(convite ? String(convite.price) : "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    (convite?.paymentStatus as PaymentStatus) ?? "PENDENTE"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(convite?.paymentMethod ?? SEM_FORMA);
  const [giftType, setGiftType] = useState<GiftType>(
    (convite?.giftType as GiftType) ?? "SOMENTE_CONVITE"
  );
  const [enviando, setEnviando] = useState(false);

  function resetar() {
    if (editando) return;
    setNumero("");
    setAttendeeName("");
    setPrice("");
    setPaymentStatus("PENDENTE");
    setPaymentMethod(SEM_FORMA);
    setGiftType("SOMENTE_CONVITE");
    setNovoTitularNome("");
    setNovoTitularTelefone("");
    setNovoTitularObs("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const dadosConvite = {
      number: Number(numero),
      attendeeName: attendeeName.trim(),
      price: Number(String(price).replace(",", ".")),
      paymentStatus,
      paymentMethod: paymentMethod === SEM_FORMA ? null : paymentMethod,
      giftType,
    };

    let res;
    if (editando && convite) {
      res = await atualizarConvite({
        id: convite.id,
        guestId: Number(guestId),
        ...dadosConvite,
      });
    } else if (modoTitular === "novo") {
      res = await criarTitularComConvite({
        guest: {
          name: novoTitularNome.trim(),
          phone: novoTitularTelefone.trim() || null,
          notes: novoTitularObs.trim() || null,
        },
        invite: dadosConvite,
      });
    } else {
      if (!guestId) {
        setEnviando(false);
        toast.error("Selecione o titular do convite.");
        return;
      }
      res = await criarConvitePorTitularExistente({
        guestId: Number(guestId),
        ...dadosConvite,
      });
    }

    setEnviando(false);

    if (res.success) {
      toast.success(editando ? "Convite atualizado." : "Convite cadastrado.");
      setOpen(false);
      resetar();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetar();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editando ? `Editar convite #${convite!.number}` : "Novo convite"}</DialogTitle>
          <DialogDescription>
            O número do convite é único e será usado na portaria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {!editando && (
            <div className="grid gap-1.5">
              <Label>Titular do convite</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={modoTitular === "existente" ? "default" : "outline"}
                  onClick={() => setModoTitular("existente")}
                  disabled={titulares.length === 0}
                >
                  Titular existente
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={modoTitular === "novo" ? "default" : "outline"}
                  onClick={() => setModoTitular("novo")}
                >
                  Novo titular
                </Button>
              </div>
            </div>
          )}

          {(editando || modoTitular === "existente") && (
            <div className="grid gap-1.5">
              <Label htmlFor="guestId">Titular</Label>
              <Select value={guestId} onValueChange={setGuestId}>
                <SelectTrigger id="guestId">
                  <SelectValue placeholder="Selecione o titular" />
                </SelectTrigger>
                <SelectContent>
                  {titulares.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!editando && modoTitular === "novo" && (
            <div className="grid gap-3 rounded-md border p-3">
              <div className="grid gap-1.5">
                <Label htmlFor="novoTitularNome">Nome do titular</Label>
                <Input
                  id="novoTitularNome"
                  required
                  value={novoTitularNome}
                  onChange={(e) => setNovoTitularNome(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="novoTitularTelefone">Telefone (opcional)</Label>
                <Input
                  id="novoTitularTelefone"
                  value={novoTitularTelefone}
                  onChange={(e) => setNovoTitularTelefone(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="novoTitularObs">Observações (opcional)</Label>
                <Textarea
                  id="novoTitularObs"
                  value={novoTitularObs}
                  onChange={(e) => setNovoTitularObs(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="numero">Número do convite</Label>
              <Input
                id="numero"
                type="number"
                min={1}
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="attendeeName">Quem vai usar o convite</Label>
            <Input
              id="attendeeName"
              required
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              placeholder="Pode ser diferente do titular"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="paymentStatus">Status de pagamento</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                <SelectTrigger id="paymentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Não informada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_FORMA}>Não informada</SelectItem>
                  {PAYMENT_METHOD_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="giftType">Tipo de brinde</Label>
            <Select value={giftType} onValueChange={(v) => setGiftType(v as GiftType)}>
              <SelectTrigger id="giftType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOMENTE_CONVITE">Somente convite</SelectItem>
                <SelectItem value="CONVITE_CAMISA_CANECA">Convite + camisa e caneca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
