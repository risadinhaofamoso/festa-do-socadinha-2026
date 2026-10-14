# 🧠 Cérebro do Projeto — Festa do Socadinha 2026

> Este arquivo é a **fonte de verdade** do projeto. Toda informação, regra, decisão,
> preferência e mudança relevante deve ser registrada aqui. Leia antes de mexer no código
> e atualize sempre que algo mudar.
>
> Última atualização: 2026-08-17

---

## 1. O que é este projeto

Dashboard web para controlar uma festa particular de ~250 convidados. Uso **pessoal, local e
single-user** — roda com `npm run dev` no notebook do organizador, sem deploy, sem login,
sem multiusuário.

Dois processos principais:

1. **Reservas de lugares** — salão com mesas numeradas, cada uma com N lugares.
2. **Controle financeiro e de convites** — cada convite tem número único, dono, preço,
   status de pagamento e um brinde associado. No dia da festa, o organizador dá baixa
   (check-in) em cada convite sozinho, num único notebook, com gente esperando na fila.

---

## 2. Tema visual

**O site é escuro ("neon"), inspirado na planta do salão** — pedido do usuário em 18/08/2026.

- Fundo quase preto, contornos luminosos e **dourado (`--neon-gold`, `#f5c518`) como cor de
  destaque**, igual à pista/palco da planta.
- O `<html>` sobe com a classe `dark` fixa e o `:root` já carrega a paleta escura — não existe
  alternador de tema, o site é escuro e ponto.
- Cores neon dos grupos em `lib/grupos.ts`; tokens do tema em `app/globals.css`.

**Tema da festa: Simpsons** — é o tema de todos os anos, tradição da festa. Sobrevive no
projeto pelas ilustrações e pelo tom, não mais pela paleta clara:

- Ilustrações são **SVGs originais** (rosquinha, camiseta, caneca) em
  `components/tema/ilustracoes.tsx`.
- ⚠️ **Regra importante:** não usar imagens/personagens oficiais dos Simpsons — são protegidos
  por direitos autorais. Só arte original inspirada na estética.
- Site deve ser **animado e dinâmico** (pedido explícito do usuário): cards com entrada
  escalonada, lugares que pulsam, confete ao confirmar entrada, barra de progresso listrada,
  roleta do sorteio.
- Todas as animações respeitam `prefers-reduced-motion`.

---

## 3. Stack técnica (fixa)

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js **14.2.35** (App Router) | ⚠️ Fixado no 14 de propósito — ver decisão D-01 |
| Linguagem | TypeScript estrito | Sem `any` |
| Estilo | Tailwind CSS v4 | Sintaxe `@theme inline`, sem `tailwind.config.js` |
| Componentes | shadcn/ui (copiados à mão em `components/ui/`) | Ver decisão D-02 |
| Banco | SQLite via Prisma **5.22.0** | Arquivo `prisma/dev.db` |
| Validação | Zod **3.23.8** | `lib/validations.ts` |
| Mutações | Server Actions + `revalidatePath` | Sem lib externa de state |
| Toasts | sonner | |
| Ícones | lucide-react 0.441 | |

**Config do Next:** `next.config.mjs` (o Next 14 **não** aceita `next.config.ts`).

---

## 4. Modelo de dados

```
Table (mesa)      → id, number (único), capacity, label?, positionX?, positionY?, orientation
Seat (lugar)      → id, tableId, seatNumber   [único: tableId+seatNumber]
Guest (titular)   → id, name, phone?, notes?
Invite (convite)  → id, number (ÚNICO), guestId, attendeeName, price,
                    paymentStatus, paymentMethod?, giftType, seatId? (ÚNICO),
                    checkedIn, checkedInAt?
Draw (sorteio)    → id, inviteId (ÚNICO), prize, delivered, deliveredAt?, drawnAt
```

**Regras de integridade:**

- `Invite.number` é único no banco **e** validado no formulário/importação, com mensagem
  clara em português (“Já existe um convite com o número X.”).
