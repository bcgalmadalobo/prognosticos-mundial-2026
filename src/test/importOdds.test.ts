import { describe, expect, it } from "vitest";
import {
  normalizeTeamName,
  resolveApiTeamName,
  findMatchingApiEvent,
  extractOdds,
} from "@/lib/importOdds";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(opts: {
  id?: string;
  home: string;
  away: string;
  commenceTime?: string;
  bookmakers?: Array<{
    key: string;
    outcomes: Array<{ name: string; price: number }>;
  }>;
}) {
  return {
    id: opts.id ?? "evt1",
    sport_key: "soccer_fifa_world_cup",
    commence_time: opts.commenceTime ?? "2026-06-28T19:00:00Z",
    home_team: opts.home,
    away_team: opts.away,
    bookmakers: (opts.bookmakers ?? []).map((bk) => ({
      key: bk.key,
      title: bk.key,
      markets: [{ key: "h2h", outcomes: bk.outcomes }],
    })),
  };
}

// ── normalizeTeamName ──────────────────────────────────────────────────────────

describe("normalizeTeamName", () => {
  it("lowercases plain names", () => {
    expect(normalizeTeamName("Brazil")).toBe("brazil");
  });

  it("strips accents from Türkiye", () => {
    expect(normalizeTeamName("Türkiye")).toBe("turkiye");
  });

  it("strips accents from Côte d'Ivoire", () => {
    expect(normalizeTeamName("Côte d'Ivoire")).toBe("cote divoire");
  });

  it("converts hyphens to spaces", () => {
    expect(normalizeTeamName("Bosnia-Herzegovina")).toBe("bosnia herzegovina");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeTeamName("South   Korea")).toBe("south korea");
  });

  it("strips IR prefix for Iran", () => {
    const result = normalizeTeamName("IR Iran");
    expect(result).toBe("ir iran");
  });
});

// ── resolveApiTeamName ────────────────────────────────────────────────────────

describe("resolveApiTeamName", () => {
  it("resolves Brazil", () => {
    expect(resolveApiTeamName("Brazil")).toBe("brazil");
  });

  it("resolves Korea Republic to south_korea", () => {
    expect(resolveApiTeamName("Korea Republic")).toBe("south_korea");
  });

  it("resolves South Korea to south_korea", () => {
    expect(resolveApiTeamName("South Korea")).toBe("south_korea");
  });

  it("resolves Türkiye to turkey", () => {
    expect(resolveApiTeamName("Türkiye")).toBe("turkey");
  });

  it("resolves IR Iran to iran", () => {
    expect(resolveApiTeamName("IR Iran")).toBe("iran");
  });

  it("resolves USA to usa", () => {
    expect(resolveApiTeamName("USA")).toBe("usa");
  });

  it("resolves United States to usa", () => {
    expect(resolveApiTeamName("United States")).toBe("usa");
  });

  it("resolves Côte d'Ivoire to ivory_coast", () => {
    expect(resolveApiTeamName("Côte d'Ivoire")).toBe("ivory_coast");
  });

  it("resolves Bosnia and Herzegovina to bosnia_herzegovina", () => {
    expect(resolveApiTeamName("Bosnia and Herzegovina")).toBe("bosnia_herzegovina");
  });

  it("resolves DR Congo to dr_congo", () => {
    expect(resolveApiTeamName("DR Congo")).toBe("dr_congo");
  });

  it("returns null for unknown team", () => {
    expect(resolveApiTeamName("Atlantis FC")).toBeNull();
  });
});

// ── findMatchingApiEvent ──────────────────────────────────────────────────────

describe("findMatchingApiEvent", () => {
  const STARTS_AT = "2026-06-28T19:00:00Z";

  it("finds event when home=teamA, away=teamB", () => {
    const events = [makeEvent({ home: "Brazil", away: "Argentina", commenceTime: STARTS_AT })];
    const r = findMatchingApiEvent("brazil", "argentina", STARTS_AT, events);
    expect(r.found).toBe(true);
    if (r.found) {
      expect(r.teamAIsHome).toBe(true);
      expect(r.event.id).toBe("evt1");
    }
  });

  it("finds event when home=teamB, away=teamA (reversed)", () => {
    const events = [makeEvent({ home: "Argentina", away: "Brazil", commenceTime: STARTS_AT })];
    const r = findMatchingApiEvent("brazil", "argentina", STARTS_AT, events);
    expect(r.found).toBe(true);
    if (r.found) expect(r.teamAIsHome).toBe(false);
  });

  it("returns not found when teams don't match", () => {
    const events = [makeEvent({ home: "Spain", away: "France", commenceTime: STARTS_AT })];
    const r = findMatchingApiEvent("brazil", "argentina", STARTS_AT, events);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.ambiguous).toBe(false);
  });

  it("returns not found when time is too far off (>3h)", () => {
    const events = [makeEvent({ home: "Brazil", away: "Argentina", commenceTime: "2026-06-28T00:00:00Z" })];
    const r = findMatchingApiEvent("brazil", "argentina", STARTS_AT, events);
    expect(r.found).toBe(false);
  });

  it("finds when time is within ±3h", () => {
    const events = [makeEvent({ home: "Brazil", away: "Argentina", commenceTime: "2026-06-28T21:59:00Z" })];
    const r = findMatchingApiEvent("brazil", "argentina", STARTS_AT, events);
    expect(r.found).toBe(true);
  });

  it("returns ambiguous when multiple events match", () => {
    const events = [
      makeEvent({ id: "e1", home: "Brazil", away: "Argentina", commenceTime: STARTS_AT }),
      makeEvent({ id: "e2", home: "Argentina", away: "Brazil", commenceTime: STARTS_AT }),
    ];
    const r = findMatchingApiEvent("brazil", "argentina", STARTS_AT, events);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.ambiguous).toBe(true);
  });

  it("handles FIFA name variants (Korea Republic)", () => {
    const events = [makeEvent({ home: "Korea Republic", away: "Germany", commenceTime: STARTS_AT })];
    const r = findMatchingApiEvent("south_korea", "germany", STARTS_AT, events);
    expect(r.found).toBe(true);
  });
});

