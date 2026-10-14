# Festa do Socadinha 2026 — Painel de Controle

Dashboard local para controlar reservas de lugares, convites, pagamentos, check-in e o
sorteio de brindes da festa. Tema visual: Simpsons.

> 📌 O arquivo [PROJECT_BRAIN.md](PROJECT_BRAIN.md) é o **cérebro do projeto** — regras,
> decisões e histórico. Leia antes de alterar qualquer coisa.
>
> 🌐 Para colocar o site na internet e acessar de qualquer lugar, veja [DEPLOY.md](DEPLOY.md).

---

## Instalação

Requisitos: **Node.js 18+** instalado.

```bash
npm install
```

```bash
npx prisma migrate dev
```

```bash
npx prisma db seed
```

```bash
npm run dev
```

Depois abra **http://localhost:3000**.

> O `db seed` cria dados fictícios (10 mesas, 80 lugares, ~35 convites) para você testar. Ele
> é **opcional** — se for direto usar de verdade, pule esse passo e monte o salão pelo botão
> **Aplicar planta** em Configurações.
> **Antes da festa de verdade, apague esses dados de teste** — veja “Zerar o banco” abaixo.

---

## Antes da festa: preparando o sistema

### 1. Configurar o salão

O salão da festa **já vem pronto**. Em **Configurações**, o botão **Aplicar planta** monta o
salão exatamente como na planta real:

- **72 mesas** e **328 lugares** no total
- **62 mesas de 4 lugares** — todas as do salão
- **10 mesas de 8 lugares** — só as grandes da coluna da direita, ao lado do banheiro

As mesas já nascem posicionadas em volta da pista, com palco, camarim, guichê, copa, buffet,
banheiros e corredores desenhados no mapa.

> ⚠️ Aplicar a planta **apaga e recria todas as mesas**. Por segurança, o sistema bloqueia a
> ação se algum convite estiver ocupando lugar — nesse caso ele avisa e não altera nada.

Depois disso você ainda pode:

- **Adicionar mesas** conforme o salão mudar
- **Editar** número, grupo/família e capacidade
- **Remover** mesas — só é permitido se não houver convites nos lugares dela

### 1.1 Marcar mesas por grupo ou família

No **Mapa**, clique no corpo de uma mesa (não no lugar) e dê um nome de grupo, por exemplo
`GRUPO VILLELA`. Todas as mesas com o mesmo nome ganham **automaticamente a mesma cor**, e o
grupo aparece na legenda no topo do mapa. Deixe o campo em branco para voltar à cor neutra.

### 2. Cadastrar os convites

Em **Convidados**, use **Novo convite**. Cada convite tem:

- **Número** — único, é o que está impresso no convite físico
- **Titular** — quem comprou (uma família pode ter vários convites no mesmo titular)
- **Quem vai usar** — pode ser outra pessoa (ex: convite do Sr. João, mas quem vai é a Maria)
- **Preço**, **status** (Pago / Pendente / Parcial) e **forma de pagamento**
- **Brinde** — só o convite, ou o combo com camisa e caneca

#### Importar em massa por CSV

Se você já tem a lista numa planilha, use **Importar CSV**. Formato:

```
titular,atendente,numero,preco,formaPagamento,statusPagamento,brinde
João Silva,Maria Silva,101,120,Pix,PAGO,SOMENTE_CONVITE
Ana Souza,Ana Souza,103,120,,PENDENTE,CONVITE_CAMISA_CANECA
```

- `brinde` deve ser `SOMENTE_CONVITE` ou `CONVITE_CAMISA_CANECA`
- `statusPagamento` é opcional (assume `PENDENTE`)
- O sistema **valida antes de gravar** e mostra os erros linha por linha; você confirma
  depois de revisar

### 3. Distribuir os lugares

No **Mapa do Salão**, clique num lugar vazio e escolha o convite. O lugar fica azul
(reservado). Também dá para fazer pelo botão de cadeira na tabela de Convidados.

Os lugares são os quadradinhos em volta de cada mesa — nas laterais nas mesas em pé (bloco de
cima do salão) e em cima/embaixo nas mesas deitadas.

Cores dos lugares:

| Cor | Significado |
|---|---|
| Contorno branco vazado | Livre |
| Azul neon | Reservado — convite atribuído, pessoa ainda não chegou |
| Verde neon | Presente — check-in feito, pessoa está na festa |

Use a busca no topo do mapa para achar o lugar de alguém: digite o nome ou o número do
convite e o mapa rola até o lugar, que fica piscando em dourado.

