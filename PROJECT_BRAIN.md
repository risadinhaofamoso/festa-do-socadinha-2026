# 🧠 Cérebro do Projeto — FUT-SD · Futebol de Quarta 2026

> Este arquivo é a **fonte de verdade** do projeto. Toda regra, decisão, preferência e mudança
> relevante deve ser registrada aqui. Leia antes de mexer no código e atualize sempre que algo mudar.
>
> Última atualização: 2026-10-29

> ⚠️ **Contexto de histórico:** este repositório começou como um painel de festa ("Festa do
> Socadinha"). A branch `claude/futebol-wednesday-control-site-yikuox` o transformou num site para
> controlar a **pelada de quarta-feira**. O código da festa continua intacto na branch `main`.
> Toda a infraestrutura (Next.js, Prisma, Tailwind, login por senha, tema escuro/neon) foi
> reaproveitada.

---

## 1. O que é este projeto

Site para controlar o futebol de quarta-feira do grupo (~47 jogadores). Toda quarta lança-se uma
**nova partida** (Time A x Time B) e o site:

1. Mantém a **tabela geral do ano** (pontuação acumulada) com destaques.
2. Guarda as **cartinhas estilo FIFA** de cada jogador.
3. **Gera os times** equilibrados a partir de quem compareceu.
4. Controla o **ciclo da partida** (iniciar → cronômetro → confirmar resultado).
5. Abre a **votação de melhor em campo** (por CPF, uma vez por time).

---

## 2. Regras de pontuação (o coração do site)

A pontuação de cada jogador no ano é:

| Evento | Pontos |
|---|---|
| Vitória (time do jogador venceu) | **+3** |
| Empate | **+1** |
| Derrota | **0** |
| Presença (compareceu, jogando **ou** como torcida) | **+2** |
| Melhor em campo (votação) | **+1** |

Fórmula: `pontos = 3·vitórias + 1·empates + 2·(jogos + participações torcida) + 1·(melhor em campo)`.

> ✅ Essa fórmula foi **validada contra a planilha oficial da 35ª partida** e reproduz os pontos
> exatos de todos os jogadores (ex: Caio Couto 120, Allan Minossi 119, Gabriel Aguilera 115).

**Colunas da tabela** (iguais à planilha):
- `Pts`, `J` (jogos), `V`/`E`/`D`, `Part` (comparecimentos como torcida), `⭐` (melhor em campo),
- `Pres.%` = `(jogos + torcida) / partidas realizadas`,
- `Aprov.%` = `vitórias / jogos`.

---

## 3. O "carry-over" histórico (decisão central D-01)

A planilha tem 35 partidas de histórico que o site **não** tem como dado de partida. Em vez de
inventar 35 partidas, cada jogador carrega o **estado consolidado na 35ª partida** em campos `base*`:

```
baseWins, baseDraws, baseLosses, baseJogos, baseParticipacoes, baseMelhorEmCampo, basePoints
```

- `basePoints` guarda a **pontuação exibida na planilha** (usada direto, para reproduzir até as
  quirks da planilha, como o Lipe com 3 jogos e 0 V/E/D).
- As partidas **lançadas no site** (status `FINALIZADA`) somam **por cima** do carry-over.
- `PARTIDAS_BASE = 35` (em `lib/types.ts`) é o denominador base de presença; cada partida finalizada
  no site incrementa esse total.

Ou seja: a tabela = `base` + `Σ(partidas finalizadas no site)`. Nunca recalcule o `base` a partir das
colunas — some apenas os deltas das novas partidas (feito em `lib/tabela.ts`).

---

## 4. Stack técnica (fixa — herdada do projeto da festa)

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js **14.2.35** (App Router) | `next.config.mjs` (a v14 não aceita `.ts`) |
| Linguagem | TypeScript estrito | sem `any` |
| Estilo | Tailwind CSS v4 (`@theme inline`, sem config.js) | tema escuro/neon em `app/globals.css` |
| Componentes | shadcn/ui escritos à mão em `components/ui/` | copiar o padrão existente, não usar a CLI |
| Banco | SQLite via Prisma **5.22.0** (`prisma/dev.db`) | adaptador libSQL p/ Turso em produção |
| Validação | Zod **3.23.8** | `lib/validations.ts` |
| Mutações | Server Actions + `revalidatePath` | retorno padrão `ActionResult` (`lib/action-result.ts`) |
| Toasts | sonner | |
| Ícones | lucide-react | |

---

## 5. Modelo de dados

```
Player (jogador)
  dados da carta: overall, pace, shooting, passing, dribbling, defending, physical,
                  crossing, preferredFoot (D/E), weakFoot (1-5), skillMoves (1-5)
  posição: GOLEIRO | ZAGUEIRO | LATERAL | VOLANTE | MEIA | ATACANTE
  carry-over: base* (ver seção 3)
  photoUrl: data URL base64 (foto reduzida p/ 256px no cadastro) — pode ser nula
  active: inativo some da geração de times mas continua na tabela/histórico

Match (partida)
  number (único, sequencial a partir de 36), date, status (CRIADA|EM_ANDAMENTO|FINALIZADA),
  scoreA, scoreB, startedAt, finishedAt, durationSeconds, votingOpen

Participation (presença numa partida)   @@unique([matchId, playerId])
  team: "A" | "B" | null (torcida),  role: JOGADOR | TORCIDA,  isMotm (melhor em campo)

Vote (voto de melhor em campo)          @@unique([matchId, team, voterCpf])
  team, votedPlayerId, voterCpf, voterName
```

**Enums são `String`** (SQLite não suporta enum no Prisma) — valores válidos em `lib/types.ts`,
validados por Zod. É a mesma pegadinha do projeto antigo.

---

## 6. Páginas

| Rota | Função |
|---|---|
| `/` | **Tabela Geral**: destaques (Melhor do Ano, Melhor Goleiro, Mais Presente, G6) + tabela completa + histórico de partidas |
| `/jogadores` | Grade de **cartinhas FIFA**; clicar abre modal com todos os atributos e stats da tabela |
| `/gerar` | **Gerar Times**: marcar presentes/torcida → times equilibrados → visualização no campo → salvar como partida |
| `/partidas` | Lista de partidas lançadas; botão "Nova partida" leva a `/gerar` |
| `/partidas/[id]` | Detalhe/controle: iniciar, cronômetro, confirmar resultado, votação, pontos do dia |
| `/votar` | **Votação pública** de melhor em campo (CPF + nome) |
| `/usuarios` | **Cadastro/edição** de jogadores (foto, posição, atributos da carta) |
| `/login` | Só quando `SENHA_ACESSO` está definida |

**Destaques da tabela:**
- **Melhor do Ano** = 1º colocado. **Melhor Goleiro** = goleiro melhor colocado.
  **Mais Presente** = maior nº de presenças. **G6** = os 6 primeiros (ganham premiação), realçados
  com fundo dourado na tabela.

---

## 7. Como os times são gerados (`lib/times.ts`)

1. Goleiros vão **um para cada time** (os dois mais fortes). Goleiro sobrando entra como linha.
2. Os demais são distribuídos do mais forte ao mais fraco, sempre caindo no time **atualmente mais
   fraco** (equilibra a soma de força) e mantendo os tamanhos parelhos.
3. Dentro do time, o goleiro é sempre titular; os demais titulares preenchem por força até
   `titularesPorTime` (5/6/7, escolhível). O resto vai pro banco.
4. A **formação** posiciona por linha (gol → defesa → meio → ataque) no campo.
5. "Re-sortear" aplica um ruído pequeno à força para variar os times entre sorteios válidos.

**Indicador de forma** (setinha no campo): resultado do jogador na **última partida finalizada** —
troféu/seta pra cima (vitória), seta pra baixo (derrota), traço neutro (empate ou não jogou).
Computado em `lib/tabela.ts → resultadosUltimaPartida()`.

---

## 8. Ciclo da partida e votação

1. **Gerar Times → Salvar** cria a partida (`CRIADA`) com as participações já com time.
2. **Iniciar partida** (`EM_ANDAMENTO`, grava `startedAt`) → cronômetro roda no cliente.
3. **Confirmar resultado** grava placar, vira `FINALIZADA`, calcula duração e **abre a votação**.
4. **Votação** (`/votar`): só o(s) time(s) vencedor(es) escolhe(m) o melhor — empate abre os dois.
   Cada CPF vota uma vez por time (garantido pelo banco, `@@unique`).
5. **Encerrar e apurar** marca o `isMotm` do mais votado de cada time (empate no voto desempata pelo
   maior overall) e fecha a urna.

**Pontos do dia** são exibidos no detalhe da partida (presença + resultado + melhor em campo).

---

## 9. Decisões técnicas registradas

**D-01 — Carry-over histórico em vez de importar 35 partidas.** Ver seção 3. Reproduz a planilha
exatamente e deixa o site continuar somando a partir da 36ª.

**D-02 — Atributos das cartas são genéricos, derivados da colocação.** `lib/jogadores.ts`
(`overallPorRanking` + `gerarAtributos`) gera overall (1º ~90 → último ~62) e distribui os 7
atributos por peso de posição, com jitter determinístico pelo nome. **O usuário vai ajustar depois**
— o botão "Sugerir" no cadastro reaplica essa geração.

**D-03 — Fotos guardadas como data URL no banco.** O cadastro reduz a imagem para 256×256 JPEG no
navegador (canvas) antes de salvar, mantendo o banco leve. Não há storage de arquivos.

**D-04 — Arquivo `"use server"` só exporta função async.** Helpers síncronos (ex: `timesVencedores`,
`pontosDaPartida`) ficam em `lib/partidas-helpers.ts`, não nos arquivos de actions. (Mesma regra que
quebrava o build no projeto antigo.)

**D-05 — Páginas de dados são `force-dynamic`.** Leem o banco a cada acesso.

**D-06 — Login por senha única, só quando publicado.** Herdado do projeto da festa (`lib/auth.ts` +
`middleware.ts`). Sem `SENHA_ACESSO`, o site abre destrancado (uso local). Com ela, exige login.
O painel expõe nomes e (nos votos) CPFs, então **publicar sem senha não é recomendado**.

**D-07 — Mesmo schema roda local (arquivo) e no Turso.** `lib/prisma.ts` escolhe pela presença de
`TURSO_DATABASE_URL`. Ver `DEPLOY.md`.

**D-08 — Voto identificado por CPF, validado de verdade.** `lib/validations.ts` valida os dígitos
verificadores do CPF. A unicidade (um voto por CPF por time) é garantida pelo banco.

---

## 10. Estado atual

✅ **Concluído e testado:**
- Schema, migração `init_futebol` e seed com os **47 jogadores** no estado da 35ª partida.
- Tabela geral reproduz a planilha **exatamente** (validado por script: TOP 6 e totais conferem).
- Todas as 7 páginas implementadas; `npm run build` passa limpo (11 rotas) e todas respondem 200.
- Fluxo ponta a ponta validado por simulação: criar → finalizar → votar (constraint de CPF
  bloqueia duplicado) → apurar melhor em campo → pontos somam certo (+6 melhor/vitória, +5 vitória,
  +2 presença) → excluir em cascata.

⚠️ **Ainda não verificado a olho nu:** o visual foi conferido por inspeção de DOM/CSS e respostas
200, não por captura de tela. Vale abrir e olhar, principalmente o campo e as cartinhas.

📋 **Atributos das cartas são genéricos** (pedido do usuário: "faça genérico e depois a gente
arruma"). Ajuste fino pelo cadastro quando quiser.

💡 **Ideias/próximos passos sugeridos (nenhum pedido ainda):**
- Variação de posição (↑/↓ na coluna "Variação") comparando com a tabela da semana anterior.
- Artilharia/assistências por partida (hoje só placar por time).
- Página pública da tabela sem login para os jogadores verem de casa.
- QR code na votação para abrir no celular na hora.
- Exportar a tabela em imagem/PDF para postar no grupo.
- Editar os times de uma partida `CRIADA` antes de iniciar (hoje: excluir e gerar de novo).

---

## 11. Histórico de mudanças

| Data | O que mudou |
|---|---|
| 2026-10-29 | Branch transformada no **site do futebol de quarta**: schema (Player/Match/Participation/Vote), seed dos 47 jogadores, tabela geral + destaques, cartinhas FIFA, geração de times com campo, ciclo de partida com cronômetro, votação de melhor em campo por CPF, cadastro de jogadores com foto. Páginas da festa removidas nesta branch (seguem em `main`). |

---

## 12. Como manter este arquivo

Sempre que houver nova regra do grupo → seção 2/6; decisão técnica → seção 9; mudança no modelo →
seção 5; funcionalidade nova/concluída → seções 6 e 10; qualquer alteração relevante → uma linha na
seção 11. Corrija o que ficar desatualizado em vez de acumular contradições.
