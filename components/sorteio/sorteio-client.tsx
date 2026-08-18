"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Gift,
  Trophy,
  Users,
  PackageCheck,
  PackageX,
  Trash2,
  Pencil,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { formatarHora } from "@/lib/format";
import { Confete } from "@/components/tema/confete";
import { Rosquinha } from "@/components/tema/ilustracoes";
import {
  sortearVencedor,
  registrarSorteio,
  marcarEntrega,
  removerSorteio,
  atualizarPremio,
  type listarElegiveis,
  type listarSorteios,
  type getSorteioStats,
} from "@/lib/actions/sorteio";

type Elegiveis = Awaited<ReturnType<typeof listarElegiveis>>;
type Sorteios = Awaited<ReturnType<typeof listarSorteios>>;
type Stats = Awaited<ReturnType<typeof getSorteioStats>>;

const ITEM_LARGURA = 190; // 180px do card + 10px de espaçamento
const TAMANHO_ESTEIRA = 55;
const INDICE_VENCEDOR = 48;
const DURACAO_MS = 5200;

type Vencedor = { inviteId: number; number: number; attendeeName: string };

export function SorteioClient({
  elegiveis,
  sorteios,
  stats,
  premiosUsados,
}: {
  elegiveis: Elegiveis;
  sorteios: Sorteios;
  stats: Stats;
  premiosUsados: string[];
}) {
  const router = useRouter();
  const [girando, setGirando] = useState(false);
  const [esteira, setEsteira] = useState<Elegiveis>([]);
  const [deslocamento, setDeslocamento] = useState(0);
  const [transicao, setTransicao] = useState("none");
  const [vencedor, setVencedor] = useState<Vencedor | null>(null);
  const [confete, setConfete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Esteira parada (antes do primeiro giro): mostra alguns elegíveis
  const esteiraVisivel = esteira.length > 0 ? esteira : elegiveis.slice(0, 20);

  async function girar() {
    if (girando || elegiveis.length === 0) return;
    setGirando(true);
    setVencedor(null);

    const res = await sortearVencedor();
    if (!res.success) {
      setGirando(false);
      toast.error(res.error);
      return;
    }

    const ganhador = elegiveis.find((e) => e.id === res.data.inviteId);
    if (!ganhador) {
      setGirando(false);
      toast.error("O vencedor sorteado não está mais na lista. Atualize a página.");
      router.refresh();
      return;
    }

    // Monta a esteira com participantes aleatórios e coloca o vencedor na posição fixa
    const nova: Elegiveis = Array.from(
      { length: TAMANHO_ESTEIRA },
      () => elegiveis[Math.floor(Math.random() * elegiveis.length)]
    );
    nova[INDICE_VENCEDOR] = ganhador;
    setEsteira(nova);

    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const larguraContainer = containerRef.current?.offsetWidth ?? 800;
    // Pequeno desvio aleatório para não parar sempre no centro exato
    const desvio = (Math.random() - 0.5) * (ITEM_LARGURA * 0.5);
    const alvo =
      -(INDICE_VENCEDOR * ITEM_LARGURA) + larguraContainer / 2 - ITEM_LARGURA / 2 + desvio;

    if (semAnimacao) {
      setTransicao("none");
      setDeslocamento(alvo);
      finalizar(res.data);
      return;
    }

    // Reposiciona no início sem animação e, no tick seguinte, anima até o alvo.
    // Usa setTimeout (e não requestAnimationFrame) de propósito: rAF não dispara
    // quando a aba está em segundo plano, o que deixaria o sorteio travado.
    setTransicao("none");
    setDeslocamento(0);

    setTimeout(() => {
      setTransicao(`transform ${DURACAO_MS}ms cubic-bezier(0.09, 0.72, 0.13, 1)`);
      setDeslocamento(alvo);
      setTimeout(() => finalizar(res.data), DURACAO_MS + 250);
    }, 60);
  }

  function finalizar(dados: Vencedor) {
    setGirando(false);
    setVencedor(dados);
    setConfete(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Confete ativo={confete} onFim={() => setConfete(false)} />

      <div className="flex flex-wrap items-start justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Sorteio de brindes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Só entram na roleta os convidados que já fizeram check-in. Quem é sorteado sai
            automaticamente — cada pessoa ganha uma vez só.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardEstatistica
          icone={Users}
          titulo="Na roleta agora"
          valor={stats.elegiveis}
          rodape={`de ${stats.naFesta} presentes na festa`}
          destaque
        />
        <CardEstatistica
          icone={Trophy}
          titulo="Já sorteados"
          valor={stats.sorteados}
          rodape="não voltam para a roleta"
        />
        <CardEstatistica
          icone={PackageCheck}
          titulo="Prêmios entregues"
          valor={stats.entregues}
          rodape="já foram para a mão do ganhador"
        />
        <CardEstatistica
          icone={PackageX}
          titulo="A entregar"
          valor={stats.pendentesEntrega}
          rodape="prêmios pendentes"
        />
      </div>

      <Card className="overflow-hidden animate-fade-up">
        <CardContent className="p-0">
          {elegiveis.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Rosquinha size={56} className="opacity-60" />
              <p className="font-semibold">Ninguém disponível para sortear</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {stats.naFesta === 0
                  ? "Ainda não há convidados com check-in feito. Assim que as pessoas forem chegando e você der baixa na portaria, elas entram automaticamente na roleta."
                  : "Todos os presentes já foram sorteados. Para sortear alguém de novo, remova um sorteio da lista abaixo."}
              </p>
            </div>
          ) : (
            <>
              <div className="relative sky-bg py-8">
                {/* Marcador central */}
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 flex flex-col items-center justify-between py-1 pointer-events-none">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-destructive" />
                  <div className="w-1 flex-1 bg-destructive/70" />
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-destructive" />
                </div>

                <div ref={containerRef} className="relative overflow-hidden">
                  <div
                    className="flex"
                    style={{
                      transform: `translateX(${deslocamento}px)`,
                      transition: transicao,
                    }}
                  >
                    {esteiraVisivel.map((p, i) => (
                      <div
                        key={`${p.id}-${i}`}
                        className="shrink-0 rounded-xl border-2 bg-card p-3 flex flex-col justify-between shadow-sm"
                        style={{ width: 180, height: 112, marginRight: 10 }}
                      >
                        <p className="font-bold text-sm leading-tight line-clamp-2">
                          {p.attendeeName}
                        </p>
                        <div>
                          <p className="text-xs text-muted-foreground">Convite #{p.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.seat
                              ? `Mesa ${p.seat.table.number}, lugar ${p.seat.seatNumber}`
                              : "Sem lugar"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-t">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{elegiveis.length}</span>{" "}
                  pessoa(s) concorrendo agora
                </p>
                <Button size="lg" className="h-14 px-8 text-lg" onClick={girar} disabled={girando}>
                  <Play className="h-5 w-5" />
                  {girando ? "Sorteando..." : "Girar roleta"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {vencedor && (
        <DialogVencedor
          vencedor={vencedor}
          premiosUsados={premiosUsados}
          onFechar={() => setVencedor(null)}
          onSalvo={() => {
            setVencedor(null);
            setEsteira([]);
            setDeslocamento(0);
            setTransicao("none");
            router.refresh();
          }}
        />
      )}

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">Sorteados e prêmios</CardTitle>
          <CardDescription>
            {sorteios.length === 0
              ? "Nenhum sorteio realizado ainda."
              : `${sorteios.length} sorteio(s) · ${stats.pendentesEntrega} prêmio(s) a entregar`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sorteios.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Gire a roleta para sortear o primeiro brinde.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Nº</TableHead>
                  <TableHead>Ganhador</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorteios.map((s) => (
                  <LinhaSorteio key={s.id} sorteio={s} premiosUsados={premiosUsados} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CardEstatistica({
  icone: Icone,
  titulo,
  valor,
  rodape,
  destaque,
}: {
  icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  valor: number;
  rodape?: string;
  destaque?: boolean;
}) {
  return (
    <Card className={cn("card-hover animate-pop-in", destaque && "border-primary")}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icone className="h-4 w-4" /> {titulo}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{valor}</CardTitle>
      </CardHeader>
      {rodape && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{rodape}</p>
        </CardContent>
      )}
    </Card>
  );
}

function DialogVencedor({
  vencedor,
  premiosUsados,
  onFechar,
  onSalvo,
}: {
  vencedor: Vencedor;
  premiosUsados: string[];
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [premio, setPremio] = useState("");
  const [entregue, setEntregue] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await registrarSorteio({
      inviteId: vencedor.inviteId,
      prize: premio,
      delivered: entregue,
    });
    setSalvando(false);
    if (res.success) {
      toast.success(`${vencedor.attendeeName} ganhou: ${premio.trim()}`);
      onSalvo();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-sm font-normal text-muted-foreground">
            🎉 Ganhador do sorteio
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-2 animate-pop-in">
          <p className="text-3xl font-black leading-tight">{vencedor.attendeeName}</p>
          <p className="text-muted-foreground mt-1">Convite #{vencedor.number}</p>
        </div>

        <form onSubmit={salvar} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="premio">Qual foi o prêmio?</Label>
            <Input
              id="premio"
              autoFocus
              required
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              placeholder="Ex: Caneca personalizada"
              list="premios-usados"
            />
            <datalist id="premios-usados">
              {premiosUsados.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={entregue}
              onChange={(e) => setEntregue(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Prêmio já foi entregue agora
          </label>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onFechar} disabled={salvando}>
              Descartar sorteio
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar ganhador"}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center -mt-1">
            Se descartar, nada é gravado e a pessoa continua na roleta.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinhaSorteio({
  sorteio,
  premiosUsados,
}: {
  sorteio: Sorteios[number];
  premiosUsados: string[];
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [premio, setPremio] = useState(sorteio.prize);

  async function alternarEntrega() {
    setOcupado(true);
    const res = await marcarEntrega({ drawId: sorteio.id, delivered: !sorteio.delivered });
    setOcupado(false);
    if (res.success) {
      toast.success(sorteio.delivered ? "Marcado como não entregue." : "Prêmio marcado como entregue.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function salvarPremio(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    const res = await atualizarPremio({ drawId: sorteio.id, prize: premio });
    setOcupado(false);
    if (res.success) {
      toast.success("Prêmio atualizado.");
      setEditando(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function remover() {
    setOcupado(true);
    const res = await removerSorteio(sorteio.id);
    setOcupado(false);
    if (res.success) {
      toast.success(`Sorteio removido. ${sorteio.invite.attendeeName} voltou para a roleta.`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-mono font-medium">{sorteio.invite.number}</TableCell>
      <TableCell>
        <p className="font-medium">{sorteio.invite.attendeeName}</p>
        <p className="text-xs text-muted-foreground">{sorteio.invite.guest.name}</p>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {sorteio.invite.seat
          ? `Mesa ${sorteio.invite.seat.table.number}, lugar ${sorteio.invite.seat.seatNumber}`
          : "—"}
      </TableCell>
      <TableCell>
        {editando ? (
          <form onSubmit={salvarPremio} className="flex gap-1">
            <Input
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              className="h-8 w-40"
              list={`premios-${sorteio.id}`}
              autoFocus
            />
            <datalist id={`premios-${sorteio.id}`}>
              {premiosUsados.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <Button type="submit" size="sm" disabled={ocupado}>
              OK
            </Button>
          </form>
        ) : (
          <span className="font-medium">{sorteio.prize}</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatarHora(sorteio.drawnAt)}
      </TableCell>
      <TableCell>
        <button onClick={alternarEntrega} disabled={ocupado} title="Alternar entrega">
          <Badge variant={sorteio.delivered ? "success" : "warning"} className="cursor-pointer">
            {sorteio.delivered ? "Entregue" : "A entregar"}
          </Badge>
        </button>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="outline"
            title="Editar prêmio"
            onClick={() => setEditando((v) => !v)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="outline" title="Remover sorteio">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remover o sorteio de {sorteio.invite.attendeeName}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  O registro do prêmio “{sorteio.prize}” será apagado e a pessoa volta a
                  concorrer nos próximos sorteios.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remover} disabled={ocupado}>
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