- `Invite.seatId` é `@unique` → garante que um lugar nunca tenha dois convites.
- Um convite pode existir **sem** lugar (`seatId` nulo).
- `attendeeName` pode ser diferente do titular (ex: “convite 12 do Sr. João, mas quem vai é a
  filha Maria”).
- Excluir um titular remove seus convites em cascata; excluir um convite libera o lugar.
- `Draw.inviteId` é `@unique` → **é o banco que garante que ninguém ganhe dois brindes**.
  Excluir o convite remove o sorteio em cascata.
- `Table.label` guarda o **nome do grupo/família** (ex: "GRUPO VILLELA"). A cor da mesa no
  mapa é derivada desse nome — não existe campo de cor.
- `Table.orientation` é `"H"` (deitada, lugares em cima/embaixo) ou `"V"` (em pé, lugares nas
  laterais). O bloco de cima do salão é todo em pé.

**⚠️ Pegadinha do SQLite:** o Prisma **não suporta `enum` com SQLite**. Por isso
`paymentStatus` e `giftType` são `String` no schema, com os valores válidos definidos em
`lib/types.ts` e validados por Zod:

- `PaymentStatus`: `PAGO` | `PENDENTE` | `PARCIAL`
- `GiftType`: `SOMENTE_CONVITE` | `CONVITE_CAMISA_CANECA`

---

## 5. Páginas e o que cada uma faz

| Rota | Função |
|---|---|
| `/` | Dashboard: convites vendidos, arrecadado vs pendente, check-ins, brindes, % de ocupação |
| `/mapa` | Planta real do salão: mesas posicionadas em volta da pista, lugares clicáveis, zoom, busca com highlight, cor por grupo |
| `/convidados` | Tabela de convites com filtros e busca, CRUD, atribuição de lugar, importação CSV |
| `/checkin` | Tela do dia da festa: busca grande, detalhe imediato, botão gigante de confirmar |
| `/sorteio` | Roleta de brindes durante a festa: só quem fez check-in concorre, registro de prêmio e entrega |
| `/financeiro` | Totais por status/forma/brinde, lista de pendentes, exportar CSV |
| `/configuracoes` | Aplica a planta real do salão; adicionar/editar/remover mesas depois |
| `/login` | Só existe quando `SENHA_ACESSO` está definida. Sem sidebar, redireciona de volta para onde a pessoa tentou ir |

**Cores dos lugares no mapa:**

- Contorno branco vazado = livre (sem convite)
- Azul neon = reservado (convite atribuído, ainda não chegou)
- Verde neon = presente (check-in feito)
- Contorno dourado pulsando = resultado da busca

**Cor da mesa** = cor do grupo/família (campo `label`). Mesa sem grupo fica cinza neutro.

---

## 5.1 A planta do salão

A planta real vive em **`lib/layout-salao.ts`**, num canvas de 1920×1920. É o único lugar a
mexer se o salão mudar — o componente do mapa só escala esse canvas.

**Números atuais: 72 mesas, 328 lugares.**

- **62 mesas de 4 lugares** — todas as do salão
- **10 mesas de 8 lugares** — *somente* as grandes da coluna da direita, ao lado do WC
  (regra reforçada pelo usuário)

Blocos, na ordem em que as mesas são numeradas (1 a 72):

| Nº | Bloco | Mesas |
|---|---|---|
| 1–12 | Bloco de cima, 6 colunas × 2 fileiras, **mesas em pé** | 12 |
| 13–16 | Depois do 1º corredor, **em pé** | 4 |
| 17–25 | Depois do 2º corredor: fileira de 5 + fileira de 4, **em pé** | 9 |
| 26–33 | Coluna solitária da extrema esquerda | 8 |
| 34–47 | Par de colunas da esquerda, 7 fileiras × 2 | 14 |
| 48 | Mesa solta embaixo à esquerda | 1 |
| 49–62 | Duas colunas à direita da pista, 7 fileiras cada | 14 |
| 63–72 | **Mesas grandes de 8 lugares**, coluna da direita | 10 |

**Zonas desenhadas:** PISTA (centro), PALCO e CAMARIM (embaixo), PORTA e GUICHE (entrada),
COPA e BUFETT (direita), WC MASCULINO e WC FEMININO (topo), mais 5 marcações de CORREDOR.

