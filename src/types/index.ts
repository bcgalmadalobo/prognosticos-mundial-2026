export type UserRole = "user" | "admin";

export interface AppSettings {
  competitionName?: string;
  initialPredictionDeadline?: string;
  welcomeMessage?: string;
  initialPredictionStatus?: "open" | "closed";
}
export type UserStatus = "pending_access_code" | "approved";
export type MatchRound = "round_of_32" | "round_of_16" | "quarter_final" | "semi_final" | "final";
export type MatchStatus = "draft" | "open" | "locked" | "finished";
export type Outcome90 = "home" | "draw" | "away";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  approved?: boolean;
  status?: UserStatus;
  inviteCode?: string;
  hasSubmittedInitialPrediction?: boolean;
  oneSignalId?: string;
  createdAt?: unknown;
}

export interface Invite {
  id?: string;
  code: string;
  expectedName: string;
  expectedEmail: string;
  uid?: string;
  used: boolean;
  usedByUserId?: string;
  createdAt?: unknown;
  usedAt?: unknown;
  createdBy?: string;
}

export interface Team {
  id: string;
  name: string;
  group?: string;
  flag?: string;
}

export interface WorldCupGroup {
  id: string;
  name: string;
  teamIds: string[];
}

export interface ScoreLine {
  homeGoals: number;
  awayGoals: number;
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
}

export interface Match {
  id: string;
  round: MatchRound;
  homeTeam: string;
  awayTeam: string;
  kickoff?: string;
  status: MatchStatus;
  odds?: MatchOdds;
  result90?: ScoreLine;
  result120?: ScoreLine;
  qualifiedTeam?: string;
}

export interface InitialPrediction {
  id?: string;
  userId: string;
  groupPositions: Record<string, string[]>;
  thirdPlaceRanking?: string[];
  qualifiedThirdPlacedTeams?: string[];
  roundOf32Teams: string[];
  roundOf16Teams: string[];
  quarterFinalTeams: string[];
  semiFinalTeams: string[];
  finalTeams: string[];
  winner: string;
  runnerUp: string;
  thirdPlace?: string;
  fourthPlace?: string;
  topScorer: string;
  bestPlayer: string;
  bestYoungPlayer: string;
  bestGoalkeeper: string;
  bracketChoices?: Record<string, string | null>;
  locked: boolean;
  submittedAt?: unknown;
  updatedAt?: unknown;
}

// ── Bracket types ────────────────────────────────────────────────────────────

export type BracketRound =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type SlotDef =
  | { type: "1st"; group: string }
  | { type: "2nd"; group: string }
  | { type: "3rd"; allowedGroups: string[] }
  | { type: "winner"; matchId: string }
  | { type: "loser"; matchId: string };

export interface BracketMatchTemplate {
  id: string;
  round: BracketRound;
  slotA: SlotDef;
  slotB: SlotDef;
  winnerNextMatchId: string | null;
  winnerNextSlot: "A" | "B";
  loserNextMatchId: string | null;
  loserNextSlot: "A" | "B";
}

export interface BracketMatchState {
  id: string;
  round: BracketRound;
  teamA: string | null;
  teamB: string | null;
  labelA: string;
  labelB: string;
  winnerId: string | null;
}

export interface BracketState {
  matches: Record<string, BracketMatchState>;
  thirdAssignmentError?: boolean;
}

export interface DerivedRoundTeams {
  roundOf32Teams: string[];
  roundOf16Teams: string[];
  quarterFinalTeams: string[];
  semiFinalTeams: string[];
  finalTeams: string[];
  winner: string | null;
  runnerUp: string | null;
  thirdPlace: string | null;
  fourthPlace: string | null;
}

export interface MatchPrediction {
  id?: string;
  userId: string;
  matchId: string;
  prediction90: Outcome90;
  qualifiedTeam: string;
  score120?: ScoreLine;
  locked: boolean;
  submittedAt?: unknown;
}

export interface InitialActuals {
  groupPositions: Record<string, string[]>;
  roundOf32Teams: string[];
  roundOf16Teams: string[];
  quarterFinalTeams: string[];
  semiFinalTeams: string[];
  finalTeams: string[];
  winner: string;
  runnerUp: string;
  thirdPlace?: string;
  fourthPlace?: string;
  topScorer: string;
  bestPlayer: string;
  bestYoungPlayer: string;
  bestGoalkeeper: string;
}

export interface TournamentResults {
  groupPositions?: Record<string, string[]>;
  roundOf32Teams?: string[];
  roundOf16Teams?: string[];
  quarterFinalTeams?: string[];
  semiFinalTeams?: string[];
  finalTeams?: string[];
  winner?: string;
  runnerUp?: string;
  thirdPlace?: string;
  fourthPlace?: string;
  topScorer?: string;
  bestPlayer?: string;
  bestYoungPlayer?: string;
  bestGoalkeeper?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface InitialScoringSettings {
  winner: number;
  runnerUp: number;
  thirdPlace: number;
  fourthPlace: number;
  topScorer: number;
  bestPlayer: number;
  bestYoungPlayer: number;
  bestGoalkeeper: number;
  finalTeam: number;
  semiFinalTeam: number;
  quarterFinalTeam: number;
  roundOf16Team: number;
  roundOf32Team: number;
  groupPosition: number;
}

export interface RoundScoringSettings {
  oddsMultiplier: number;
  qualifiedTeamPoints: number;
  scoreExactPoints: number;
}

export interface ScoringSettings {
  initial: InitialScoringSettings;
  knockout: Record<MatchRound, RoundScoringSettings>;
}

export interface LeaderboardEntry {
  id?: string;
  userId: string;
  name: string;
  initialPoints: number;
  knockoutPoints: number;
  totalPoints: number;
  updatedAt?: unknown;
}

export interface NotificationLog {
  id?: string;
  sentAt?: unknown;
  sentBy: string;
  title: string;
  message: string;
  url?: string;
  recipientCount: number;
  oneSignalResponse: Record<string, unknown>;
  status: "sent" | "failed";
}
