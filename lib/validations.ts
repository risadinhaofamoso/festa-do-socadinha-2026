import { z } from "zod";
import { POSICOES, PE_PREFERIDO } from "@/lib/types";

const atributo = z.coerce.number().int().min(0).max(99);
const estrelas = z.coerce.number().int().min(1).max(5);

export const jogadorSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do jogador."),
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  position: z.enum(POSICOES),
  photoUrl: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),

  overall: atributo,
  pace: atributo,
  shooting: atributo,
  passing: atributo,
  dribbling: atributo,
  defending: atributo,
  physical: atributo,
  crossing: atributo,
  preferredFoot: z.enum(PE_PREFERIDO).default("D"),
  weakFoot: estrelas.default(3),
  skillMoves: estrelas.default(3),
});

export type JogadorInput = z.infer<typeof jogadorSchema>;

/** Validacao da foto enviada: so imagem e ate ~1.5MB em data URL. */
export const fotoSchema = z
  .string()
  .refine((v) => v === "" || v.startsWith("data:image/"), "A foto precisa ser uma imagem.")
  .refine((v) => v.length < 2_000_000, "A foto e muito grande (reduza para menos de ~1,5MB).");

export const criarComTimesSchema = z.object({
  data: z.coerce.date().optional(),
  timeA: z.array(z.number().int()).min(1, "O time A precisa de pelo menos 1 jogador."),
  timeB: z.array(z.number().int()).min(1, "O time B precisa de pelo menos 1 jogador."),
  torcida: z.array(z.number().int()).default([]),
});

export const definirTimesSchema = z.object({
  matchId: z.number().int(),
  timeA: z.array(z.number().int()),
  timeB: z.array(z.number().int()),
  torcida: z.array(z.number().int()).default([]),
});

export const resultadoSchema = z.object({
  matchId: z.number().int(),
  scoreA: z.coerce.number().int().min(0).max(99),
  scoreB: z.coerce.number().int().min(0).max(99),
  durationSeconds: z.coerce.number().int().min(0).optional(),
});

/** CPF: so os digitos, exatamente 11. Valida os digitos verificadores. */
function cpfValido(cpf: string): boolean {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const calc = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = calc(n.slice(0, 9), 10);
  const d2 = calc(n.slice(0, 10), 11);
  return d1 === Number(n[9]) && d2 === Number(n[10]);
}

export const votoSchema = z.object({
  matchId: z.number().int(),
  team: z.enum(["A", "B"]),
  votedPlayerId: z.number().int(),
  voterName: z.string().trim().min(3, "Informe seu nome e sobrenome."),
  voterCpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(cpfValido, "CPF invalido. Confira os numeros."),
});
