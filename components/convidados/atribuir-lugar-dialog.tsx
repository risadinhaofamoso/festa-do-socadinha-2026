"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getMapaData, atribuirConviteAoLugar, desvincularLugar } from "@/lib/actions/mapa";
import type { listarConvites } from "@/lib/actions/guests";

type Convite = Awaited<ReturnType<typeof listarConvites>>[number];
type Tables = Awaited<ReturnType<typeof getMapaData>>;

export function AtribuirLugarDialog({
  convite,
  trigger,
}: {
  convite: Convite;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tables, setTables] = useState<Tables>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCarregando(true);
    getMapaData().then((t) => {
      setTables(t);
      setCarregando(false);
    });
  }, [open]);

  async function selecionar(seatId: number) {
    setEnviando(true);
    const res = await atribuirConviteAoLugar({ seatId, inviteId: convite.id });
    setEnviando(false);
    if (res.success) {
      toast.success("Lugar atribuído ao convite.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function remover() {
    setEnviando(true);
    const res = await desvincularLugar(convite.id);
    setEnviando(false);
    if (res.success) {
      toast.success("Lugar desvinculado.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Atribuir lugar — convite #{convite.number} ({convite.attendeeName})
          </DialogTitle>
          <DialogDescription>
            {convite.seat
              ? `Atualmente na mesa ${convite.seat.table.number}, lugar ${convite.seat.seatNumber}. Clique em outro lugar livre para mover.`
              : "Clique em um lugar livre para reservar."}
          </DialogDescription>
        </DialogHeader>

        {convite.seat && (
          <Button variant="outline" size="sm" className="self-start" onClick={remover} disabled={enviando}>
            <X className="h-4 w-4" /> Desvincular lugar atual
          </Button>
        )}

        {carregando ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Carregando mapa...</p>
        ) : (
          <div className="max-h-[400px] overflow-auto flex flex-wrap gap-3 p-1">
            {tables.map((table) => (
              <div key={table.id} className="rounded-lg border bg-card p-2 w-[200px] shrink-0">
                <p className="text-xs font-semibold mb-1.5">
                  Mesa {table.number}
                  {table.label ? ` — ${table.label}` : ""}
                </p>
                <div className="flex flex-wrap gap-1">
                  {table.seats.map((seat) => {
                    const ocupado = seat.invite !== null;
                    const esteConvite = seat.invite?.id === convite.id;
                    return (
                      <button
                        key={seat.id}
                        disabled={ocupado || enviando}
                        onClick={() => selecionar(seat.id)}
                        title={
                          seat.invite
                            ? `${seat.invite.attendeeName} (convite #${seat.invite.number})`
                            : "Livre"
                        }
                        className={cn(
                          "seat",
                          !ocupado && "seat-livre",
                          ocupado && !esteConvite && "seat-reservado opacity-60 cursor-not-allowed",
                          esteConvite && "seat-confirmado"
                        )}
                      >
                        {seat.seatNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
