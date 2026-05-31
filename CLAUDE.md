# Prognosticos Mundial 2026

Private prediction game for friends. It is not gambling and has no real-money payments, deposits, withdrawals, or monetary prizes.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firestore
- OneSignal Web Push
- Vercel

## Non-negotiables

- Keep the scoring logic pure in `src/lib/scoring.ts`.
- Do not call Firestore from scoring functions.
- Keep user predictions locked after submission.
- Never expose Firebase admin credentials or OneSignal REST API keys in client code.
- Use `NEXT_PUBLIC_` only for public browser config.
- Admin routes must check `users/{uid}.role === "admin"`.
- Prefer small changes and run `npm run typecheck` and `npm test` after edits.

## Collections

- users
- teams
- groups
- matches
- initialPredictions
- matchPredictions
- scoringSettings
- leaderboard
- appSettings

## Default scoring

Initial:
- winner: 80
- runnerUp: 60
- topScorer: 40
- bestPlayer: 40
- bestYoungPlayer: 30
- bestGoalkeeper: 25
- finalTeam: 40
- semiFinalTeam: 25
- quarterFinalTeam: 15
- roundOf16Team: 10
- roundOf32Team: 5
- groupPosition: 5

Knockout defaults:
- round_of_32: odds x2 + 1 for qualified team
- round_of_16: odds x2 + 1 for qualified team
- quarter_final: odds x3 + 2 for qualified team + 10 exact score after 120 minutes
- semi_final: odds x5 + 5 for qualified team + 15 exact score after 120 minutes
- final: odds x5 + 5 for qualified team + 25 exact score after 120 minutes

# Especificação final obrigatória

Antes de implementar novas funcionalidades, ler obrigatoriamente o ficheiro SPEC.md.

A app final não é apenas um CRUD simples.
É uma PWA privada de prognósticos do Mundial 2026 com:
- convites individuais;
- simulador inicial completo;
- grupos ordenáveis;
- melhores terceiros lugares;
- bracket automático;
- aposta inicial bloqueada;
- pontuação completa;
- jogos reais das eliminatórias;
- notificações;
- ranking automático.

Prioridade imediata:
1. implementar sistema de convites individuais;
2. bloquear registo livre;
3. criar página admin para gerir convites;
4. depois implementar o simulador inicial.

Não continuar a desenvolver importação CSV simples antes de concluir o sistema de convites.

# Especificação final obrigatória

Antes de implementar novas funcionalidades, ler obrigatoriamente o ficheiro SPEC.md.

A app final não é apenas um CRUD simples.
É uma PWA privada de prognósticos do Mundial 2026 com:
- convites individuais;
- simulador inicial completo;
- grupos ordenáveis;
- melhores terceiros lugares;
- bracket automático;
- aposta inicial bloqueada;
- pontuação completa;
- jogos reais das eliminatórias;
- notificações;
- ranking automático.

Prioridade imediata:
1. implementar sistema de convites individuais;
2. bloquear registo livre;
3. criar página admin para gerir convites;
4. depois implementar o simulador inicial.

Não continuar a desenvolver importação CSV simples antes de concluir o sistema de convites.
