import Link from "next/link";
import { Armchair, Wallet, UserCheck, Gift, ArrowRight } from "lucide-react";

import { getDashboardStats } from "@/lib/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/lib/format";
import { GIFT_TYPE_LABELS } from "@/lib/types";
import { Rosquinha, NuvensAnimadas, Camiseta, Caneca } from "@/components/tema/ilustracoes";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (stats.totalLugares === 0) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center flex flex-col items-center gap-4 animate-fade-up">
        <Rosquinha size={72} className="animate-float" />
        <h1 className="text-xl font-bold">Configure o salão para começar</h1>
        <p className="text-muted-foreground text-sm">
          Ainda não há mesas cadastradas. Defina a quantidade de mesas e lugares em Configurações
          para liberar o mapa do salão, os convites e o check-in.
        </p>
        <Button asChild>
          <Link href="/configuracoes">
            Ir para Configurações <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const cards = [
    {
      titulo: "Convites vendidos",
      valor: String(stats.totalConvites),
      rodape: `${stats.lugaresOcupados} de ${stats.totalLugares} lugares atribuídos`,
      icone: Armchair,
    },
    {
      titulo: "Arrecadado",
      valor: formatarMoeda(stats.arrecadado),
      rodape: `${formatarMoeda(stats.pendente)} pendente/parcial`,
      icone: Wallet,
    },
    {
      titulo: "Check-ins feitos",
      valor: String(stats.checkinsFeitos),
      rodape: `${stats.checkinsRestantes} ainda não chegaram`,
      icone: UserCheck,
    },
    {
      titulo: "Combos com brinde",
      valor: String(stats.conviteComBrinde),
      rodape: `${stats.somenteConvite} ${GIFT_TYPE_LABELS.SOMENTE_CONVITE.toLowerCase()}`,
      icone: Gift,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="sky-bg rounded-2xl border p-6 md:p-8 animate-fade-up">
        <NuvensAnimadas quantidade={7} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground drop-shadow-sm">
              Festa do Socadinha 2026
            </h1>
            <p className="text-sm md:text-base mt-1 font-medium text-foreground/80">
              Tema Simpsons · {stats.totalConvites} convites · {stats.ocupacaoPercentual}% do salão
              ocupado
            </p>
          </div>
          <Rosquinha size={84} className="animate-float hidden sm:block shrink-0" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icone = card.icone;
          return (
            <Card
              key={card.titulo}
              className="card-hover animate-pop-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icone className="h-4 w-4" /> {card.titulo}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">{card.valor}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.rodape}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle>Ocupação do salão</CardTitle>
          <CardDescription>
            {stats.lugaresOcupados} de {stats.totalLugares} lugares ocupados (
            {stats.ocupacaoPercentual}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-5 w-full rounded-full bg-muted overflow-hidden border">
            <div
              className="h-full rounded-full progress-stripes transition-all duration-1000"
              style={{
                width: `${stats.ocupacaoPercentual}%`,
                background: "var(--simpson-yellow)",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "360ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Brindes a entregar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Camiseta size={40} className="text-primary animate-wiggle" />
              <Caneca size={40} className="text-primary animate-wiggle" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.conviteComBrinde}</p>
              <p className="text-xs text-muted-foreground">combos camisa + caneca</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-1">
          {[
            { href: "/mapa", label: "Ver mapa do salão" },
            { href: "/checkin", label: "Ir para check-in" },
            { href: "/sorteio", label: "Sorteio de brindes" },
            { href: "/financeiro", label: "Ver financeiro" },
          ].map((atalho, i) => (
            <Link key={atalho.href} href={atalho.href} className="block">
              <Card
                className="card-hover animate-fade-up"
                style={{ animationDelay: `${400 + i * 60}ms` }}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {atalho.label}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
