# Prognosticos Mundial 2026

A low-cost PWA for a private World Cup 2026 prediction game among friends.

> **Dados das seleções atualizados para os grupos finais do Mundial 2026** (48 equipas, 12 grupos oficiais).

## Estado do projeto (junho 2026)

| Funcionalidade | Estado |
|---|---|
| App online na Vercel | ✅ Concluído |
| Sistema de convites (duas etapas) | ✅ Concluído |
| Aposta inicial: grupos, terceiros, bracket, prémios | ✅ Concluído |
| Submissão para Firestore com edição até deadline | ✅ Concluído |
| Pontuação: editor, scoringSettings, recálculo | ✅ Concluído |
| Admin: dashboard, convites, resultados, configurações | ✅ Concluído |
| Design Fase 5A (paleta escura, componentes base) | ✅ Iniciado — correções visuais em curso |
| Melhorias visuais `/aposta-inicial` | 🔜 Próximo foco |
| Jogos reais das eliminatórias + apostas | ⏳ Pendente |
| Odds automáticas / fallback manual | ⏳ Pendente |
| Notificações OneSignal | ⏳ Pendente |
| Ranking automático diário | ⏳ Pendente |

This starter includes:

- Next.js + TypeScript + Tailwind
- Firebase Auth integration
- Firestore client helpers
- Role-based admin guard
- PWA manifest
- OneSignal client bootstrap
- Pure scoring engine with tests
- Firestore security rules draft
- Minimal pages for login, dashboard, initial prediction, matches, leaderboard, rules, and admin

## 1. Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 2. Firebase setup

Create a Firebase project, enable:

- Authentication: Email/password
- Firestore Database
- Web app config

Paste the Firebase web config values into `.env.local`.

## 3. First admin user

Register normally in the app. Then, in Firebase Console, edit your document:

`users/{your_uid}`

Set:

```json
{
  "role": "admin"
}
```

## 4. Firestore rules

Review `firestore.rules`, then publish them in Firebase Console.

Important: ask a developer to review these before inviting real users.

## 5. Sistema de convites (fluxo em duas etapas)

O registo livre está bloqueado. O acesso é concedido em duas etapas:

**Etapa 1 — o utilizador cria a conta**

1. Aceder a `/login` e clicar em "Ainda nao tenho conta".
2. Preencher nome, email, password e confirmação de password.
3. A conta é criada com `approved=false` e `status="pending_access_code"`.
4. O utilizador é redirecionado para `/ativar` e fica bloqueado até receber o código.

**Etapa 2 — o admin gera e envia o código**

1. Aceder a `/admin/convites`.
2. Na secção "Utilizadores pendentes", localizar o utilizador.
3. Clicar em "Gerar codigo" — o sistema cria um código único associado ao `uid` e email desse utilizador.
4. Copiar o código e enviar manualmente ao utilizador (email, WhatsApp, etc.).

**Etapa 3 — o utilizador ativa a conta**

1. Aceder a `/ativar` (ou fazer login, que redireciona automaticamente).
2. Introduzir o código recebido e clicar em "Ativar conta".
3. A API valida o código server-side: verifica que existe, não foi usado e pertence a este uid/email.
4. Se válido: `users/{uid}.approved=true`, `status="approved"`, `invite.used=true`.
5. O utilizador é redirecionado para o dashboard.

**Regras de segurança**

- Cada código só pode ser usado uma vez.
- Um código gerado para um utilizador não pode ser usado por outro.
- A validação é feita server-side via Firebase Admin SDK.
- Os convites antigos (pré-registo) são mantidos no Firestore sem alterações.

**Variáveis de ambiente necessárias**

As rotas de admin de convites chamam o Firebase Admin SDK. Adicionar ao `.env.local`:

