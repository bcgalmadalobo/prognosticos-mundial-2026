import { describe, expect, it } from "vitest";
import {
  normalizeApiTeamName,
  resolveApiTeamId,
  findMatchingFixture,
  mapFixtureToResult,
} from "@/lib/importResults";
import type { KnockoutMatch } from "@/types";

// ── Fixture builder ───────────────────────────────────────────────────────────

function makeFixture(opts: {
  id?: number;
  statusShort?: string;
  date?: string;
  homeName: string;
  awayName: string;
  homeWinner?: boolean | null;
  awayWinner?: boolean | null;
  ftHome?: number | null;
  ftAway?: number | null;
  etHome?: number | null;
  etAway?: number | null;
  penHome?: number | null;
  penAway?: number | null;
}) {
  return {
    fixture: {
      id: opts.id ?? 999,
      status: {
        short: opts.statusShort ?? "FT",
        long: "Match Finished",
        elapsed: 90,
      },
      date: opts.date ?? "2026-07-01T19:00:00Z",
    },
    teams: {
      home: { id: 1, name: opts.homeName, winner: opts.homeWinner ?? null },
      away: { id: 2, name: opts.awayName, winner: opts.awayWinner ?? null },
    },
    goals: { home: opts.ftHome === undefined ? 0 : opts.ftHome, away: opts.ftAway === undefined ? 0 : opts.ftAway },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: opts.ftHome === undefined ? 0 : opts.ftHome, away: opts.ftAway === undefined ? 0 : opts.ftAway },
      extratime: { home: opts.etHome ?? null, away: opts.etAway ?? null },
      penalty: { home: opts.penHome ?? null, away: opts.penAway ?? null },
    },
  };
}

function makeMatch(
  partial: Partial<KnockoutMatch> & { teamA: string | null; teamB: string | null }
): KnockoutMatch {
  return {
    id: "M73",
    matchNumber: 73,
    round: "round_of_32",
    slotA: "1A",
    slotB: "2B",
    startsAt: "2026-07-01T19:00:00Z",
    displayTimePortugal: "01/07/2026 20:00",
    timezoneNote: "",
    sourceNote: "",
    venue: "Stadium",
    city: "City",
    country: "Country",
    bettingOpen: false,
    status: "scheduled",
    timeTBD: false,
    ...partial,
  };
}

// ── normalizeApiTeamName ──────────────────────────────────────────────────────

describe("normalizeApiTeamName", () => {
  it("lowercases plain names", () => {
    expect(normalizeApiTeamName("Brazil")).toBe("brazil");
  });

  it("strips accents", () => {
    expect(normalizeApiTeamName("Türkiye")).toBe("turkiye");
  });

  it("strips apostrophes", () => {
    expect(normalizeApiTeamName("Côte d'Ivoire")).toBe("cote divoire");
  });

  it("converts hyphens to spaces", () => {
    expect(normalizeApiTeamName("Bosnia-Herzegovina")).toBe("bosnia herzegovina");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeApiTeamName("South   Korea")).toBe("south korea");
  });
});

// ── resolveApiTeamId ──────────────────────────────────────────────────────────

describe("resolveApiTeamId", () => {
  it("resolves Brazil", () => expect(resolveApiTeamId("Brazil")).toBe("brazil"));
  it("resolves Korea Republic", () => expect(resolveApiTeamId("Korea Republic")).toBe("south_korea"));
  it("resolves South Korea", () => expect(resolveApiTeamId("South Korea")).toBe("south_korea"));
  it("resolves IR Iran", () => expect(resolveApiTeamId("IR Iran")).toBe("iran"));
  it("resolves USA", () => expect(resolveApiTeamId("USA")).toBe("usa"));
  it("resolves United States", () => expect(resolveApiTeamId("United States")).toBe("usa"));
  it("resolves DR Congo", () => expect(resolveApiTeamId("DR Congo")).toBe("dr_congo"));
  it("resolves Portugal", () => expect(resolveApiTeamId("Portugal")).toBe("portugal"));
  it("returns null for unknown team", () => expect(resolveApiTeamId("Atlantis FC")).toBeNull());
});

// ── findMatchingFixture — by externalFixtureId ────────────────────────────────

