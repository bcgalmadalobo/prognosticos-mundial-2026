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

## Estado atual (junho 2026)

A app está online na Vercel.

### Implementado

- **Convites**: utilizador cria conta → fica `pending_access_code` → admin gera código em `/admin/convites` → utilizador ativa em `/ativar`
- **Aposta inicial** (`/aposta-inicial`): grupos (drag-and-drop), melhores terceiros, bracket, 3.º/4.º lugar, prémios individuais, submissão para Firestore, edição até deadline configurável
- **Pontuação**: resultados iniciais em `/admin/resultados`, `scoringSettings`, editor em `/admin/pontuacao`, recálculo de `initialPoints`
- **Admin**: dashboard `/admin`, convites, resultados, pontuação, configurações (`/admin/configuracoes`)
- **Design**: Fase 5A implementada (paleta escura, componentes `Button`/`Card`, `NavBar` desktop + mobile)

### Próximo foco recomendado

Melhorar visualmente `/aposta-inicial` (correções visuais Fase 5B).

### Ainda por implementar (ver SPEC.md)

- Jogos reais das eliminatórias (apostas, odds, resultados)
- Notificações OneSignal
- Ranking automático diário