⚠️ A primeira planta enviada pelo usuário estava **errada** e foi substituída em 18/08/2026.
A válida é a que tem corredores marcados e o bloco de cima com mesas em pé.

---

## 6. Regras de negócio importantes

1. **Nada de números hardcoded.** Quantidade de mesas e lugares vem sempre do banco,
   configurada em `/configuracoes`.
2. **Check-in em no máximo 2–3 cliques**: digitar → clicar no resultado → “Confirmar entrada”.
   Depois de confirmar, o campo limpa e volta o foco sozinho, pronto para a próxima pessoa.
3. **Alerta de pagamento no check-in**: se o convite não estiver `PAGO`, aparece um bloco
   vermelho destacado — mas **não bloqueia** a entrada (a decisão é do organizador na hora).
4. **Brinde visível no check-in**: mostra se a pessoa leva camisa + caneca ou só o convite.
5. **Editar o salão não pode quebrar reservas**: remover mesa ou reduzir capacidade é
   bloqueado se houver convites nos lugares afetados, com mensagem explicando o motivo.
6. **Ações destrutivas pedem confirmação** (excluir convite, remover mesa, remover sorteio).
7. **Toda a interface é em português do Brasil**, inclusive mensagens de erro.
8. **Sorteio só entre quem está na festa**: a roleta lista apenas convites com `checkedIn = true`
   e **sem** sorteio registrado. Quem ganha sai da roleta na hora e não volta.
9. **O sorteio só conta depois de informar o prêmio.** Girar a roleta não grava nada; o registro
   acontece ao clicar em “Confirmar ganhador” com o prêmio preenchido. Se o organizador clicar
   em “Descartar sorteio”, nada é salvo e a pessoa continua concorrendo — isso é proposital,
   para o caso de girar sem querer ou a pessoa não estar mais no salão.
10. **Remover um sorteio devolve a pessoa para a roleta** (usado para corrigir engano).
11. **Aplicar a planta do salão apaga e recria todas as mesas** — por isso a ação é bloqueada
    se houver qualquer convite ocupando lugar, com mensagem explicando o motivo.
12. **Grupo/família é digitado, não escolhido numa lista.** Mesas com o mesmo texto ganham a
    mesma cor automaticamente (hash estável do nome). Sem grupo = cor neutra.

---

## 7. Decisões técnicas registradas

**D-01 — Next.js fixado na versão 14, não a mais recente.**
O `create-next-app` instalou a v16, que traz mudanças de API e convenções ainda pouco
documentadas. Para um sistema que precisa funcionar sem surpresas no dia da festa, optou-se
pela 14.2.35 (App Router + Server Actions, estável e amplamente conhecida). Consequência:
usar `next.config.mjs` e evitar as fontes `Geist` (que só existem da v15 em diante — o
projeto usa Inter + JetBrains Mono).

**D-02 — Componentes shadcn/ui escritos manualmente.**
A CLI atual do shadcn usa presets novos e desconhecidos. Os componentes foram escritos à mão
em `components/ui/` seguindo o padrão clássico do shadcn (Radix + cva + `cn()`). Para
adicionar um componente novo, copiar o padrão dos existentes em vez de rodar a CLI.

**D-03 — Prisma 5 e Zod 3, não as majors mais recentes.**
Mesma lógica da D-01: versões estáveis e bem conhecidas reduzem risco.

**D-04 — Enums em `String` por causa do SQLite.** Ver seção 4.

**D-05 — Autenticação: senha única, e só quando publicado.** ⚠️ *Revisada em 18/08/2026.*
A decisão original era **não ter login**, porque o uso seria local. Quando o usuário decidiu
hospedar o site para acessar de qualquer lugar, isso virou um problema: o painel mostra nome,
telefone e situação de pagamento de ~250 pessoas. A solução:

- Uma **senha só**, compartilhada — não existe cadastro de usuários.
- O comportamento depende do ambiente: **sem `SENHA_ACESSO` definida, o site fica destrancado**
  (uso local no notebook, onde login atrapalharia na portaria); **com a variável definida,
  exige login** (produção).