describe("findMatchingFixture (by externalFixtureId)", () => {
  it("finds fixture when ID matches", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", externalFixtureId: "42" });
    const fixtures = [makeFixture({ id: 42, homeName: "Brazil", awayName: "Argentina" })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(true);
    if (r.found) {
      expect(r.fixture.fixture.id).toBe(42);
      expect(r.homeTeamIsTeamA).toBe(true);
    }
  });

  it("sets homeTeamIsTeamA=false when home is teamB", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", externalFixtureId: "42" });
    const fixtures = [makeFixture({ id: 42, homeName: "Argentina", awayName: "Brazil" })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(true);
    if (r.found) expect(r.homeTeamIsTeamA).toBe(false);
  });

  it("returns not_found when fixture ID absent from response", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", externalFixtureId: "99" });
    const fixtures = [makeFixture({ id: 1, homeName: "Brazil", awayName: "Argentina" })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.ambiguous).toBe(false);
  });
});

// ── findMatchingFixture — fuzzy (name + time) ─────────────────────────────────

describe("findMatchingFixture (fuzzy)", () => {
  const STARTS_AT = "2026-07-01T19:00:00Z";

  it("finds when home=teamA, away=teamB, same time", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", startsAt: STARTS_AT });
    const fixtures = [makeFixture({ homeName: "Brazil", awayName: "Argentina", date: STARTS_AT })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(true);
    if (r.found) expect(r.homeTeamIsTeamA).toBe(true);
  });

  it("finds reversed fixture (home=teamB)", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", startsAt: STARTS_AT });
    const fixtures = [makeFixture({ homeName: "Argentina", awayName: "Brazil", date: STARTS_AT })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(true);
    if (r.found) expect(r.homeTeamIsTeamA).toBe(false);
  });

  it("returns not_found when teams don't match", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", startsAt: STARTS_AT });
    const fixtures = [makeFixture({ homeName: "Spain", awayName: "France", date: STARTS_AT })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.ambiguous).toBe(false);
  });

  it("returns not_found when time diff > 3h", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", startsAt: STARTS_AT });
    const fixtures = [
      makeFixture({ homeName: "Brazil", awayName: "Argentina", date: "2026-07-01T00:00:00Z" }),
    ];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(false);
  });

  it("finds when time diff is within ±3h", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", startsAt: STARTS_AT });
    const fixtures = [
      makeFixture({ homeName: "Brazil", awayName: "Argentina", date: "2026-07-01T21:59:00Z" }),
    ];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(true);
  });

  it("returns ambiguous when multiple fixtures match", () => {
    const match = makeMatch({ teamA: "brazil", teamB: "argentina", startsAt: STARTS_AT });
    const fixtures = [
      makeFixture({ id: 1, homeName: "Brazil", awayName: "Argentina", date: STARTS_AT }),
      makeFixture({ id: 2, homeName: "Argentina", awayName: "Brazil", date: STARTS_AT }),
    ];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.ambiguous).toBe(true);
  });

  it("handles FIFA name variants (Korea Republic)", () => {
    const match = makeMatch({ teamA: "south_korea", teamB: "germany", startsAt: STARTS_AT });
    const fixtures = [
      makeFixture({ homeName: "Korea Republic", awayName: "Germany", date: STARTS_AT }),
    ];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(true);
  });

  it("skips fixture when teamA/teamB are null", () => {
    const match = makeMatch({ teamA: null, teamB: null, startsAt: STARTS_AT });
    const fixtures = [makeFixture({ homeName: "Brazil", awayName: "Argentina", date: STARTS_AT })];
    const r = findMatchingFixture(match, fixtures);
    expect(r.found).toBe(false);
  });
});

// ── mapFixtureToResult ────────────────────────────────────────────────────────

