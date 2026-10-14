# Colocar o site no ar

Guia para publicar o painel na internet e acessar de qualquer lugar (celular, outro
computador, fora de casa).

**Tudo aqui é gratuito.** São dois serviços:

| Serviço | Para quê | Custo |
|---|---|---|
| **Turso** | Guardar os dados (banco) | Grátis |
| **Vercel** | Rodar o site | Grátis |

> ⚠️ **Por que não dá para usar o GitHub Pages:** ele só serve páginas estáticas. Este
> sistema precisa de um servidor rodando (para gravar check-in, sorteio, pagamentos) e de um
> banco de dados. O GitHub continua sendo onde o **código** fica guardado — é dele que a
> Vercel puxa o site.

---

## Antes de começar: entenda o risco

O painel mostra **nome, telefone e situação de pagamento** dos seus convidados. Na internet,
qualquer pessoa com o link tentaria abrir isso.

Por isso o site agora tem **senha**. Ela é configurada na etapa 3 e é **obrigatória** em
produção. Sem definir a senha, o site sobe destrancado — não faça isso.

---

## Etapa 1 — Criar o banco no Turso

1. Acesse **https://turso.tech** e crie sua conta (dá para entrar com o próprio GitHub).
2. Crie um banco novo. Pode chamar de `festa-socadinha`.
3. Guarde as **duas informações** que ele te dá:
   - a **URL** do banco, que começa com `libsql://`
   - o **token de autenticação**, um texto longo

> 🔒 Esse token é uma chave de acesso ao seu banco. Não cole em conversa, não mande por
> WhatsApp e não coloque em nenhum arquivo do projeto — ele vai direto no painel da Vercel,
> na etapa 3.

### Criar as tabelas no banco novo

O banco nasce vazio. Para criar a estrutura, gere o SQL:

```bash
npm run db:sql > estrutura.sql
```

Depois abra o **console SQL do banco** dentro do site do Turso, cole o conteúdo do arquivo
`estrutura.sql` e execute. Isso cria as tabelas de mesas, lugares, convidados, convites e
sorteios.

---

## Etapa 2 — Conectar o repositório na Vercel

1. Acesse **https://vercel.com** e crie sua conta **entrando com o GitHub**.
2. Clique em **Add New → Project**.
3. Escolha o repositório **`festa-do-socadinha-2026`** e clique em **Import**.
4. **Ainda não clique em Deploy** — falta configurar as variáveis (próxima etapa).

---

## Etapa 3 — Configurar as variáveis de ambiente

Ainda na tela de importação da Vercel, abra **Environment Variables** e cadastre estas quatro:

| Nome | Valor |
|---|---|
| `TURSO_DATABASE_URL` | a URL `libsql://...` da etapa 1 |
| `TURSO_AUTH_TOKEN` | o token da etapa 1 |
| `SENHA_ACESSO` | a senha que você vai usar para entrar no painel |
| `SESSION_SECRET` | uma sequência aleatória longa (40+ caracteres) |

**Sobre a `SENHA_ACESSO`:** escolha uma senha boa e que você consiga digitar rápido no celular
na porta da festa. Ela é a única coisa protegendo os dados dos convidados.

**Sobre o `SESSION_SECRET`:** é o que impede alguém de forjar o cookie de login. Precisa ser
aleatório. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e cole na Vercel.

Agora sim, clique em **Deploy**. Em 2–3 minutos o site estará no ar numa URL tipo
`festa-do-socadinha-2026.vercel.app`.

---

## Etapa 4 — Montar o salão na nuvem

O banco da nuvem começa **sem nenhuma mesa** — ele é separado do banco do seu notebook.

1. Abra a URL da Vercel e entre com a senha.
2. Vá em **Configurações** e clique em **Aplicar planta**.
3. Confirme. As 72 mesas e os 328 lugares são criados.

Pronto — daí é só cadastrar os convites normalmente.

---

## Como fica seu notebook depois disso

**Nada muda.** O `npm run dev` continua usando o arquivo `prisma/dev.db` e continua sem pedir
senha, porque as variáveis do Turso e da senha só existem na Vercel.

Ou seja, você fica com **dois ambientes separados**:

| | Notebook (`npm run dev`) | Internet (Vercel) |
|---|---|---|
| Banco | arquivo `prisma/dev.db` | Turso |
| Senha | não pede | pede |
| Funciona sem internet | ✅ sim | ❌ não |

> ⚠️ **Os dois bancos não conversam entre si.** Um convite cadastrado no notebook não aparece
> no site da internet e vice-versa. **Escolha um e use só ele** para valer — misturar os dois
> vira confusão na hora da festa.

---

## Recomendação para o dia da festa

Se você for usar a versão da internet no dia:

- **Teste a internet do salão antes.** Se o Wi-Fi de lá for ruim, o check-in trava — e você vai
  ter 250 pessoas na fila. Leve um celular com 4G para usar como roteador, por garantia.
- **Deixe a página de check-in já aberta e logada** antes de começar a chegar gente.

Se a internet do salão for duvidosa, o mais seguro é usar **o notebook local** no dia (que
funciona offline) e a versão da internet só para organizar antes.

---

## Atualizar o site depois de mexer no código

A Vercel republica sozinha a cada envio para o GitHub:

```bash
git add -A
```

```bash
git commit -m "descrição do que mudou"
```

```bash
git push
```

Em ~2 minutos a versão nova está no ar.

---

## Trocar a senha depois

1. Na Vercel: **Settings → Environment Variables**, edite `SENHA_ACESSO`.
2. Vá em **Deployments** e clique em **Redeploy** na última publicação.

Trocar a senha (ou o `SESSION_SECRET`) **desconecta todo mundo** que estava logado — o que é
exatamente o que você quer se alguém não devia mais ter acesso.

---

## Se algo der errado

| Problema | Causa provável |
|---|---|
| Site abre sem pedir senha | `SENHA_ACESSO` não foi cadastrada na Vercel |
| "Erro ao carregar" em todas as páginas | `TURSO_DATABASE_URL` ou `TURSO_AUTH_TOKEN` errados |
| Site abre mas não tem nenhuma mesa | Falta rodar **Aplicar planta** (etapa 4) |
| Erro de tabela inexistente | O SQL da etapa 1 não foi executado no Turso |
| Login não gruda, volta pro login | `SESSION_SECRET` diferente entre deploys |
