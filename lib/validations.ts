import { z } from "zod";
import { GIFT_TYPE_VALUES, PAYMENT_STATUS_VALUES } from "@/lib/types";

export const configSalaoSchema = z.object({
  quantidadeMesas: z
    .number({ invalid_type_error: "Informe um número de mesas válido." })
    .int("A quantidade de mesas deve ser um número inteiro.")
    .min(1, "É preciso ao menos 1 mesa.")
    .max(2000, "Quantidade de mesas muito alta."),
  capacidadePorMesa: z
    .number({ invalid_type_error: "Informe uma capacidade válida." })
    .int("A capacidade deve ser um número inteiro.")
    .min(1, "A capacidade deve ser de ao menos 1 lugar.")
    .max(100, "Capacidade por mesa muito alta."),
});

export const editarMesaSchema = z.object({
  id: z.number().int(),
  number: z.number().int().min(1, "Número da mesa inválido."),
  label: z.string().trim().max(120).optional().nullable(),
  capacity: z.number().int().min(1, "Capacidade deve ser ao menos 1."),
});

export const novaMesaSchema = z.object({
  number: z.number().int().min(1, "Número da mesa inválido."),
  label: z.string().trim().max(120).optional().nullable(),
  capacity: z.number().int().min(1, "Capacidade deve ser ao menos 1.").max(100),
});

export const guestSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do titular."),
  phone: z.string().trim().max(30).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const inviteSchema = z.object({
  number: z
    .number({ invalid_type_error: "Informe o número do convite." })
    .int("O número do convite deve ser inteiro.")
    .positive("O número do convite deve ser positivo."),
  guestId: z.number().int().positive("Selecione o titular do convite."),
  attendeeName: z.string().trim().min(1, "Informe quem vai usar o convite."),
  price: z
    .number({ invalid_type_error: "Informe um preço válido." })
    .min(0, "O preço não pode ser negativo."),
  paymentStatus: z.enum(PAYMENT_STATUS_VALUES, {
    errorMap: () => ({ message: "Status de pagamento inválido." }),
  }),
  paymentMethod: z.string().trim().max(60).optional().nullable(),
  giftType: z.enum(GIFT_TYPE_VALUES, {
    errorMap: () => ({ message: "Tipo de brinde inválido." }),
  }),
});

export const inviteUpdateSchema = inviteSchema.extend({
  id: z.number().int().positive(),
});

export const csvInviteRowSchema = z.object({
  titular: z.string().trim().min(1, "Nome do titular é obrigatório."),
  atendente: z.string().trim().min(1, "Nome de quem usa o convite é obrigatório."),
  numero: z
    .number({ invalid_type_error: "Número do convite inválido." })
    .int()
    .positive("Número do convite deve ser positivo."),
  preco: z.number({ invalid_type_error: "Preço inválido." }).min(0, "Preço não pode ser negativo."),
  formaPagamento: z.string().trim().optional().nullable(),
  statusPagamento: z.enum(PAYMENT_STATUS_VALUES).optional(),
  brinde: z.enum(GIFT_TYPE_VALUES, {
    errorMap: () => ({ message: "Tipo de brinde inválido." }),
  }),
});

export type CsvInviteRow = z.infer<typeof csvInviteRowSchema>;