describe("mapFixtureToResult (FT)", () => {
  it("home wins → result90=teamA when home is teamA", () => {
    const fx = makeFixture({
      statusShort: "FT", homeName: "Brazil", awayName: "Argentina",
      homeWinner: true, awayWinner: false, ftHome: 2, ftAway: 1,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r?.result90).toBe("teamA");
    expect(r?.resultFinal).toEqual({ scoreTeamA: 2, scoreTeamB: 1 });
    expect(r?.winnerTeamId).toBe("brazil");
    expect(r?.winnerMappingWarning).toBe(false);
  });

  it("home wins → result90=teamB when home is teamB", () => {
    const fx = makeFixture({
      statusShort: "FT", homeName: "Argentina", awayName: "Brazil",
      homeWinner: true, awayWinner: false, ftHome: 2, ftAway: 1,
    });
    const r = mapFixtureToResult(fx, false, "brazil", "argentina");
    expect(r?.result90).toBe("teamB");
    expect(r?.resultFinal).toEqual({ scoreTeamA: 1, scoreTeamB: 2 });
    expect(r?.winnerTeamId).toBe("argentina");
  });

  it("away wins → result90=teamB when away is teamB", () => {
    const fx = makeFixture({
      statusShort: "FT", homeName: "Brazil", awayName: "Argentina",
      homeWinner: false, awayWinner: true, ftHome: 0, ftAway: 2,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r?.result90).toBe("teamB");
    expect(r?.winnerTeamId).toBe("argentina");
  });

  it("draw at 90 min → result90=draw", () => {
    const fx = makeFixture({
      statusShort: "FT", homeName: "Brazil", awayName: "Argentina",
      homeWinner: null, awayWinner: null, ftHome: 1, ftAway: 1,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r?.result90).toBe("draw");
    expect(r?.winnerMappingWarning).toBe(true);
  });

  it("returns null when fulltime scores are null", () => {
    const fx = makeFixture({
      statusShort: "FT", homeName: "Brazil", awayName: "Argentina",
      ftHome: null, ftAway: null,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r).toBeNull();
  });
});

describe("mapFixtureToResult (AET)", () => {
  it("adds extratime goals to resultFinal", () => {
    const fx = makeFixture({
      statusShort: "AET", homeName: "Brazil", awayName: "Argentina",
      homeWinner: true, awayWinner: false,
      ftHome: 1, ftAway: 1,
      etHome: 1, etAway: 0,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r?.result90).toBe("draw");
    expect(r?.resultFinal).toEqual({ scoreTeamA: 2, scoreTeamB: 1 });
    expect(r?.winnerTeamId).toBe("brazil");
  });

  it("handles null extratime as 0", () => {
    const fx = makeFixture({
      statusShort: "AET", homeName: "Brazil", awayName: "Argentina",
      homeWinner: true, awayWinner: false,
      ftHome: 2, ftAway: 1,
      etHome: null, etAway: null,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r?.resultFinal).toEqual({ scoreTeamA: 2, scoreTeamB: 1 });
  });
});

describe("mapFixtureToResult (PEN)", () => {
  it("uses ET score for resultFinal, winner from .winner flag", () => {
    const fx = makeFixture({
      statusShort: "PEN", homeName: "Brazil", awayName: "Argentina",
      homeWinner: true, awayWinner: false,
      ftHome: 1, ftAway: 1,
      etHome: 0, etAway: 0,
      penHome: 5, penAway: 3,
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r?.result90).toBe("draw");
    expect(r?.resultFinal).toEqual({ scoreTeamA: 1, scoreTeamB: 1 });
    expect(r?.winnerTeamId).toBe("brazil");
  });
});

describe("mapFixtureToResult (not terminal)", () => {
  it("returns null for live match (1H)", () => {
    const fx = makeFixture({
      statusShort: "1H", homeName: "Brazil", awayName: "Argentina",
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r).toBeNull();
  });

  it("returns null for scheduled match (NS)", () => {
    const fx = makeFixture({
      statusShort: "NS", homeName: "Brazil", awayName: "Argentina",
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r).toBeNull();
  });

  it("returns null for half time (HT)", () => {
    const fx = makeFixture({
      statusShort: "HT", homeName: "Brazil", awayName: "Argentina",
    });
    const r = mapFixtureToResult(fx, true, "brazil", "argentina");
    expect(r).toBeNull();
  });
});

describe("mapFixtureToResult (winner mapping warning)", () => {
  it("sets warning when winner name not in our teams", () => {
    const fx = makeFixture({
      statusShort: "FT", homeName: "Atlantis FC", awayName: "Brazil",
      homeWinner: true, awayWinner: false, ftHome: 2, ftAway: 0,
    });
    const r = mapFixtureToResult(fx, false, "brazil", "argentina");
    expect(r?.winnerMappingWarning).toBe(true);
    expect(r?.winnerTeamId).toBeNull();
  });
});