// ── extractOdds ───────────────────────────────────────────────────────────────

describe("extractOdds", () => {
  it("extracts odds when teamA is home", () => {
    const event = makeEvent({
      home: "Brazil",
      away: "Argentina",
      bookmakers: [
        {
          key: "bet365",
          outcomes: [
            { name: "Brazil", price: 2.1 },
            { name: "Draw", price: 3.2 },
            { name: "Argentina", price: 3.5 },
          ],
        },
      ],
    });
    const r = extractOdds(event, true);
    expect(r).not.toBeNull();
    expect(r?.oddsTeamA).toBe(2.1);
    expect(r?.oddsDraw).toBe(3.2);
    expect(r?.oddsTeamB).toBe(3.5);
    expect(r?.bookmaker).toBe("bet365");
  });

  it("extracts odds when teamA is away (swaps correctly)", () => {
    const event = makeEvent({
      home: "Argentina",
      away: "Brazil",
      bookmakers: [
        {
          key: "unibet",
          outcomes: [
            { name: "Argentina", price: 3.5 },
            { name: "Draw", price: 3.2 },
            { name: "Brazil", price: 2.1 },
          ],
        },
      ],
    });
    const r = extractOdds(event, false); // teamA=Brazil is away
    expect(r?.oddsTeamA).toBe(2.1); // Brazil (away)
    expect(r?.oddsTeamB).toBe(3.5); // Argentina (home)
  });

  it("prefers bet365 over unibet", () => {
    const event = makeEvent({
      home: "Brazil",
      away: "Argentina",
      bookmakers: [
        {
          key: "unibet",
          outcomes: [
            { name: "Brazil", price: 2.2 },
            { name: "Draw", price: 3.3 },
            { name: "Argentina", price: 3.6 },
          ],
        },
        {
          key: "bet365",
          outcomes: [
            { name: "Brazil", price: 2.1 },
            { name: "Draw", price: 3.2 },
            { name: "Argentina", price: 3.5 },
          ],
        },
      ],
    });
    const r = extractOdds(event, true);
    expect(r?.bookmaker).toBe("bet365");
    expect(r?.oddsTeamA).toBe(2.1);
  });

  it("skips bookmaker with odds <= 1", () => {
    const event = makeEvent({
      home: "Brazil",
      away: "Argentina",
      bookmakers: [
        {
          key: "bet365",
          outcomes: [
            { name: "Brazil", price: 0 },
            { name: "Draw", price: 3.2 },
            { name: "Argentina", price: 3.5 },
          ],
        },
        {
          key: "unibet",
          outcomes: [
            { name: "Brazil", price: 2.1 },
            { name: "Draw", price: 3.2 },
            { name: "Argentina", price: 3.5 },
          ],
        },
      ],
    });
    const r = extractOdds(event, true);
    expect(r?.bookmaker).toBe("unibet");
  });

  it("returns null when no bookmaker has complete odds", () => {
    const event = makeEvent({
      home: "Brazil",
      away: "Argentina",
      bookmakers: [
        {
          key: "bet365",
          outcomes: [
            { name: "Brazil", price: 2.1 },
            // missing Draw and Argentina
          ],
        },
      ],
    });
    const r = extractOdds(event, true);
    expect(r).toBeNull();
  });

  it("rounds odds to 2 decimal places", () => {
    const event = makeEvent({
      home: "Brazil",
      away: "Argentina",
      bookmakers: [
        {
          key: "bet365",
          outcomes: [
            { name: "Brazil", price: 2.123456 },
            { name: "Draw", price: 3.200001 },
            { name: "Argentina", price: 3.499999 },
          ],
        },
      ],
    });
    const r = extractOdds(event, true);
    expect(r?.oddsTeamA).toBe(2.12);
    expect(r?.oddsDraw).toBe(3.2);
    expect(r?.oddsTeamB).toBe(3.5);
  });
});