```text
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Obter estes valores em Firebase Console → Definições do projeto → Contas de serviço → Gerar nova chave privada.

**Publicar as Firestore rules**

As regras em `firestore.rules` incluem permissões para a coleção `invites`. Publicar antes de convidar utilizadores reais:

```bash
firebase deploy --only firestore:rules
```

## 6. Aposta inicial — Fase 2A

A página `/aposta-inicial` permite ao utilizador simular a fase de grupos completa antes de submeter a aposta.

- **Grupos ordenáveis**: dentro de cada grupo, as equipas podem ser arrastadas (drag-and-drop) para definir a ordem de classificação (1.º ao 4.º lugar).
- **Rascunho persistente**: enquanto a aposta não é submetida, o estado de todos os grupos é guardado automaticamente em `localStorage`, pelo que fechar ou refrescar a página não perde o trabalho.
- **Submissão única**: após o utilizador confirmar e submeter, a aposta fica bloqueada e não pode ser alterada.

## 7. Aposta inicial — Fase 2B

Esta fase estende o simulador de grupos com a gestão dos 3.ºs classificados.

- **Identificação automática dos terceiros**: após ordenar os grupos, a app recolhe automaticamente o 3.º classificado de cada um dos 12 grupos.
- **Ranking dos terceiros por drag-and-drop**: os 12 terceiros podem ser ordenados livremente por arrastamento para definir quais avançam.
- **Destaque dos 8 apurados**: os primeiros 8 da lista ficam visualmente destacados como qualificados para os oitavos de final; os restantes 4 ficam a cinzento.
- **Persistência em localStorage**: tal como os grupos, a ordenação dos terceiros é guardada automaticamente no browser — fechar ou refrescar a página não perde o trabalho.
- **Sem bracket nem submissão final ainda**: o bracket automático e a submissão definitiva para o Firestore serão implementados numa fase seguinte.

## 8. Aposta inicial — Fase 2C

Esta fase gera o bracket das eliminatórias a partir dos resultados do simulador de grupos e dos terceiros classificados.

- **Bracket automático**: após definir a ordem dos grupos e dos terceiros, a app constrói os oitavos de final, quartos, meias-finais e final com as 32 equipas apuradas.
- **Escolha de vencedores**: o utilizador percorre cada ronda e escolhe o vencedor de cada jogo clicando numa das duas equipas; os vencedores avançam automaticamente para a ronda seguinte.
- **Jogo do 3.º lugar (M103)**: incluído como confronto separado entre os dois perdedores das meias-finais.
- **Final (M104)**: incluída como o último jogo do bracket, com a lógica de pontuação mais elevada.
- **Persistência em localStorage**: todas as escolhas do bracket são guardadas automaticamente no browser — fechar ou refrescar a página não perde o trabalho.
- **TODO — alocação dos melhores terceiros**: a distribuição exata dos 8 melhores terceiros pelos oitavos de final segue regras oficiais da FIFA que dependem de quais grupos fornecem esses terceiros. Esta lógica está marcada como TODO e aguarda validação oficial antes de ser implementada com rigor.

## 9. Aposta inicial — Fase 2D

Esta fase completa o simulador inicial com a seleção de prémios individuais e a submissão para o Firestore, com edição permitida até à deadline.

- **Prémios individuais**: para além do bracket, o utilizador indica as suas escolhas para melhor marcador, melhor jogador, melhor jovem, melhor guarda-redes, bem como as equipas que alcançam cada ronda (oitavos, quartos, meias, final).
- **Submissão e edição via `/api/submit-initial-prediction`**: ao confirmar, o browser envia a aposta completa para esta rota de API, que valida e persiste os dados no Firestore. A aposta pode ser submetida e editada quantas vezes o utilizador quiser até à deadline.
- **Deadline de submissão**: `2026-06-11T18:00:00.000Z` (equivalente a 11/06/2026 às 19:00 em Portugal continental). Pode ser configurada em `appSettings/main.initialPredictionDeadline`; se o documento não existir, é usado o valor por defeito.
- **Antes da deadline**: a página mostra um banner com a data-limite e um botão "Editar aposta" após cada submissão. O botão de submissão diz "Submeter aposta" na primeira vez e "Guardar alterações" nas seguintes.
- **Depois da deadline**: a API rejeita qualquer POST com erro 403; a UI mostra a aposta em modo só-leitura sem botão de edição. Se o utilizador nunca submeteu, é mostrada a mensagem "O prazo para submeter a aposta inicial terminou."
- **`bracketChoices` persistidas**: as escolhas do bracket são guardadas no documento `initialPredictions/{uid}` para que o formulário de edição possa ser restaurado fielmente.
- **`submittedAt` preservado**: na primeira submissão é definido pelo servidor; em edições posteriores é mantido o valor original. O campo `updatedAt` é actualizado em cada alteração.
- **Flag no perfil do utilizador**: o campo `users/{uid}.hasSubmittedInitialPrediction` é definido como `true` para que o resto da app saiba que o utilizador já submeteu.
- **Sem cálculo de pontos ainda**: a pontuação desta aposta será calculada à medida que o torneio avançar; nesta fase, apenas a persistência está implementada.

## 10. Dashboard admin

A página `/admin` funciona como painel central de administração, com atalhos para todas as secções:

- **Convites e participantes** → `/admin/convites`
- **Resultados da aposta inicial** → `/admin/resultados`
- **Editor de pontuação** → `/admin/pontuacao`
- **Classificação** → `/classificacao`
- **Aposta inicial** → `/aposta-inicial`
- **Configurações** → `/admin/configuracoes`

A secção "Ferramentas" na parte inferior mantém os formulários de criação de equipas, jogos e resultados.

## 11. Configurações da app

A página `/admin/configuracoes` permite ao admin editar as definições globais da aplicação sem tocar no código.

**Campos editáveis:**

| Campo | Descrição |
|---|---|
| `competitionName` | Nome da competição mostrado na app |
| `initialPredictionDeadline` | Data-limite para submissão em ISO UTC (ex: `2026-06-11T18:00:00.000Z`) |
| `welcomeMessage` | Mensagem de boas-vindas opcional no dashboard |
| `initialPredictionStatus` | `open` — usa a deadline; `closed` — bloqueia imediatamente |

**Comportamento de `initialPredictionStatus`:**
- `open` (padrão): a deadline controla quando as submissões fecham.
- `closed`: a API rejeita qualquer POST a `/api/submit-initial-prediction` com 403, independentemente da deadline. A página `/aposta-inicial` mostra "A aposta inicial está temporariamente fechada pelo administrador."

**Defaults (se `appSettings/main` não existir):**
- `initialPredictionDeadline`: `2026-06-11T18:00:00.000Z` (11/06/2026 às 19:00 em Portugal continental)
- `initialPredictionStatus`: `open`

## 11. Editor de pontuação

A página `/admin/pontuacao` permite ao admin editar todos os valores de pontuação sem tocar no código.

- **Aposta inicial**: pontos para vencedor, finalista, 3.º lugar, 4.º lugar, prémios individuais e equipas apuradas por ronda (16-avos a final), posição correta no grupo.
- **Jogos eliminatórios**: multiplicador de odds, pontos por equipa qualificada e pontos por resultado exato — editáveis por ronda (16-avos, oitavos, quartos, meias, final).
- **Guardar pontuação**: persiste em `scoringSettings/main` no Firestore; o recálculo em `/admin/resultados` usa sempre estes valores.
- **Repor defaults**: restaura os valores de `defaultScoring` sem guardar (requer clicar em "Guardar" para persistir).
- Se `scoringSettings/main` não existir, a página carrega os valores de `defaultScoring` como ponto de partida.

## 11. OneSignal

Create a OneSignal Web Push app. Add your Vercel domain and local test domain if needed. Paste the app id into:

```text
NEXT_PUBLIC_ONESIGNAL_APP_ID=
```

Do not put the OneSignal REST API key in frontend code.

## 12. Deploy

Push to GitHub and import into Vercel.

In **Vercel → Project Settings → Environment Variables**, add all variables from `.env.example`:

```text
# Firebase client (public)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# OneSignal (public)
NEXT_PUBLIC_ONESIGNAL_APP_ID