Os botões de zoom e o de **encaixar na tela** ajudam a enxergar o salão inteiro ou dar zoom
numa região.

### 4. Cobrar os pendentes

Em **Financeiro** você vê a lista de quem ainda não pagou, com telefone, para cobrar antes
da festa. Dá para exportar tudo em CSV.

---

## No dia da festa: usando o check-in

Abra a página **Check-in** e deixe aberta. O fluxo é:

1. **Digite** o nome da pessoa ou o número do convite no campo grande
2. **Clique** no resultado certo
3. **Confirme** no botão “Confirmar entrada”

Ao selecionar a pessoa você já vê, na hora:

- Nome, número do convite e titular
- **Mesa e lugar** dela
- **Alerta vermelho** se o pagamento estiver pendente ou parcial
- Se ela tem direito a **camisa e caneca** ou só ao convite

Depois de confirmar, o campo limpa sozinho e já fica pronto para a próxima pessoa. O
contador no topo mostra quantos já entraram.

**Errou?** Cada check-in da lista lateral tem um botão de desfazer. Também dá para desfazer
pelo mapa, clicando no lugar da pessoa.

💡 *Dica: se a internet cair não tem problema — tudo roda no seu notebook, sem depender de
nada externo.*

---

## Durante a festa: sorteio de brindes

Abra a página **Sorteio**. Só aparecem na roleta as pessoas que **já fizeram check-in** —
ou seja, quem está de fato no salão. Quem ainda não chegou não concorre.

1. Clique em **“Girar roleta”** — a esteira roda e para no ganhador
2. Digite **qual foi o prêmio** (ex: “Kit churrasco”)
3. Marque **“Prêmio já foi entregue agora”** se entregou na hora
4. Clique em **“Confirmar ganhador”**

A partir daí, **essa pessoa sai da roleta e não pode ser sorteada de novo** — cada convidado
ganha no máximo um brinde.

**Coisas úteis de saber:**

- **Girar não grava nada sozinho.** O sorteio só é registrado quando você confirma o prêmio.
  Se clicar em “Descartar sorteio”, a pessoa continua concorrendo — serve para quando você
  girar sem querer ou o ganhador não estiver mais no salão.
- **Não entregou o prêmio na hora?** Deixe desmarcado e depois clique no selo
  “A entregar” na tabela para marcar como entregue. O card **“A entregar”** no topo mostra
  quantos prêmios ainda estão pendentes.
- **Errou o prêmio?** Botão de lápis na tabela edita o nome do prêmio.
- **Sorteou a pessoa errada?** Botão da lixeira remove o sorteio e ela **volta para a roleta**.

---

## Zerar o banco (tirar os dados de teste)

⚠️ **Apaga tudo.** Faça só antes de cadastrar os dados reais.

```bash
npx prisma migrate reset
```

Isso recria o banco vazio e roda o seed de novo. Se quiser o banco **totalmente vazio**,
sem os dados fictícios:

```bash
npx prisma migrate reset --skip-seed
```

## Backup

Rodando no notebook, os dados ficam num único arquivo: `prisma/dev.db`. Para fazer backup,
copie esse arquivo. **Recomendado copiar na véspera da festa.**

Se estiver usando a versão hospedada, os dados ficam no Turso e o backup é feito por lá.

## Senha de acesso

Rodando local, o site **não pede senha** — seria só atrapalhar na portaria.

Publicado na internet, ele **exige senha** (configurada na variável `SENHA_ACESSO`), porque o
painel expõe nome, telefone e situação de pagamento dos convidados. Detalhes em
[DEPLOY.md](DEPLOY.md).

Para testar o login no notebook, preencha `SENHA_ACESSO` no `.env` e reinicie o servidor.

---

## Estrutura do projeto

```
app/                    páginas (dashboard, mapa, convidados, checkin, sorteio,
                        financeiro, configuracoes)
components/
  ui/                   componentes base (botão, tabela, dialog…)
  tema/                 ilustrações SVG e confete do tema Simpsons
  <área>/               componentes de cada página
lib/
  actions/              Server Actions (toda a lógica de dados)
  prisma.ts             conexão com o banco
  validations.ts        validações Zod
  types.ts              status de pagamento, tipos de brinde e rótulos
prisma/
  schema.prisma         modelo de dados
  seed.ts               dados fictícios de teste
  dev.db                o banco (faça backup deste arquivo!)
```

## Comandos úteis

```bash
npx prisma studio
```

Abre uma interface visual para inspecionar/editar o banco direto, se precisar.
