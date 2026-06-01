export interface TeamData {
  name: string;
  flag: string;
  shortName?: string;
  group?: string;
  fifaName?: string;
}

// Official FIFA World Cup 2026 draw — 48 teams, 12 groups of 4.
// TODO: England (england) and Scotland (scotland) use Unicode subdivision flag tags
// (🏴󠁧󠁢󠁥󠁮󠁧󠁿 / 🏴󠁧󠁢󠁳󠁣󠁴󠁿). If rendering breaks, replace with SVG flag assets.
export const TEAMS: Record<string, TeamData> = {
  // Group A
  mexico:            { name: "México",              flag: "🇲🇽", group: "A" },
  south_africa:      { name: "África do Sul",       flag: "🇿🇦", group: "A" },
  south_korea:       { name: "Coreia do Sul",       flag: "🇰🇷", group: "A", fifaName: "Korea Republic" },
  czechia:           { name: "Chéquia",             flag: "🇨🇿", group: "A", fifaName: "Czechia" },

  // Group B
  canada:            { name: "Canadá",              flag: "🇨🇦", group: "B" },
  bosnia_herzegovina:{ name: "Bósnia e Herzegovina",flag: "🇧🇦", group: "B", shortName: "Bósnia", fifaName: "Bosnia and Herzegovina" },
  qatar:             { name: "Qatar",               flag: "🇶🇦", group: "B" },
  switzerland:       { name: "Suíça",               flag: "🇨🇭", group: "B" },

  // Group C
  brazil:            { name: "Brasil",              flag: "🇧🇷", group: "C" },
  morocco:           { name: "Marrocos",            flag: "🇲🇦", group: "C" },
  haiti:             { name: "Haiti",               flag: "🇭🇹", group: "C" },
  scotland:          { name: "Escócia",             flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C" },

  // Group D
  usa:               { name: "Estados Unidos",      flag: "🇺🇸", group: "D", fifaName: "USA" },
  paraguay:          { name: "Paraguai",            flag: "🇵🇾", group: "D" },
  australia:         { name: "Austrália",           flag: "🇦🇺", group: "D" },
  turkey:            { name: "Turquia",             flag: "🇹🇷", group: "D", fifaName: "Türkiye" },

  // Group E
  germany:           { name: "Alemanha",            flag: "🇩🇪", group: "E" },
  curacao:           { name: "Curaçau",             flag: "🇨🇼", group: "E", fifaName: "Curaçao" },
  ivory_coast:       { name: "Costa do Marfim",     flag: "🇨🇮", group: "E", shortName: "Costa Marfim", fifaName: "Côte d'Ivoire" },
  ecuador:           { name: "Equador",             flag: "🇪🇨", group: "E" },

  // Group F
  netherlands:       { name: "Países Baixos",       flag: "🇳🇱", group: "F", shortName: "P. Baixos" },
  japan:             { name: "Japão",               flag: "🇯🇵", group: "F" },
  sweden:            { name: "Suécia",              flag: "🇸🇪", group: "F" },
  tunisia:           { name: "Tunísia",             flag: "🇹🇳", group: "F" },

  // Group G
  belgium:           { name: "Bélgica",             flag: "🇧🇪", group: "G" },
  egypt:             { name: "Egito",               flag: "🇪🇬", group: "G" },
  iran:              { name: "Irão",                flag: "🇮🇷", group: "G", fifaName: "IR Iran" },
  new_zealand:       { name: "Nova Zelândia",       flag: "🇳🇿", group: "G" },

  // Group H
  spain:             { name: "Espanha",             flag: "🇪🇸", group: "H" },
  cape_verde:        { name: "Cabo Verde",          flag: "🇨🇻", group: "H", fifaName: "Cabo Verde" },
  saudi_arabia:      { name: "Arábia Saudita",      flag: "🇸🇦", group: "H", shortName: "Ar. Saudita" },
  uruguay:           { name: "Uruguai",             flag: "🇺🇾", group: "H" },

  // Group I
  france:            { name: "França",              flag: "🇫🇷", group: "I" },
  senegal:           { name: "Senegal",             flag: "🇸🇳", group: "I" },
  iraq:              { name: "Iraque",              flag: "🇮🇶", group: "I" },
  norway:            { name: "Noruega",             flag: "🇳🇴", group: "I" },

  // Group J
  argentina:         { name: "Argentina",           flag: "🇦🇷", group: "J" },
  algeria:           { name: "Argélia",             flag: "🇩🇿", group: "J" },
  austria:           { name: "Áustria",             flag: "🇦🇹", group: "J" },
  jordan:            { name: "Jordânia",            flag: "🇯🇴", group: "J" },

  // Group K
  portugal:          { name: "Portugal",            flag: "🇵🇹", group: "K" },
  dr_congo:          { name: "RD Congo",            flag: "🇨🇩", group: "K", fifaName: "DR Congo" },
  uzbekistan:        { name: "Uzbequistão",         flag: "🇺🇿", group: "K" },
  colombia:          { name: "Colômbia",            flag: "🇨🇴", group: "K" },

  // Group L
  england:           { name: "Inglaterra",          flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L" },
  croatia:           { name: "Croácia",             flag: "🇭🇷", group: "L" },
  ghana:             { name: "Gana",                flag: "🇬🇭", group: "L" },
  panama:            { name: "Panamá",              flag: "🇵🇦", group: "L" },
};

export const GROUPS: Record<string, string[]> = {
  A: ["mexico",       "south_africa", "south_korea",        "czechia"],
  B: ["canada",       "bosnia_herzegovina", "qatar",         "switzerland"],
  C: ["brazil",       "morocco",      "haiti",              "scotland"],
  D: ["usa",          "paraguay",     "australia",          "turkey"],
  E: ["germany",      "curacao",      "ivory_coast",        "ecuador"],
  F: ["netherlands",  "japan",        "sweden",             "tunisia"],
  G: ["belgium",      "egypt",        "iran",               "new_zealand"],
  H: ["spain",        "cape_verde",   "saudi_arabia",       "uruguay"],
  I: ["france",       "senegal",      "iraq",               "norway"],
  J: ["argentina",    "algeria",      "austria",            "jordan"],
  K: ["portugal",     "dr_congo",     "uzbekistan",         "colombia"],
  L: ["england",      "croatia",      "ghana",              "panama"],
};

export const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;
export type GroupLetter = typeof GROUP_LETTERS[number];
