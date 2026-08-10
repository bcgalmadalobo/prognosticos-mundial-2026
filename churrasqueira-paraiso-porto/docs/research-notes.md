# Research Notes

Research date: 2026-07-09

## Client-provided canonical data

- Business name: Churrasqueira Paraíso do Porto
- Address: Rua do Paraíso 230, Porto, Portugal
- Phone: +351 222 083 456

## Exact-match result

I did not find a reliable public source that clearly matches both the provided address `Rua do Paraíso 230` and phone `+351 222 083 456`.

The current demo keeps the client-provided address and phone in public CTAs, but all public listing/menu/review data from similar entities is marked as `conflict` or `unverified` in the data files until the owner confirms the correct identity.

## Similar public listings found

### Churrasqueira Paraíso / Churrasqueira Paraíso 1

Sources:

- Restaurant Guru: https://pt.restaurantguru.com/restaurante-paraiso-Porto-3
- Tripadvisor: https://www.tripadvisor.com.br/Restaurant_Review-g189180-d3464202-Reviews-Churrasqueira_Paraiso_1-Porto_Porto_District_Northern_Portugal.html
- Facebook: https://www.facebook.com/paraisochurrasqueira/
- Uber Eats: https://www.ubereats.com/pt/store/churrasqueira-paraiso/iRprKyZ3VeybEsSGefPSYg
- Corner: https://www.corner.inc/place/p4NRYsHvGg8m

Observed data:

- Name variants: Churrasqueira Paraíso, Churrasqueira Paraíso 1, Churrasqueira Paraiso 1
- Address variants: Rua do Paraíso 246 and Rua do Paraíso 248, Porto
- Phone: +351 22 205 7135
- Cuisine/category: Portuguese, churrasqueira, barbecue/grill, take-away/delivery
- Restaurant Guru listed Google rating 4.3 with 2793 reviews, Trip 4.4 with 481 reviews, and Facebook 4.5 with 52 reviews.
- Restaurant Guru listed hours as Monday closed and Tuesday-Sunday 12:00-15:00 / 19:00-22:30.
- Tripadvisor listed a conflicting schedule around 09:00-15:00 / 19:00-22:30.
- Uber Eats listed Churrasqueira Paraíso at Rua do Paraíso 248 with menu categories Entradas, Sopas, Carne, Churrasco, Peixe, and Guarnição.

Menu data used in `src/data/menu.ts` comes from the Uber Eats and Restaurant Guru pages above and is marked `sourceStatus: "conflict"` because the public listing does not match the client-provided address/phone.

Review data used in `src/data/reviews.ts` is short public review text from Restaurant Guru/Tripadvisor and is marked `identityStatus: "conflict"` for the same reason.

### Delivery platforms

- Uber Eats: direct Churrasqueira Paraíso listing found for Rua do Paraíso 248. Kept in `src/data/deliveryLinks.ts` as `conflict`, not shown publicly as official.
- Bolt Food: public results found for Churrasqueira Porto Paraíso / Churrasqueira Porto Paraíso II. Name and identity conflict; kept as `conflict`, not shown publicly.
- Glovo: no direct exact match found; kept as `unverified`.

### Similar entities not merged

- Casa Paraíso: https://casaparaiso.eatbu.com/ appears to be a different restaurant at Rua do Paraíso 259.
- Churrasqueira Porto Paraíso / Porto Paraíso: public results point to Rua Nova de São Crispim 85 and a different phone.
- Paraíso do Churrasco / Churrasqueira América: public results point to Rua do Heroísmo 50 and are not the same entity.

## Assumptions in this build

- Public CTAs use the client-provided phone and address.
- The site avoids public Uber Eats, Bolt Food, and Glovo buttons until direct links are confirmed for the exact business.
- Stock food/interior/Porto imagery is used as demo-safe visual material. Replace with owner-approved restaurant photos before launch.
- Schema.org Restaurant data uses client-provided address and phone, but omits aggregate ratings and opening hours because the matching public identity is unresolved.

## TODO before production

- Ask the owner to confirm whether the correct public identity is Churrasqueira Paraíso / Churrasqueira Paraíso 1 at Rua do Paraíso 246/248.
- Confirm the official phone number.
- Confirm current opening hours directly with the owner or the verified Google Business Profile.
- Confirm whether the restaurant owns or controls the Facebook page.
- Confirm direct Uber Eats, Bolt Food, and Glovo links for the exact restaurant.
- Replace stock imagery with licensed or owner-approved real photos.
- Confirm menu prices, half-dose/full-dose logic, and item availability.
- If the public listing is confirmed, update schema.org with verified opening hours and aggregate rating.
