import { getFinanceiroStats } from "@/lib/actions/financeiro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatarMoeda } from "@/lib/format";
import { GIFT_TYPE_LABELS, PAYMENT_STATUS_LABELS, type GiftType, type PaymentStatus } from "@/lib/types";
import { ExportarCsvButton } from "@/components/financeiro/exportar-csv-button";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const dados = await getFinanceiroStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle de arrecadação, pendências e brindes.
          </p>
        </div>
        <ExportarCsvButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Arrecadado</CardDescription>
            <CardTitle className="text-3xl text-success">{formatarMoeda(dados.arrecadado)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {dados.quantidadePorStatus.PAGO ?? 0} convite(s) pago(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendente</CardDescription>
            <CardTitle className="text-3xl">{formatarMoeda(dados.pendenteValor)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {dados.quantidadePorStatus.PENDENTE ?? 0} convite(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Parcial</CardDescription>
            <CardTitle className="text-3xl">{formatarMoeda(dados.parcialValor)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {dados.quantidadePorStatus.PARCIAL ?? 0} convite(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por forma de pagamento</CardTitle>
            <CardDescription>Total considera apenas convites já pagos.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Convites</TableHead>
                  <TableHead className="text-right">Total pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.porFormaPagamento.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum convite cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  dados.porFormaPagamento.map((f) => (
                    <TableRow key={f.forma}>
                      <TableCell>{f.forma}</TableCell>
                      <TableCell className="text-right">{f.quantidade}</TableCell>
                      <TableCell className="text-right">{formatarMoeda(f.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por tipo de brinde</CardTitle>
            <CardDescription>Quantidade e valor total dos convites.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brinde</TableHead>
                  <TableHead className="text-right">Convites</TableHead>
                  <TableHead className="text-right">Valor total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Object.keys(dados.porBrinde) as GiftType[]).map((tipo) => (
                  <TableRow key={tipo}>
                    <TableCell>{GIFT_TYPE_LABELS[tipo]}</TableCell>
                    <TableCell className="text-right">{dados.porBrinde[tipo].quantidade}</TableCell>
                    <TableCell className="text-right">
                      {formatarMoeda(dados.porBrinde[tipo].total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamentos pendentes</CardTitle>
          <CardDescription>
            {dados.pendentes.length} convite(s) para cobrar antes da festa.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dados.pendentes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Tudo pago. Nenhuma cobrança pendente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Quem vai usar</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.pendentes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.number}</TableCell>
                    <TableCell>{c.guest.name}</TableCell>
                    <TableCell>{c.attendeeName}</TableCell>
                    <TableCell className="text-muted-foreground">{c.guest.phone ?? "—"}</TableCell>
                    <TableCell>{formatarMoeda(c.price)}</TableCell>
                    <TableCell>
                      <Badge variant="warning">
                        {PAYMENT_STATUS_LABELS[c.paymentStatus as PaymentStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
