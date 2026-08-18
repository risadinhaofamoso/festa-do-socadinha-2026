"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle2,
  Undo2,
  UserPlus,
  Users,
  Maximize2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/format";
import { GIFT_TYPE_LABELS, PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/lib/types";
import type { getMapaData } from "@/lib/actions/mapa";
import {
  atribuirConviteAoLugar,
  desvincularLugar,
  buscarConvitesParaAtribuicao,
} from "@/lib/actions/mapa";
import { confirmarCheckin, desfazerCheckin } from "@/lib/actions/checkin";
import { definirGrupoDaMesa } from "@/lib/actions/config";
import { corDoGrupo, listarGrupos, normalizarGrupo } from "@/lib/grupos";
import {
  SALAO_LARGURA,
  SALAO_ALTURA,
  ZONAS_SALAO,
  dimensoesMesa,
  posicoesDosLugares,
  type Orientacao,
} from "@/lib/layout-salao";

type Tables = Awaited<ReturnType<typeof getMapaData>>;
type TableT = Tables[number];
type SeatT = TableT["seats"][number];
type SearchResult = Awaited<ReturnType<typeof buscarConvitesParaAtribuicao>>[number];

const STATUS_BADGE: Record<PaymentStatus, "success" | "warning"> = {
  PAGO: "success",
  PENDENTE: "warning",
  PARCIAL: "warning",
};

export function MapaClient({ tables }: { tables: Tables }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [zoom, setZoom] = useState(1);
  const [seatDestacado, setSeatDestacado] = useState<number | null>(null);
  const [seatSelecionado, setSeatSelecionado] = useState<{ seat: SeatT; table: TableT } | null>(
    null
  );
  const [modo, setModo] = useState<"atribuir" | "detalhe" | null>(null);
  const [mesaEditandoGrupo, setMesaEditandoGrupo] = useState<TableT | null>(null);
  const seatRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const areaRef = useRef<HTMLDivElement>(null);

  const posicionadas = useMemo(
    () => tables.filter((t) => t.positionX !== null && t.positionY !== null),
    [tables]
  );
  const semPosicao = useMemo(
    () => tables.filter((t) => t.positionX === null || t.positionY === null),
    [tables]
  );
  const grupos = useMemo(() => listarGrupos(tables.map((t) => t.label)), [tables]);

  const totalLugares = tables.reduce((acc, t) => acc + t.seats.length, 0);
  const ocupados = tables.reduce((acc, t) => acc + t.seats.filter((s) => s.invite).length, 0);
  const confirmados = tables.reduce(
    (acc, t) => acc + t.seats.filter((s) => s.invite?.checkedIn).length,
    0
  );

  useEffect(() => {
    if (!busca.trim()) {
      setSeatDestacado(null);
      return;
    }
    const termo = busca.trim().toLowerCase();
    const numero = Number(busca.trim());

    for (const table of tables) {
      for (const seat of table.seats) {
        const invite = seat.invite;
        if (!invite) continue;
        const bate =
          invite.attendeeName.toLowerCase().includes(termo) ||
          invite.guest.name.toLowerCase().includes(termo) ||
          (Number.isFinite(numero) && invite.number === numero);
        if (bate) {
          setSeatDestacado(seat.id);
          seatRefs.current
            .get(seat.id)
            ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          return;
        }
      }
    }
    setSeatDestacado(null);
  }, [busca, tables]);

  function abrirLugar(seat: SeatT, table: TableT) {
    setSeatSelecionado({ seat, table });
    setModo(seat.invite ? "detalhe" : "atribuir");
  }

  function fechar() {
    setSeatSelecionado(null);
    setModo(null);
  }

  function ajustarNaTela() {
    const largura = areaRef.current?.clientWidth ?? SALAO_LARGURA;
    setZoom(Math.min(1.6, Math.max(0.3, (largura - 32) / SALAO_LARGURA)));
  }

  useEffect(() => {
    ajustarNaTela();
    // Ajuste inicial: encaixa a planta inteira na largura disponível.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tables.length === 0) {
    return (
      <div className="border rounded-xl p-12 text-center text-sm text-muted-foreground">
        Nenhuma mesa cadastrada ainda. Vá em <strong>Configurações</strong> e aplique a planta do
        salão.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número do convite..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            title="Diminuir zoom"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.12))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Aumentar zoom"
            onClick={() => setZoom((z) => Math.min(2, z + 0.12))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Encaixar na tela" onClick={ajustarNaTela}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto flex-wrap">
          <Legenda className="lugar-livre" texto="Livre" />
          <Legenda className="lugar-reservado" texto="Reservado" />
          <Legenda className="lugar-confirmado" texto="Presente" />
          <span className="font-medium text-foreground">
            {confirmados} presentes · {ocupados}/{totalLugares} lugares reservados
          </span>
        </div>
      </div>

      {grupos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Grupos:
          </span>
          {grupos.map((g) => (
            <span
              key={g.nome}
              className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5"
              style={{ borderColor: g.cor, color: g.cor }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: g.cor }} />
              {g.nome}
            </span>
          ))}
        </div>
      )}

      <div
        ref={areaRef}
        className="border rounded-xl flex-1 min-h-[560px] overflow-auto salao-fundo p-4"
      >
        <div
          className="relative origin-top-left"
          style={{
            width: SALAO_LARGURA,
            height: SALAO_ALTURA,
            transform: `scale(${zoom})`,
            marginBottom: SALAO_ALTURA * (zoom - 1),
            marginRight: SALAO_LARGURA * (zoom - 1),
          }}
        >
          {ZONAS_SALAO.map((zona) => (
            <div
              key={zona.id}
              className={cn("zona", `zona-${zona.tipo}`)}
              style={{
                left: zona.x,
                top: zona.y,
                width: zona.w,
                height: zona.h,
                fontSize:
                  zona.tipo === "pista"
                    ? 64
                    : zona.tipo === "palco" || zona.id === "copa"
                      ? 44
                      : zona.tipo === "corredor"
                        ? 15
                        : 20,
              }}
            >
              <span
                style={
                  zona.rotacao
                    ? { transform: `rotate(${zona.rotacao}deg)`, whiteSpace: "nowrap" }
                    : undefined
                }
              >
                {zona.label}
              </span>
            </div>
          ))}

          {posicionadas.map((table) => (
            <MesaNoMapa
              key={table.id}
              table={table}
              seatDestacado={seatDestacado}
              seatRefs={seatRefs}
              onClicarLugar={abrirLugar}
              onEditarGrupo={() => setMesaEditandoGrupo(table)}
            />
          ))}
        </div>
      </div>

      {semPosicao.length > 0 && (
        <div className="border rounded-xl p-4 salao-fundo">
          <p className="text-xs text-muted-foreground mb-3">
            {semPosicao.length} mesa(s) sem posição na planta — clique nos lugares normalmente:
          </p>
          <div className="flex flex-wrap gap-8 pt-3">
            {semPosicao.map((table) => (
              <div key={table.id} className="relative" style={{ width: 120, height: 70 }}>
                <MesaNoMapa
                  table={table}
                  seatDestacado={seatDestacado}
                  seatRefs={seatRefs}
                  onClicarLugar={abrirLugar}
                  onEditarGrupo={() => setMesaEditandoGrupo(table)}
                  posicaoRelativa
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {seatSelecionado && modo === "atribuir" && (
        <AtribuirDialog
          seat={seatSelecionado.seat}
          table={seatSelecionado.table}
          onClose={fechar}
          onDone={() => {
            fechar();
            router.refresh();
          }}
        />
      )}

      {seatSelecionado && modo === "detalhe" && seatSelecionado.seat.invite && (
        <DetalheDialog
          seat={seatSelecionado.seat}
          table={seatSelecionado.table}
          onClose={fechar}
          onDone={() => {
            fechar();
            router.refresh();
          }}
        />
      )}

      {mesaEditandoGrupo && (
        <GrupoDialog
          table={mesaEditandoGrupo}
          gruposExistentes={grupos.map((g) => g.nome)}
          onClose={() => setMesaEditandoGrupo(null)}
          onDone={() => {
            setMesaEditandoGrupo(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function MesaNoMapa({
  table,
  seatDestacado,
  seatRefs,
  onClicarLugar,
  onEditarGrupo,
  posicaoRelativa,
}: {
  table: TableT;
  seatDestacado: number | null;
  seatRefs: React.MutableRefObject<Map<number, HTMLButtonElement>>;
  onClicarLugar: (seat: SeatT, table: TableT) => void;
  onEditarGrupo: () => void;
  posicaoRelativa?: boolean;
}) {
  const orientacao = (table.orientation === "V" ? "V" : "H") as Orientacao;
  const { largura, altura } = dimensoesMesa(table.capacity, orientacao);
  const lugares = posicoesDosLugares(table.capacity, orientacao);
  const cor = corDoGrupo(table.label);
  const grupo = normalizarGrupo(table.label);
  const temDestaque = table.seats.some((s) => s.id === seatDestacado);

  return (
    <div
      className="absolute"
      style={{
        left: posicaoRelativa ? 0 : (table.positionX ?? 0),
        top: posicaoRelativa ? 12 : (table.positionY ?? 0),
        width: largura,
        height: altura,
        ["--cor-mesa" as string]: cor,
      }}
    >
      <button
        onClick={onEditarGrupo}
        title={grupo ? `Mesa ${table.number} — ${grupo}` : `Mesa ${table.number} — definir grupo`}
        className={cn("mesa-neon w-full h-full flex items-center justify-center cursor-pointer", {
          "mesa-destacada": temDestaque,
        })}
      >
        <span className="text-[11px] font-bold" style={{ color: cor }}>
          {table.number}
        </span>
      </button>

      {lugares.map((pos) => {
        const seat = table.seats.find((s) => s.seatNumber === pos.seatNumber);
        if (!seat) return null;
        const status = seat.invite ? (seat.invite.checkedIn ? "confirmado" : "reservado") : "livre";
        return (
          <button
            key={seat.id}
            ref={(el) => {
              if (el) seatRefs.current.set(seat.id, el);
              else seatRefs.current.delete(seat.id);
            }}
            title={
              seat.invite
                ? `${seat.invite.attendeeName} — convite #${seat.invite.number}`
                : `Mesa ${table.number}, lugar ${seat.seatNumber} — livre`
            }
            onClick={() => onClicarLugar(seat, table)}
            style={{ left: pos.x, top: pos.y }}
            className={cn("lugar", `lugar-${status}`, {
              "lugar-destacado": seatDestacado === seat.id,
            })}
          />
        );
      })}

      {grupo && (
        <span
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold tracking-wide"
          style={{ top: altura + 16, color: cor }}
        >
          {grupo}
        </span>
      )}
    </div>
  );
}

function Legenda({ className, texto }: { className: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("lugar", className)} style={{ position: "static", transform: "none" }} />
      {texto}
    </span>
  );
}

function GrupoDialog({
  table,
  gruposExistentes,
  onClose,
  onDone,
}: {
  table: TableT;
  gruposExistentes: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [grupo, setGrupo] = useState(table.label ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await definirGrupoDaMesa({ tableId: table.id, grupo });
    setSalvando(false);
    if (res.success) {
      toast.success(
        grupo.trim() ? `Mesa ${table.number} marcada como "${grupo.trim()}".` : "Grupo removido."
      );
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mesa {table.number}</DialogTitle>
          <DialogDescription>
            Dê um nome de grupo ou família para esta mesa. Todas as mesas com o mesmo nome ficam
            na mesma cor no mapa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="grupo">Grupo / família</Label>
            <Input
              id="grupo"
              autoFocus
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              placeholder="Ex: GRUPO VILLELA"
              list="grupos-existentes"
            />
            <datalist id="grupos-existentes">
              {gruposExistentes.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para tirar o grupo e voltar à cor padrão.
            </p>
          </div>
          <div
            className="flex items-center gap-2 text-sm rounded-md border px-3 py-2"
            style={{ borderColor: corDoGrupo(grupo), color: corDoGrupo(grupo) }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: corDoGrupo(grupo) }} />
            Cor da mesa com esse nome
          </div>
          <DialogFooter>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AtribuirDialog({
  seat,
  table,
  onClose,
  onDone,
}: {
  seat: SeatT;
  table: TableT;
  onClose: () => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<SearchResult[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    const timeout = setTimeout(async () => {
      const res = await buscarConvitesParaAtribuicao(query);
      if (!cancelado) {
        setResultados(res);
        setCarregando(false);
      }
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [query]);

  async function selecionar(inviteId: number) {
    setEnviandoId(inviteId);
    const res = await atribuirConviteAoLugar({ seatId: seat.id, inviteId });
    setEnviandoId(null);
    if (res.success) {
      toast.success("Convite atribuído ao lugar.");
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Atribuir convite — Mesa {table.number}, lugar {seat.seatNumber}
          </DialogTitle>
          <DialogDescription>Busque pelo nome do convidado ou número do convite.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Nome ou número do convite..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1 -mx-1 px-1">
          {carregando && <p className="text-sm text-muted-foreground py-4 text-center">Buscando...</p>}
          {!carregando && resultados.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum convite encontrado{query ? "" : " sem lugar atribuído"}.
            </p>
          )}
          {!carregando &&
            resultados.map((r) => (
              <button
                key={r.id}
                onClick={() => selecionar(r.id)}
                disabled={enviandoId !== null}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
              >
                <span>
                  <span className="font-medium">{r.attendeeName}</span>{" "}
                  <span className="text-muted-foreground">
                    (convite #{r.number}, titular {r.guest.name})
                  </span>
                  {r.seat && (
                    <span className="block text-xs text-warning">
                      Já está na mesa {r.seat.table.number}, lugar {r.seat.seatNumber} — será
                      movido.
                    </span>
                  )}
                </span>
                {enviandoId === r.id ? (
                  <span className="text-xs">Atribuindo...</span>
                ) : (
                  <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetalheDialog({
  seat,
  table,
  onClose,
  onDone,
}: {
  seat: SeatT;
  table: TableT;
  onClose: () => void;
  onDone: () => void;
}) {
  const invite = seat.invite!;
  const [enviando, setEnviando] = useState(false);

  async function handleCheckin() {
    setEnviando(true);
    const res = invite.checkedIn ? await desfazerCheckin(invite.id) : await confirmarCheckin(invite.id);
    setEnviando(false);
    if (res.success) {
      toast.success(invite.checkedIn ? "Check-in desfeito." : "Entrada confirmada.");
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDesvincular() {
    setEnviando(true);
    const res = await desvincularLugar(invite.id);
    setEnviando(false);
    if (res.success) {
      toast.success("Lugar desvinculado do convite.");
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Mesa {table.number}, lugar {seat.seatNumber}
            {normalizarGrupo(table.label) ? ` · ${normalizarGrupo(table.label)}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-lg font-semibold">{invite.attendeeName}</p>
          <p className="text-muted-foreground">
            Convite #{invite.number} · Titular: {invite.guest.name}
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant={STATUS_BADGE[invite.paymentStatus as PaymentStatus]}>
              {PAYMENT_STATUS_LABELS[invite.paymentStatus as PaymentStatus]}
            </Badge>
            <Badge variant="outline">
              {GIFT_TYPE_LABELS[invite.giftType as keyof typeof GIFT_TYPE_LABELS]}
            </Badge>
            <Badge variant={invite.checkedIn ? "success" : "secondary"}>
              {invite.checkedIn ? "Check-in feito" : "Aguardando chegada"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Valor: {formatarMoeda(invite.price)}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            onClick={handleCheckin}
            disabled={enviando}
            variant={invite.checkedIn ? "outline" : "default"}
          >
            {invite.checkedIn ? <Undo2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {invite.checkedIn ? "Desfazer check-in" : "Confirmar entrada"}
          </Button>
          <Button onClick={handleDesvincular} disabled={enviando} variant="outline">
            <X className="h-4 w-4" /> Desvincular lugar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
