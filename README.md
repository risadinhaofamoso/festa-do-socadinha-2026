# ⚽ FUT-SD · Futebol de Quarta 2026

Site para controlar a pelada de quarta-feira: tabela geral do ano, cartinhas estilo FIFA de cada
jogador, geração automática de times equilibrados, controle da partida (cronômetro + placar) e
votação do melhor em campo.

> 📖 A fonte de verdade do projeto é o [PROJECT_BRAIN.md](PROJECT_BRAIN.md). Leia antes de mexer.

## O que o site faz

- **Tabela Geral (`/`)** — pontuação acumulada do ano com destaques: Melhor do Ano, Melhor Goleiro,
  Mais Presente e o **G6** (os 6 primeiros, que levam premiação). Abaixo, o histórico de partidas.
- **Jogadores (`/jogadores`)** — grade de cartinhas FIFA; clique abre todos os atributos.
- **Gerar Times (`/gerar`)** — marque quem veio (e quem é torcida), gere times equilibrados pela
  colocação na tabela + cartinhas, veja no campo e salve como partida.
- **Partidas (`/partidas` e `/partidas/[id]`)** — inicie, cronometre, confirme o resultado e veja os
  pontos do dia.
- **Votação (`/votar`)** — melhor em campo por CPF (uma vez por time; empate vota nos dois times).
- **Cadastrar (`/usuarios`)** — novos jogadores com foto, posição e atributos da carta.

## Pontuação

`pontos = 3·vitórias + 1·empates + 2·(jogos + presenças como torcida) + 1·(melhor em campo)`

Cada jogador parte do estado consolidado na **35ª partida** (importado da planilha oficial) e as
partidas lançadas no site somam por cima. Detalhes em [PROJECT_BRAIN.md](PROJECT_BRAIN.md) §2–3.

## Rodando localmente

```bash
npm install
cp .env.example .env          # DATABASE_URL já aponta para o arquivo local
npx prisma migrate dev        # cria o banco e roda a seed (47 jogadores)
npm run dev                   # http://localhost:3000
```

Para recriar os dados da seed a qualquer momento: `npm run db:seed`.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Prisma + SQLite (libSQL/Turso em
produção) · Zod · Server Actions. Tema escuro/neon dourado.

## Publicar

Login por senha e banco no Turso para hospedar na Vercel — veja [DEPLOY.md](DEPLOY.md).
⚠️ Em produção, defina `SENHA_ACESSO`: o painel mostra nomes e CPFs de votos.