# Firebase Admin SDK (server-side only — never expose publicly)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

The `FIREBASE_ADMIN_PRIVATE_KEY` value must include literal `\n` characters as they appear in the downloaded JSON (the app replaces them at runtime).

> **Security**: never commit `.env.local` or any Firebase service account JSON to the repository.

## 13. Notificações automáticas dos jogos eliminatórios (Fase 7C)

O endpoint `/api/cron/knockout-notifications` verifica periodicamente se há jogos eliminatórios com notificações pendentes e envia automaticamente via OneSignal.

### Criar CRON_SECRET

Gerar uma string aleatória segura (mínimo 32 caracteres):

```bash
# Linux / macOS
openssl rand -hex 32

# PowerShell (Windows)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Adicionar ao `.env.local`:

```text
CRON_SECRET=<valor gerado acima>
```

E adicionar em **Vercel → Project Settings → Environment Variables**:

| Nome | Valor | Environments |
|---|---|---|
| `CRON_SECRET` | `<valor gerado>` | Production, Preview |

> **Nunca** usar prefixo `NEXT_PUBLIC_` — esta variável é exclusivamente server-side.

### Testar o endpoint manualmente

Sem esperar por um jogo real, podes testar da seguinte forma:

**1. Preparar um match de teste no Firestore Console:**

Abrir qualquer documento em `knockoutMatches` (ex: `M73`) e editar temporariamente:

```json
{
  "notificationStatus": "pending",
  "notificationScheduledAt": "<agora menos 2 minutos em ISO UTC>",
  "startsAt": "<agora mais 1 hora em ISO UTC>",
  "bettingOpen": true,
  "status": "scheduled"
}
```

Exemplo de valores (substituir pela hora actual):
```
notificationScheduledAt: "2026-06-03T14:00:00.000Z"
startsAt: "2026-06-03T15:30:00.000Z"
```

**2. Chamar o endpoint (GET ou POST):**

```bash
# Produção
curl -X GET "https://<teu-dominio>.vercel.app/api/cron/knockout-notifications" \
  -H "Authorization: Bearer <CRON_SECRET>"

# Desenvolvimento local (npm run dev activo)
curl -X GET "http://localhost:3000/api/cron/knockout-notifications" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

