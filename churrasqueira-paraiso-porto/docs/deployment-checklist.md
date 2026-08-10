# Deployment Checklist

## Data integrity

- Confirm exact legal/trading name.
- Confirm address and phone.
- Confirm opening hours.
- Confirm menu items, prices, portions, and availability.
- Confirm delivery links for Uber Eats, Bolt Food, and Glovo.
- Confirm whether reviews belong to the exact same restaurant profile.
- Replace stock images with licensed or owner-approved photos.

## Technical

- Set the production domain in `metadataBase`, sitemap, robots, and README examples.
- Run `pnpm lint`.
- Run `pnpm typecheck`.
- Run `pnpm build`.
- Run `docker compose build`.
- Check mobile sticky bottom bar on iOS and Android viewport sizes.
- Verify all external links.
- Verify Google Maps embed points to the confirmed address.

## SEO

- Update schema.org Restaurant data with verified opening hours.
- Add `sameAs` links only for confirmed profiles.
- Add aggregate rating only after the correct Google profile is confirmed.
- Connect Google Search Console after launch.
- Submit sitemap after production domain is live.