- O cookie guarda um HMAC gerado com `SESSION_SECRET`; a senha nunca vai para o navegador.
- Implementação em `lib/auth.ts` + `middleware.ts` + `app/login/`.
- ⚠️ **Nunca publicar sem `SENHA_ACESSO`.**

**D-12 — Mesmo schema roda em arquivo local e no Turso.**
Usa o driver adapter libSQL do Prisma (`previewFeatures = ["driverAdapters"]`), então o
`provider` continua `sqlite` e as migrações servem aos dois. `lib/prisma.ts` escolhe pela
presença de `TURSO_DATABASE_URL`. Isso preserva o uso **offline** no notebook, que importa se
o Wi-Fi do salão falhar no dia da festa.

⚠️ **Os dois bancos são independentes** — dado cadastrado num não aparece no outro. O usuário
precisa escolher um para valer.

**D-06 — Todas as páginas de dados são `force-dynamic`.**
São painéis que leem o banco a cada acesso. Sem isso, um `npm run build && npm start`
serviria a foto dos dados congelada no momento do build.

**D-07 — A roleta do sorteio é uma esteira horizontal, não uma roda de pizza.**
Com até ~250 nomes, uma roda com fatias fica ilegível. A esteira rola e para com o vencedor
sob o marcador central — mesma sensação de roleta, mas funciona com qualquer quantidade de
participantes e mostra nomes reais durante todo o giro.

**D-08 — O vencedor é escolhido no servidor, não no navegador.**
`sortearVencedor()` usa `crypto.randomInt` sobre a lista de elegíveis lida do banco na hora.
A animação apenas *encena* um resultado já decidido — isso evita que a lista do cliente,
possivelmente desatualizada, sorteie alguém que acabou de ser sorteado em outra aba.

**D-09 — A animação usa `setTimeout`, nunca `requestAnimationFrame`.**
O `rAF` não dispara quando a aba está em segundo plano, o que deixava o giro travado em
“Sorteando...” para sempre. Com `setTimeout` o sorteio conclui mesmo se o notebook estiver
com outra janela na frente. **Não trocar de volta.**

**⚠️ Quirk conhecido:** `npm run build` no Node 24 ocasionalmente estoura memória
(“JavaScript heap out of memory”) durante a geração de páginas. É intermitente — basta rodar
de novo. Não afeta o `npm run dev`, que é o modo de uso normal.

**D-10 — A planta do salão é dado, não código espalhado.**
Todas as coordenadas ficam em `lib/layout-salao.ts` e são gravadas no banco (`positionX`,
`positionY`, `orientation`) quando a planta é aplicada. O componente do mapa não sabe nada
sobre o salão — só lê posições. Mudou o salão? Mexe só nesse arquivo e reaplica.

**D-11 — Arquivo `"use server"` só exporta função async.**
Exportar uma constante de um arquivo de Server Actions quebra o build com
`A "use server" file can only export async functions, found object`. Aconteceu com um objeto
de resumo do layout; a solução é importar a constante direto de `lib/`, nunca reexportar
pelas actions.

**⚠️ Prisma trava a DLL:** rodar `prisma migrate`/`generate` com o `npm run dev` ligado dá
erro `EPERM ... query_engine-windows.dll.node`. Parar o servidor, rodar `npx prisma generate`
e subir de novo resolve.

---

## 8. Formato do CSV de importação

Cabeçalho esperado (aceita `,` ou `;` como separador):

```
titular,atendente,numero,preco,formaPagamento,statusPagamento,brinde
João Silva,Maria Silva,101,120,Pix,PAGO,SOMENTE_CONVITE
Ana Souza,Ana Souza,103,120,,PENDENTE,CONVITE_CAMISA_CANECA
```

- `statusPagamento` é opcional (default `PENDENTE`).
- `formaPagamento` pode ficar vazio.
- A importação **valida antes de gravar** e mostra os erros linha a linha; só as linhas
  válidas são importadas.
