# Churrasqueira Paraíso do Porto

Production-oriented Next.js site for a Portuguese churrasqueira / take-away restaurant in Porto.

The site is data-driven, responsive, SEO-ready, and prepared for owner review. Public CTAs currently use the client-provided address and phone. Public research found a strong identity conflict, documented in `docs/research-notes.md`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- framer-motion
- Docker

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Docker

```bash
docker compose build
docker compose up
```

The container serves the production build on `http://localhost:3000`.

## Deployment

### Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Use `pnpm install` as the install command.
4. Use `pnpm build` as the build command.
5. Deploy with the Next.js preset.

### Netlify

1. Push this folder to GitHub.
2. Import the repo in Netlify.
3. Use `pnpm install` as the install command.
4. Use `pnpm build` as the build command.
5. Use `.next` / the Netlify Next.js runtime defaults.

## Editing content

- Restaurant info: `src/data/restaurant.ts`
- Menu: `src/data/menu.ts`
- Reviews: `src/data/reviews.ts`
- Delivery links: `src/data/deliveryLinks.ts`
- Gallery: `src/data/gallery.ts`
- UI translations: `src/i18n/dictionaries.ts`

## Important verification note

Before production, confirm whether the correct public identity is the similar listing for `Churrasqueira Paraíso / Churrasqueira Paraíso 1` at Rua do Paraíso 246/248 with phone `+351 22 205 7135`, or the client-provided Rua do Paraíso 230 / `+351 222 083 456`.

Do not publish delivery links, aggregate ratings, opening hours, or real listing photos until the identity is confirmed.
