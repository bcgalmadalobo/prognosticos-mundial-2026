// Maps normalized The Odds API English team names → internal team IDs.
// Keys are pre-normalized: lowercase, no accents, no apostrophes, hyphens→spaces, collapsed spaces.
// Add variants whenever the API uses unexpected spellings.
export const ODDS_API_TEAM_NAMES: Record<string, string> = {
  // Group A
  mexico:                          "mexico",
  "south africa":                  "south_africa",
  "south korea":                   "south_korea",
  "korea republic":                "south_korea",
  "republic of korea":             "south_korea",
  czechia:                         "czechia",
  "czech republic":                "czechia",

  // Group B
  canada:                          "canada",
  "bosnia and herzegovina":        "bosnia_herzegovina",
  "bosnia & herzegovina":          "bosnia_herzegovina",
  "bosnia-herzegovina":            "bosnia_herzegovina",
  qatar:                           "qatar",
  switzerland:                     "switzerland",

  // Group C
  brazil:                          "brazil",
  morocco:                         "morocco",
  haiti:                           "haiti",
  scotland:                        "scotland",

  // Group D
  usa:                             "usa",
  "united states":                 "usa",
  "united states of america":      "usa",
  paraguay:                        "paraguay",
  australia:                       "australia",
  turkey:                          "turkey",
  turkiye:                         "turkey",

  // Group E
  germany:                         "germany",
  curacao:                         "curacao",
  "cote divoire":                  "ivory_coast",
  "ivory coast":                   "ivory_coast",
  "cote d ivoire":                 "ivory_coast",
  ecuador:                         "ecuador",

  // Group F
  netherlands:                     "netherlands",
  holland:                         "netherlands",
  japan:                           "japan",
  sweden:                          "sweden",
  tunisia:                         "tunisia",

  // Group G
  belgium:                         "belgium",
  egypt:                           "egypt",
  iran:                            "iran",
  "ir iran":                       "iran",
  "islamic republic of iran":      "iran",
  "new zealand":                   "new_zealand",

  // Group H
  spain:                           "spain",
  "cape verde":                    "cape_verde",
  "saudi arabia":                  "saudi_arabia",
  uruguay:                         "uruguay",

  // Group I
  france:                          "france",
  senegal:                         "senegal",
  iraq:                            "iraq",
  norway:                          "norway",

  // Group J
  argentina:                       "argentina",
  algeria:                         "algeria",
  austria:                         "austria",
  jordan:                          "jordan",

  // Group K
  portugal:                        "portugal",
  "dr congo":                      "dr_congo",
  "democratic republic of congo":  "dr_congo",
  "democratic republic of the congo": "dr_congo",
  "congo dr":                      "dr_congo",
  uzbekistan:                      "uzbekistan",
  colombia:                        "colombia",

  // Group L
  england:                         "england",
  croatia:                         "croatia",
  ghana:                           "ghana",
  panama:                          "panama",
};