- Titular que ainda não existe é criado automaticamente; titular com nome igual é reaproveitado.

---

## 9. Estado atual

✅ **Concluído e testado no navegador:**

- Schema, migrações e seed com dados fictícios
- Todas as 7 páginas implementadas e navegáveis
- Fluxo validado ponta a ponta: configurar salão → cadastrar convite → atribuir lugar pelo
  mapa → check-in → dashboard e financeiro refletindo os totais
- Bloqueio de convite duplicado confirmado (mensagem correta em português)
- Tema escuro neon aplicado em todas as páginas (todas respondem 200, nenhuma quebrou)
- Sorteio validado no navegador: girar → registrar prêmio → ganhador sai da roleta
  (12 presentes → 10 elegíveis após 2 sorteios), toggle de entrega e contadores corretos
- **Planta real aplicada**: 72 mesas / 328 lugares gravadas no banco, validadas por checagem
  geométrica automática — zero colisão entre mesas, zero mesa sobre zona, nenhuma fora do
  salão; mesa em pé com lugares nas laterais e mesa grande com 4+4 em cima/embaixo

⚠️ **O banco está VAZIO de convidados.** Em 18/08/2026 o usuário autorizou zerar tudo para
aplicar a planta correta. Existem as 72 mesas e nenhum convite — é o estado certo para
começar a cadastrar os convites reais da festa.

⚠️ **Ainda não verificado visualmente:** o navegador de teste não permite capturas de tela,
então a aparência final foi verificada por inspeção de CSS/DOM e por uma prévia SVG gerada a
partir do layout, não a olho nu. Vale abrir e conferir.

🚧 **Deploy: código pronto, falta o usuário criar as contas.**
Login, adaptador Turso, build e guia estão prontos e testados no que dá para testar local
(senha certa/errada, logout, rota protegida não vazando dado, build de produção passando).
⚠️ **O caminho Turso ainda não foi testado de verdade** — depende de credenciais que só o
usuário pode criar. Se der erro no primeiro deploy, é o primeiro lugar para olhar.

📋 **Ideias / possíveis próximos passos** (nenhuma pedida ainda):

- Impressão da lista de mesas para a portaria
- Backup automático do `dev.db` antes da festa
- Filtro do mapa por grupo/família

---

## 10. Histórico de mudanças

| Data | O que mudou |
|---|---|
| 2026-08-17 | Projeto criado: schema, seed, 6 páginas, server actions, validações |
| 2026-08-17 | Registrado que o tema da festa é Simpsons (tradição de todos os anos) |
| 2026-08-17 | Aplicado tema visual + animações (nuvens, confete, rosquinha, hover nos lugares) |
| 2026-08-17 | Páginas marcadas como `force-dynamic`; build de produção validado |
| 2026-08-17 | Nova aba `/sorteio`: roleta de brindes entre quem fez check-in, registro de prêmio e controle de entrega (modelo `Draw`) |
| 2026-08-18 | Site passou a ser **escuro/neon**, inspirado na planta do salão |
| 2026-08-18 | `/mapa` reescrito como planta espacial real (zonas, posições, orientação das mesas) |
| 2026-08-18 | Cor por grupo/família derivada do `label` da mesa (`lib/grupos.ts`) |
| 2026-08-18 | Planta corrigida pelo usuário: **72 mesas / 328 lugares**; banco zerado e planta aplicada |
| 2026-08-18 | Usuário decidiu **hospedar o site** para acessar de qualquer lugar → login por senha (D-05 revisada), suporte a Turso (D-12) e guia [DEPLOY.md](DEPLOY.md) |

---

## 11. Como manter este arquivo

Sempre que houver:

- **nova regra ou preferência do organizador** → seção 6 (ou 2, se for sobre o tema)
- **decisão técnica não óbvia** → seção 7, explicando o *porquê*
- **mudança no modelo de dados** → seção 4
- **funcionalidade nova ou concluída** → seções 5 e 9
- **qualquer alteração relevante** → uma linha na seção 10

Se uma informação aqui ficar desatualizada, corrija em vez de acumular contradições.
