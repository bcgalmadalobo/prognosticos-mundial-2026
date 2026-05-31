// TODO: ALL group assignments are PLACEHOLDER data.
// Verify every team and group against the official FIFA World Cup 2026 draw.
// Official draw: December 5, 2024 — check https://www.fifa.com/worldcup/2026

export interface TeamData {
  name: string;
  flag: string;
}

// TODO: Verify all entries against official FIFA 2026 qualification results.
export const TEAMS: Record<string, TeamData> = {
  // UEFA
  germany:      { name: "Alemanha",       flag: "🇩🇪" },
  france:       { name: "França",          flag: "🇫🇷" },
  spain:        { name: "Espanha",         flag: "🇪🇸" },
  portugal:     { name: "Portugal",        flag: "🇵🇹" },
  england:      { name: "Inglaterra",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  netherlands:  { name: "Países Baixos",   flag: "🇳🇱" },
  belgium:      { name: "Bélgica",         flag: "🇧🇪" },
  italy:        { name: "Itália",          flag: "🇮🇹" },
  switzerland:  { name: "Suíça",           flag: "🇨🇭" },
  croatia:      { name: "Croácia",         flag: "🇭🇷" },
  austria:      { name: "Áustria",         flag: "🇦🇹" },
  serbia:       { name: "Sérvia",          flag: "🇷🇸" },
  poland:       { name: "Polónia",         flag: "🇵🇱" },
  denmark:      { name: "Dinamarca",       flag: "🇩🇰" },
  turkey:       { name: "Turquia",         flag: "🇹🇷" },
  scotland:     { name: "Escócia",         flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // CONMEBOL
  argentina:    { name: "Argentina",       flag: "🇦🇷" },
  brazil:       { name: "Brasil",          flag: "🇧🇷" },
  uruguay:      { name: "Uruguai",         flag: "🇺🇾" },
  colombia:     { name: "Colômbia",        flag: "🇨🇴" },
  ecuador:      { name: "Equador",         flag: "🇪🇨" },
  venezuela:    { name: "Venezuela",       flag: "🇻🇪" },
  chile:        { name: "Chile",           flag: "🇨🇱" },
  // CONCACAF
  usa:          { name: "EUA",             flag: "🇺🇸" },
  mexico:       { name: "México",          flag: "🇲🇽" },
  canada:       { name: "Canadá",          flag: "🇨🇦" },
  panama:       { name: "Panamá",          flag: "🇵🇦" },
  honduras:     { name: "Honduras",        flag: "🇭🇳" },
  costa_rica:   { name: "Costa Rica",      flag: "🇨🇷" },
  // AFC
  japan:        { name: "Japão",           flag: "🇯🇵" },
  south_korea:  { name: "Coreia do Sul",   flag: "🇰🇷" },
  iran:         { name: "Irão",            flag: "🇮🇷" },
  australia:    { name: "Austrália",       flag: "🇦🇺" },
  saudi_arabia: { name: "Arábia Saudita",  flag: "🇸🇦" },
  qatar:        { name: "Catar",           flag: "🇶🇦" },
  uzbekistan:   { name: "Usbequistão",     flag: "🇺🇿" },
  iraq:         { name: "Iraque",          flag: "🇮🇶" },
  indonesia:    { name: "Indonésia",       flag: "🇮🇩" },
  // CAF
  morocco:      { name: "Marrocos",        flag: "🇲🇦" },
  senegal:      { name: "Senegal",         flag: "🇸🇳" },
  nigeria:      { name: "Nigéria",         flag: "🇳🇬" },
  cameroon:     { name: "Camarões",        flag: "🇨🇲" },
  egypt:        { name: "Egito",           flag: "🇪🇬" },
  ivory_coast:  { name: "Costa do Marfim", flag: "🇨🇮" },
  south_africa: { name: "África do Sul",   flag: "🇿🇦" },
  dr_congo:     { name: "RD Congo",        flag: "🇨🇩" },
  mali:         { name: "Mali",            flag: "🇲🇱" },
  // OFC
  new_zealand:  { name: "Nova Zelândia",   flag: "🇳🇿" },
};

// TODO: Replace every group below with the official FIFA 2026 draw result.
// Each group must have exactly 4 team IDs matching keys in TEAMS above.
export const GROUPS: Record<string, string[]> = {
  A: ["usa",         "ecuador",     "ivory_coast", "japan"],
  B: ["mexico",      "colombia",    "south_africa","australia"],
  C: ["canada",      "venezuela",   "mali",        "south_korea"],
  D: ["germany",     "brazil",      "morocco",     "indonesia"],
  E: ["france",      "argentina",   "senegal",     "iran"],
  F: ["spain",       "chile",       "nigeria",     "uzbekistan"],
  G: ["england",     "uruguay",     "cameroon",    "saudi_arabia"],
  H: ["portugal",    "panama",      "dr_congo",    "qatar"],
  I: ["netherlands", "honduras",    "egypt",       "iraq"],
  J: ["belgium",     "italy",       "switzerland", "costa_rica"],
  K: ["croatia",     "austria",     "serbia",      "new_zealand"],
  L: ["poland",      "denmark",     "turkey",      "scotland"],
};

export const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;
export type GroupLetter = typeof GROUP_LETTERS[number];
