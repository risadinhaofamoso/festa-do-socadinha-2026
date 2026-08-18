"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  Undo2,
  AlertTriangle,
  Shirt,
  Ticket,
  Armchair,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Confete } from "@/components/tema/confete";
import { Camiseta, Caneca } from "@/components/tema/ilustracoes";
import { formatarMoeda, formatarHora } from "@/lib/format";
import { GIFT_TYPE_LABELS, PAYMENT_STATUS_LABELS, type GiftType, type PaymentStatus } from "@/lib/types";
import {
  buscarParaCheckin,
  confirmarCheckin,
  desfazerCheckin,
  getUltimosCheckins,
  getContadorCheckins,
} from "@/lib/actions/checkin";

type Resultado = Awaited<ReturnType<typeof buscarParaCheckin>>[number];
type Ultimos = Awaited<ReturnType<typeof getUltimosCheckins>>;

export function CheckinClient({
  ultimosIniciais,
  contador,
}: {
  ultimosIniciais: Ultimos;
  contador: { total: number; confirmados: number };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [selecionado, setSelecionado] = useState<Resultado | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ultimos, setUltimos] = useState<Ultimos>(ultimosIniciais);
  const [stats, setStats] = useState(contador);
  const [confete, setConfete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    const timeout = setTimeout(async () => {
      const res = await buscarParaCheckin(query);
      if (!cancelado) {
        setResultados(res);
        setBuscando(false);
      }
    }, 200);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [query]);

  async function recarregarLaterais() {
    const [novosUltimos, novoContador] = await Promise.all([
      getUltimosCheckins(),
      getContadorCheckins(),
    ]);
    setUltimos(novosUltimos);
    setStats(novoContador);
  }

  async function handleConfirmar() {
    if (!selecionado) return;
    setEnviando(true);
    const res = await confirmarCheckin(selecionado.id);
    setEnviando(false);
    if (res.success) {
      toast.success(`Entrada confirmada: ${selecionado.attendeeName}`);
      setConfete(true);
      setSelecionado({ ...selecionado, checkedIn: true, checkedInAt: new Date() });
      setQuery("");
      setResultados([]);
      setTimeout(() => setSelecionado(null), 1800);
      await recarregarLaterais();
      inputRef.current?.focus();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDesfazer(inviteId: number, nome: string) {
    setEnviando(true);
    const res = await desfazerCheckin(inviteId);
    setEnviando(false);
    if (res.success) {
      toast.success(`Check-in de ${nome} desfeito.`);
      if (selecionado?.id === inviteId) {
        setSelecionado({ ...selecionado, checkedIn: false, checkedInAt: null });
      }
      await recarregarLaterais();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const percentual = stats.total > 0 ? Math.round((stats.confirmados / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <Confete ativo={confete} onFim={() => setConfete(false)} />

      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-in</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Busque pelo nome ou número do convite e confirme a entrada.
          </p>
        </div>
        <div className="rounded-xl border bg-card px-5 py-3 min-w-[190px]">
          <p className="text-xs text-muted-foreground">Confirmados</p>
          <p className="text-3xl font-black tabular-nums">
            {stats.confirmados}
            <span className="text-base font-normal text-muted-foreground"> de {stats.total}</span>
          </p>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-2">
            <div
              className="h-full rounded-full progress-stripes transition-all duration-700"
              style={{ width: `${percentual}%`, background: "var(--simpson-yellow)" }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] flex-1 min-h-0">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              ref={inputRef}
              autoFocus
              placeholder="Nome ou número do convite..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelecionado(null);
              }}
              className="h-16 pl-14 text-xl"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSelecionado(null);
                  inputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {!selecionado && query.trim() && (
            <Card>
              <CardContent className="p-2">
                {buscando && (
                  <p className="text-sm text-muted-foreground py-6 text-center">Buscando...</p>
                )}
                {!buscando && resultados.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Nenhum convite encontrado para “{query}”.
                  </p>
                )}
                {!buscando &&
                  resultados.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelecionado(r)}
                      className="w-full flex items-center justify-between gap-3 rounded-md px-3 py-3 text-left hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{r.attendeeName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          Convite #{r.number} · {r.guest.name}
                          {r.seat ? ` · Mesa ${r.seat.table.number}, lugar ${r.seat.seatNumber}` : " · sem lugar"}
                        </p>
                      </div>
                      <Badge variant={r.checkedIn ? "success" : "secondary"} className="shrink-0">
                        {r.checkedIn ? "Já entrou" : "Aguardando"}
                      </Badge>
                    </button>
                  ))}
              </CardContent>
            </Card>
          )}

          {selecionado && (
            <DetalheSelecionado
              convite={selecionado}
              enviando={enviando}
              onConfirmar={handleConfirmar}
              onDesfazer={() => handleDesfazer(selecionado.id, selecionado.attendeeName)}
              onVoltar={() => setSelecionado(null)}
            />
          )}

          {!query.trim() && !selecionado && (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm border rounded-lg border-dashed p-12">
              Digite o nome do convidado ou o número do convite para começar.
            </div>
          )}
        </div>

        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Últimos check-ins</CardTitle>
            <CardDescription>Em ordem cronológica reversa</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {ultimos.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-8 text-center">
                Nenhum check-in feito ainda.
              </p>
            ) : (
              <div className="divide-y">
                {ultimos.map((u) => (
                  <div key={u.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        #{u.number}
                        {u.seat ? ` · Mesa ${u.seat.table.number}/${u.seat.seatNumber}` : ""}
                        {u.checkedInAt ? ` · ${formatarHora(u.checkedInAt)}` : ""}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      title="Desfazer check-in"
                      disabled={enviando}
                      onClick={() => handleDesfazer(u.id, u.attendeeName)}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetalheSelecionado({
  convite,
  enviando,
  onConfirmar,
  onDesfazer,
  onVoltar,
}: {
  convite: Resultado;
  enviando: boolean;
  onConfirmar: () => void;
  onDesfazer: () => void;
  onVoltar: () => void;
}) {
  const pagamentoAlerta = convite.paymentStatus !== "PAGO";
  const comBrinde = convite.giftType === "CONVITE_CAMISA_CANECA";

  return (
    <Card className={cn(convite.checkedIn && "border-success")}>
      <CardContent className="p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-3xl font-bold truncate">{convite.attendeeName}</p>
            <p className="text-muted-foreground mt-1">
              Convite #{convite.number} · Titular: {convite.guest.name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onVoltar}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4 flex items-center gap-3">
            <Armchair className="h-6 w-6 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Lugar</p>
              <p className="text-lg font-semibold">
                {convite.seat
                  ? `Mesa ${convite.seat.table.number}, lugar ${convite.seat.seatNumber}`
                  : "Sem lugar atribuído"}
              </p>
              {convite.seat?.table.label && (
                <p className="text-xs text-muted-foreground">{convite.seat.table.label}</p>
              )}
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg border p-4 flex items-center gap-3",
              comBrinde && "border-primary bg-primary/5"
            )}
          >
            {comBrinde ? (
              <div className="flex gap-1 shrink-0">
                <Camiseta size={28} className="text-primary animate-float" />
                <Caneca size={28} className="text-primary animate-float" />
              </div>
            ) : (
              <Ticket className="h-6 w-6 text-muted-foreground shrink-0" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Brinde</p>
              <p className="text-lg font-semibold">
                {GIFT_TYPE_LABELS[convite.giftType as GiftType]}
              </p>
              {comBrinde && (
                <p className="text-xs text-primary font-bold">Entregar camisa e caneca</p>
              )}
            </div>
          </div>
        </div>

        {pagamentoAlerta && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-destructive">
                Pagamento {PAYMENT_STATUS_LABELS[convite.paymentStatus as PaymentStatus].toLowerCase()}
              </p>
              <p className="text-sm">
                Valor do convite: {formatarMoeda(convite.price)}
                {convite.paymentMethod ? ` · ${convite.paymentMethod}` : ""}
              </p>
            </div>
          </div>
        )}

        {!pagamentoAlerta && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="success">Pago</Badge>
            {formatarMoeda(convite.price)}
            {convite.paymentMethod ? ` · ${convite.paymentMethod}` : ""}
          </div>
        )}

        {convite.checkedIn ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-success font-semibold">
              <CheckCircle2 className="h-6 w-6" />
              Entrada já confirmada
              {convite.checkedInAt ? ` às ${formatarHora(convite.checkedInAt)}` : ""}
            </div>
            <Button variant="outline" onClick={onDesfazer} disabled={enviando}>
              <Undo2 className="h-4 w-4" /> Desfazer check-in
            </Button>
          </div>
        ) : (
          <Button size="lg" className="h-16 text-lg" onClick={onConfirmar} disabled={enviando}>
            <CheckCircle2 className="h-6 w-6" />
            {enviando ? "Confirmando..." : "Confirmar entrada"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
