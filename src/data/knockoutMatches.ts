import type { KnockoutMatchSeed } from "@/types";

// Times confirmed UTC. Source: Wikipedia – 2026 FIFA World Cup knockout stage
// https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
// displayTimePortugal = startsAt UTC + 1h (Portugal WEST = UTC+1, jun–jul 2026)

const SOURCE = "Wikipedia – 2026 FIFA World Cup knockout stage";
const TZ_NOTE = "UTC (Portugal WEST = UTC+1 shown in displayTimePortugal)";

export const knockoutMatchesData: KnockoutMatchSeed[] = [
  // ── Round of 32 ────────────────────────────────────────────────────────────
  {
    id: "M73", matchNumber: 73, round: "round_of_32",
    slotA: "2A", slotB: "2B",
    startsAt: "2026-06-28T19:00:00Z", displayTimePortugal: "28/06/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "SoFi Stadium", city: "Inglewood", country: "USA",
  },
  {
    id: "M74", matchNumber: 74, round: "round_of_32",
    slotA: "1E", slotB: "3ABCDF",
    startsAt: "2026-06-29T20:30:00Z", displayTimePortugal: "29/06/2026 21:30",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Gillette Stadium", city: "Foxborough", country: "USA",
  },
  {
    id: "M75", matchNumber: 75, round: "round_of_32",
    slotA: "1F", slotB: "2C",
    startsAt: "2026-06-30T01:00:00Z", displayTimePortugal: "30/06/2026 02:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Estadio BBVA", city: "Guadalupe", country: "Mexico",
  },
  {
    id: "M76", matchNumber: 76, round: "round_of_32",
    slotA: "1C", slotB: "2F",
    startsAt: "2026-06-29T17:00:00Z", displayTimePortugal: "29/06/2026 18:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "NRG Stadium", city: "Houston", country: "USA",
  },
  {
    id: "M77", matchNumber: 77, round: "round_of_32",
    slotA: "1I", slotB: "3CDFGH",
    startsAt: "2026-06-30T21:00:00Z", displayTimePortugal: "30/06/2026 22:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "MetLife Stadium", city: "East Rutherford", country: "USA",
  },
  {
    id: "M78", matchNumber: 78, round: "round_of_32",
    slotA: "2E", slotB: "2I",
    startsAt: "2026-06-30T17:00:00Z", displayTimePortugal: "30/06/2026 18:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "AT&T Stadium", city: "Arlington", country: "USA",
  },
  {
    id: "M79", matchNumber: 79, round: "round_of_32",
    slotA: "1A", slotB: "3CEFHI",
    startsAt: "2026-07-01T01:00:00Z", displayTimePortugal: "01/07/2026 02:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Estadio Azteca", city: "Mexico City", country: "Mexico",
  },
  {
    id: "M80", matchNumber: 80, round: "round_of_32",
    slotA: "1L", slotB: "3EHIJK",
    startsAt: "2026-07-01T16:00:00Z", displayTimePortugal: "01/07/2026 17:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA",
  },
  {
    id: "M81", matchNumber: 81, round: "round_of_32",
    slotA: "1D", slotB: "3BEFIJ",
    startsAt: "2026-07-02T00:00:00Z", displayTimePortugal: "02/07/2026 01:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Levi's Stadium", city: "Santa Clara", country: "USA",
  },
  {
    id: "M82", matchNumber: 82, round: "round_of_32",
    slotA: "1G", slotB: "3AEHIJ",
    startsAt: "2026-07-01T20:00:00Z", displayTimePortugal: "01/07/2026 21:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Lumen Field", city: "Seattle", country: "USA",
  },
  {
    id: "M83", matchNumber: 83, round: "round_of_32",
    slotA: "2K", slotB: "2L",
    startsAt: "2026-07-02T23:00:00Z", displayTimePortugal: "03/07/2026 00:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "BMO Field", city: "Toronto", country: "Canada",
  },
  {
    id: "M84", matchNumber: 84, round: "round_of_32",
    slotA: "1H", slotB: "2J",
    startsAt: "2026-07-02T19:00:00Z", displayTimePortugal: "02/07/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "SoFi Stadium", city: "Inglewood", country: "USA",
  },
  {
    id: "M85", matchNumber: 85, round: "round_of_32",
    slotA: "1B", slotB: "3EFGIJ",
    startsAt: "2026-07-03T03:00:00Z", displayTimePortugal: "03/07/2026 04:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "BC Place", city: "Vancouver", country: "Canada",
  },
  {
    id: "M86", matchNumber: 86, round: "round_of_32",
    slotA: "1J", slotB: "2H",
    startsAt: "2026-07-03T22:00:00Z", displayTimePortugal: "03/07/2026 23:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Hard Rock Stadium", city: "Miami Gardens", country: "USA",
  },
  {
    id: "M87", matchNumber: 87, round: "round_of_32",
    slotA: "1K", slotB: "3DEIJL",
    startsAt: "2026-07-04T01:30:00Z", displayTimePortugal: "04/07/2026 02:30",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Arrowhead Stadium", city: "Kansas City", country: "USA",
  },
  {
    id: "M88", matchNumber: 88, round: "round_of_32",
    slotA: "2D", slotB: "2G",
    startsAt: "2026-07-03T18:00:00Z", displayTimePortugal: "03/07/2026 19:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "AT&T Stadium", city: "Arlington", country: "USA",
  },

  // ── Round of 16 ────────────────────────────────────────────────────────────
  {
    id: "M89", matchNumber: 89, round: "round_of_16",
    slotA: "W M74", slotB: "W M77",
    startsAt: "2026-07-04T21:00:00Z", displayTimePortugal: "04/07/2026 22:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Lincoln Financial Field", city: "Philadelphia", country: "USA",
  },
  {
    id: "M90", matchNumber: 90, round: "round_of_16",
    slotA: "W M73", slotB: "W M75",
    startsAt: "2026-07-04T17:00:00Z", displayTimePortugal: "04/07/2026 18:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "NRG Stadium", city: "Houston", country: "USA",
  },
  {
    id: "M91", matchNumber: 91, round: "round_of_16",
    slotA: "W M76", slotB: "W M78",
    startsAt: "2026-07-05T20:00:00Z", displayTimePortugal: "05/07/2026 21:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "MetLife Stadium", city: "East Rutherford", country: "USA",
  },
  {
    id: "M92", matchNumber: 92, round: "round_of_16",
    slotA: "W M79", slotB: "W M80",
    startsAt: "2026-07-06T00:00:00Z", displayTimePortugal: "06/07/2026 01:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Estadio Azteca", city: "Mexico City", country: "Mexico",
  },
  {
    id: "M93", matchNumber: 93, round: "round_of_16",
    slotA: "W M83", slotB: "W M84",
    startsAt: "2026-07-06T19:00:00Z", displayTimePortugal: "06/07/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "AT&T Stadium", city: "Arlington", country: "USA",
  },
  {
    id: "M94", matchNumber: 94, round: "round_of_16",
    slotA: "W M81", slotB: "W M82",
    startsAt: "2026-07-07T00:00:00Z", displayTimePortugal: "07/07/2026 01:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Lumen Field", city: "Seattle", country: "USA",
  },
  {
    id: "M95", matchNumber: 95, round: "round_of_16",
    slotA: "W M86", slotB: "W M88",
    startsAt: "2026-07-07T16:00:00Z", displayTimePortugal: "07/07/2026 17:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA",
  },
  {
    id: "M96", matchNumber: 96, round: "round_of_16",
    slotA: "W M85", slotB: "W M87",
    startsAt: "2026-07-07T20:00:00Z", displayTimePortugal: "07/07/2026 21:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "BC Place", city: "Vancouver", country: "Canada",
  },

  // ── Quarter-finals ─────────────────────────────────────────────────────────
  {
    id: "M97", matchNumber: 97, round: "quarter_final",
    slotA: "W M89", slotB: "W M90",
    startsAt: "2026-07-09T20:00:00Z", displayTimePortugal: "09/07/2026 21:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Gillette Stadium", city: "Foxborough", country: "USA",
  },
  {
    id: "M98", matchNumber: 98, round: "quarter_final",
    slotA: "W M93", slotB: "W M94",
    startsAt: "2026-07-10T19:00:00Z", displayTimePortugal: "10/07/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "SoFi Stadium", city: "Inglewood", country: "USA",
  },
  {
    id: "M99", matchNumber: 99, round: "quarter_final",
    slotA: "W M91", slotB: "W M92",
    startsAt: "2026-07-11T21:00:00Z", displayTimePortugal: "11/07/2026 22:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Hard Rock Stadium", city: "Miami Gardens", country: "USA",
  },
  {
    id: "M100", matchNumber: 100, round: "quarter_final",
    slotA: "W M95", slotB: "W M96",
    startsAt: "2026-07-12T01:00:00Z", displayTimePortugal: "12/07/2026 02:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Arrowhead Stadium", city: "Kansas City", country: "USA",
  },

  // ── Semi-finals ────────────────────────────────────────────────────────────
  {
    id: "M101", matchNumber: 101, round: "semi_final",
    slotA: "W M97", slotB: "W M98",
    startsAt: "2026-07-14T19:00:00Z", displayTimePortugal: "14/07/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "AT&T Stadium", city: "Arlington", country: "USA",
  },
  {
    id: "M102", matchNumber: 102, round: "semi_final",
    slotA: "W M99", slotB: "W M100",
    startsAt: "2026-07-15T19:00:00Z", displayTimePortugal: "15/07/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA",
  },

  // ── Third place ────────────────────────────────────────────────────────────
  {
    id: "M103", matchNumber: 103, round: "third_place",
    slotA: "L M101", slotB: "L M102",
    startsAt: "2026-07-18T21:00:00Z", displayTimePortugal: "18/07/2026 22:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "Hard Rock Stadium", city: "Miami Gardens", country: "USA",
  },

  // ── Final ──────────────────────────────────────────────────────────────────
  {
    id: "M104", matchNumber: 104, round: "final",
    slotA: "W M101", slotB: "W M102",
    startsAt: "2026-07-19T19:00:00Z", displayTimePortugal: "19/07/2026 20:00",
    timezoneNote: TZ_NOTE, sourceNote: SOURCE,
    venue: "MetLife Stadium", city: "East Rutherford", country: "USA",
  },
];