**3. Verificar resultados:**

- Resposta JSON deve conter `"results": [{ "matchId": "M73", "result": "sent" }]`
- Firestore: campo `notificationStatus` mudou para `"sent"`, `notificationSentAt` preenchido
- Firestore `notificationLogs`: novo documento criado com `sentBy: "cron"`
- OneSignal Dashboard → Sent Messages: notificação visível

**4. Testar idempotência:**

Correr o mesmo curl duas vezes seguidas. A segunda execução deve devolver `"result": "skipped"` para o mesmo match — sem notificação duplicada.

**5. Testar autenticação:**

```bash
curl -X GET "http://localhost:3000/api/cron/knockout-notifications"
# → 401 Nao autorizado.

curl -X GET "http://localhost:3000/api/cron/knockout-notifications" \
  -H "Authorization: Bearer token-errado"
# → 401 Nao autorizado.
```

### Configurar scheduler externo (cada 5 minutos)

> **Vercel Hobby não suporta crons a cada 5 minutos.** O plano gratuito limita a 1 invocação por dia. Para uma frequência adequada, usa um scheduler externo.

#### Opção A — cron-job.org (gratuito, recomendado)

1. Criar conta em [cron-job.org](https://cron-job.org)
2. Criar um novo cron job:
   - **URL**: `https://<teu-dominio>.vercel.app/api/cron/knockout-notifications`
   - **Método HTTP**: `GET`
   - **Cabeçalho**: `Authorization: Bearer <CRON_SECRET>`
   - **Schedule**: a cada 5 minutos (`*/5 * * * *`)
   - **Timeout**: 30 segundos
3. Activar e guardar

#### Opção B — GitHub Actions

Criar `.github/workflows/cron-notifications.yml` no repositório:

```yaml
name: Knockout notifications cron
on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger notification check
        run: |
          curl -f -X GET \
            "https://<teu-dominio>.vercel.app/api/cron/knockout-notifications" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Adicionar `CRON_SECRET` em **GitHub → Repository Settings → Secrets → Actions**.

#### Opção C — Vercel Pro

No plano Pro, podes usar o sistema de crons nativo da Vercel criando `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/knockout-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

A Vercel injeta automaticamente o header `Authorization: Bearer <CRON_SECRET>` quando a variável `CRON_SECRET` está configurada no projecto.

### Como funciona a idempotência

Para evitar notificações duplicadas quando o scheduler corre várias vezes:

1. O cron encontra matches elegíveis (`notificationStatus` não é `"sent"`, `"sending"` ou `"failed"`)
2. Para cada match, corre uma **transação Firestore** que relê o documento e só avança se o status ainda for elegível — marcando-o como `"sending"`
3. Só depois da transação bem-sucedida envia para a OneSignal
4. Actualiza para `"sent"` (ou `"failed"`)

Se dois processos correrem em paralelo, apenas um ganha a transação e prossegue.

## Design — Fase 5A (Design System Global)

Redesign visual global implementado como fundação para as fases seguintes.

**Paleta**

| Token | Valor | Uso |
|---|---|---|
| `pitch-950` | `#0d1117` | Fundo base da app |
| `pitch-800` | `#161b22` | Superfície de cards |
| `pitch-700` | `#21262d` | Hover/elevado |
| `pitch-500` | `#30363d` | Bordas e separadores |
| `neon-500` / `brand-500` | `#22c55e` | Verde principal |
| `gold-400` | `#fbbf24` | Dourado (destaques/admin) |

**Ficheiros alterados**

| Ficheiro | O que mudou |
|---|---|
| `tailwind.config.ts` | Paleta `pitch`, `gold`, `neon`, gradientes, sombras, `font-sans` |
| `src/app/globals.css` | Tema escuro, CSS vars, inputs escuros, scrollbar custom, readability bridge |
| `src/app/layout.tsx` | Fonte Inter via `next/font`, `pb-16 md:pb-0` para bottom nav |
| `src/components/NavBar.tsx` | Navbar escura + bottom navigation mobile com ícones |
| `src/components/Button.tsx` | 5 variantes: `primary`, `secondary`, `ghost`, `danger`, `gold` |
| `src/components/Card.tsx` | Card escuro com prop `accent` (brand/gold/none) |

**Navbar**
- Desktop: barra topo com logo, links e botão de logout.
- Mobile: barra topo minimalista (logo + admin + logout) + bottom navigation fixo com 5 ícones.

**Compatibilidade retroativa**
O `globals.css` inclui um "readability bridge" que remapeia classes `text-slate-*` para equivalentes legíveis no tema escuro, sem tocar nas páginas ainda não redesenhadas. Este bloco pode ser removido após a Fase 5E.
