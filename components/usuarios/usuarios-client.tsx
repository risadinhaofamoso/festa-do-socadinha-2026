"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Pencil, Camera, Wand2, Power, Trash2 } from "lucide-react";
import { Avatar } from "@/components/jogadores/avatar";
import { Carta } from "@/components/jogadores/carta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { POSICOES, POSICAO_INFO, PE_PREFERIDO, type Posicao } from "@/lib/types";
import { gerarAtributos } from "@/lib/jogadores";
import { criarJogador, atualizarJogador, alternarAtivo, removerJogador } from "@/lib/actions/jogadores";

type Jogador = {
  id: number;
  name: string;
  nickname: string | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  crossing: number;
  preferredFoot: string;
  weakFoot: number;
  skillMoves: number;
};

const vazio = (): Jogador => ({
  id: 0,
  name: "",
  nickname: "",
  position: "MEIA",
  photoUrl: null,
  active: true,
  overall: 72,
  pace: 72,
  shooting: 72,
  passing: 72,
  dribbling: 72,
  defending: 72,
  physical: 72,
  crossing: 72,
  preferredFoot: "D",
  weakFoot: 3,
  skillMoves: 3,
});

/** Reduz a foto para 256px e devolve um data URL JPEG leve. */
function processarFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const lado = 256;
        const canvas = document.createElement("canvas");
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        const escala = Math.max(lado / img.width, lado / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CampoNumero({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{rotulo}</Label>
      <Input
        type="number"
        min={0}
        max={99}
        value={valor}
        onChange={(e) => onChange(Math.max(0, Math.min(99, Number(e.target.value))))}
        className="h-9"
      />
    </div>
  );
}

function FormJogador({
  inicial,
  onFechar,
}: {
  inicial: Jogador;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [salvando, start] = useTransition();
  const [j, setJ] = useState<Jogador>(inicial);
  const fileRef = useRef<HTMLInputElement>(null);
  const editando = inicial.id > 0;

  const set = <K extends keyof Jogador>(k: K, v: Jogador[K]) => setJ((p) => ({ ...p, [k]: v }));

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processarFoto(file);
      set("photoUrl", dataUrl);
    } catch {
      toast.error("Não consegui ler essa imagem.");
    }
  }

  function sugerir() {
    const a = gerarAtributos(j.overall, j.position as Posicao, j.name || "jogador");
    setJ((p) => ({
      ...p,
      pace: a.pace,
      shooting: a.shooting,
      passing: a.passing,
      dribbling: a.dribbling,
      defending: a.defending,
      physical: a.physical,
      crossing: a.crossing,
    }));
    toast.success("Atributos sugeridos pela posição e overall.");
  }

  function salvar() {
    const payload = {
      name: j.name,
      nickname: j.nickname || "",
      position: j.position,
      photoUrl: j.photoUrl || "",
      active: j.active,
      overall: j.overall,
      pace: j.pace,
      shooting: j.shooting,
      passing: j.passing,
      dribbling: j.dribbling,
      defending: j.defending,
      physical: j.physical,
      crossing: j.crossing,
      preferredFoot: j.preferredFoot,
      weakFoot: j.weakFoot,
      skillMoves: j.skillMoves,
    };
    start(async () => {
      const r = editando ? await atualizarJogador(j.id, payload) : await criarJogador(payload);
      if (r.success) {
        toast.success(editando ? "Jogador atualizado." : "Jogador cadastrado!");
        onFechar();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="grid md:grid-cols-[170px_1fr] gap-5">
      <div className="space-y-3">
        <div className="w-[150px] mx-auto">
          <Carta jogador={{ ...j, id: j.id || -1 }} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4" /> {j.photoUrl ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {j.photoUrl && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => set("photoUrl", null)}>
            Remover foto
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs">Nome</Label>
            <Input value={j.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do jogador" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs">Apelido (opcional)</Label>
            <Input value={j.nickname ?? ""} onChange={(e) => set("nickname", e.target.value)} placeholder="Como é chamado" />
          </div>
          <div>
            <Label className="text-xs">Posição</Label>
            <Select value={j.position} onValueChange={(v) => set("position", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSICOES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {POSICAO_INFO[p].rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CampoNumero rotulo="Overall" valor={j.overall} onChange={(v) => set("overall", v)} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Atributos da carta</span>
          <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={sugerir}>
            <Wand2 className="h-3.5 w-3.5" /> Sugerir
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <CampoNumero rotulo="Ritmo" valor={j.pace} onChange={(v) => set("pace", v)} />
          <CampoNumero rotulo="Chute" valor={j.shooting} onChange={(v) => set("shooting", v)} />
          <CampoNumero rotulo="Passe" valor={j.passing} onChange={(v) => set("passing", v)} />
          <CampoNumero rotulo="Drible" valor={j.dribbling} onChange={(v) => set("dribbling", v)} />
          <CampoNumero rotulo="Defesa" valor={j.defending} onChange={(v) => set("defending", v)} />
          <CampoNumero rotulo="Físico" valor={j.physical} onChange={(v) => set("physical", v)} />
          <CampoNumero rotulo="Cruzamento" valor={j.crossing} onChange={(v) => set("crossing", v)} />
          <div>
            <Label className="text-xs">Pé</Label>
            <Select value={j.preferredFoot} onValueChange={(v) => set("preferredFoot", v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PE_PREFERIDO.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p === "D" ? "Direito" : "Esquerdo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CampoNumero rotulo="P. ruim" valor={j.weakFoot} onChange={(v) => set("weakFoot", Math.min(5, Math.max(1, v)))} />
            <CampoNumero rotulo="Habil." valor={j.skillMoves} onChange={(v) => set("skillMoves", Math.min(5, Math.max(1, v)))} />
          </div>
        </div>

        <Button onClick={salvar} disabled={salvando || !j.name.trim()} className="w-full">
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar jogador"}
        </Button>
      </div>
    </div>
  );
}

export function UsuariosClient({ jogadores }: { jogadores: Jogador[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState<Jogador | null>(null);

  function toggleAtivo(id: number) {
    start(async () => {
      const r = await alternarAtivo(id);
      if (r.success) router.refresh();
      else toast.error(r.error);
    });
  }

  function excluir(id: number) {
    start(async () => {
      const r = await removerJogador(id);
      if (r.success) {
        toast.success("Jogador excluído.");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black texto-neon">Cadastrar jogadores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione novos jogadores, edite as cartinhas e as fotos.
          </p>
        </div>
        <Dialog open={novo} onOpenChange={setNovo}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Novo jogador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo jogador</DialogTitle>
            </DialogHeader>
            <FormJogador inicial={vazio()} onFechar={() => setNovo(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {jogadores.map((j) => {
          const info = POSICAO_INFO[j.position as Posicao] ?? POSICAO_INFO.MEIA;
          return (
            <Card key={j.id} className={cn(!j.active && "opacity-60")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar nome={j.name} foto={j.photoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{j.name}</p>
                  <span className="text-[10px] font-bold px-1 rounded text-black" style={{ background: info.cor }}>
                    {info.curto} · {j.overall}
                  </span>
                  {!j.active && <span className="ml-2 text-xs text-muted-foreground">inativo</span>}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditando(j)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    title={j.active ? "Desativar" : "Ativar"}
                    onClick={() => toggleAtivo(j.id)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {j.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Só é possível excluir quem nunca participou de uma partida no site. Caso
                          contrário, use “desativar” para preservar o histórico.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => excluir(j.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar jogador</DialogTitle>
          </DialogHeader>
          {editando && <FormJogador inicial={editando} onFechar={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
