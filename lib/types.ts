// ── IFPA Types (API v2.1 at https://api.ifpapinball.com) ─────────────

export interface IFPAPlayerStats {
  current_rank?: number;
  last_month_rank?: number;
  last_year_rank?: number;
  highest_rank?: number;
  current_points?: number;
  all_time_points?: number;
  active_points?: number;
  inactive_points?: number;
  best_finish?: number;
  best_finish_count?: number;
  average_finish?: number;
  average_finish_last_year?: number;
  total_events_all_time?: number;
  total_active_events?: number;
  total_events_away?: number;
  total_wins_last_3_years?: number;
  top_3_last_3_years?: number;
  top_10_last_3_years?: number;
  ratings_rank?: number;
  ratings_value?: number;
  efficiency_rank?: number;
  efficiency_value?: number;
}

export interface IFPASeriesEntry {
  series_code?: string;
  region_code?: string;
  region_name?: string;
  year?: string;
  total_points?: string;
  series_rank?: string;
  system?: string;
}

export interface IFPAPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  city?: string;
  stateprov?: string;
  country_code?: string;
  country_name?: string;
  initials?: string;
  age?: number;
  ifpa_registered?: boolean;
  profile_photo?: string;
  /** Cross-linked Match Play data — IFPA API returns these as strings */
  matchplay_events?: {
    id?: string | number;
    rating?: string | number;
    rank?: string | number | null;
  };
  player_stats?: {
    system?: Record<string, IFPAPlayerStats>;
  };
  series?: IFPASeriesEntry[];
}

/** Shape returned by GET /player/{id} */
export interface IFPAPlayerResponse {
  player: IFPAPlayer;
}

// IFPA PVP (from /player/{id}/pvp)
export interface IFPAPvpOpponent {
  player_id: number | string;
  first_name: string;
  last_name: string;
  win_count: number | string;
  loss_count: number | string;
  tie_count?: number | string;
  current_rank?: number | string;
}

export interface IFPAPvpResponse {
  player_id: number;
  total_competitors?: number;
  system?: string;
  type?: string;
  pvp: IFPAPvpOpponent[] | IFPAPvpOpponent;
}

// ── Match Play Types (API at https://app.matchplay.events/api) ───────

export interface MatchPlayUser {
  userId: number;
  name: string;
  firstName?: string;
  lastName?: string;
  ifpaId?: number;
  role?: string;
  flag?: string;
  location?: string;
  initials?: string;
  avatar?: string;
  createdAt?: string;
}

export interface MatchPlayRating {
  ratingId?: number;
  userId?: number;
  rating?: number;
  ratingClass?: number;
  rd?: number;
  gameCount?: number;
  winCount?: number;
  lossCount?: number;
  resultCount?: number;
  efficiencyPercent?: number;
  lowerBound?: number;
}

export interface MatchPlayUserCounts {
  tournamentOrganizedCount?: number;
  seriesOrganizedCount?: number;
  tournamentPlayCount?: number;
  ratingPeriodCount?: number;
}

/** Shape returned by GET /api/users/{id} */
export interface MatchPlayProfileResponse {
  user: MatchPlayUser;
  rating: MatchPlayRating | null;
  userCounts: MatchPlayUserCounts | null;
}

// IFPA Result (from /player/{id}/results endpoint)
export interface IFPAResult {
  tournament_name: string;
  tournament_id: string;
  event_name: string;
  event_date: string;
  country_name?: string;
  country_code?: string;
  position: string;
  original_points: string;
  current_points: string;
}

// Events grouped by year
export interface EventsByYear {
  year: string;
  eventCount: number;
  totalPoints: number;
}

export interface PvpOpponentSummary {
  playerId: number;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  totalGames: number;
  winRate: number | null;
}

// Match Play Recent Opponent (from tournament game history)
export interface RecentOpponent {
  name: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number | null;
  lastPlayed: string; // ISO date string
}

// Combined Dashboard Data
export interface PlayerIdentity {
  name: string;
  location?: string;
  ifpa_id?: number;
  matchplay_id?: number;
}

export interface DashboardData {
  identity: PlayerIdentity;
  ifpa: {
    rank?: number;
    wppr?: number;
    lastMonthRank?: number;
    lastYearRank?: number;
    highestRank?: number;
    ratingsValue?: number;
    efficiencyValue?: number;
    totalEvents?: number;
    stateRanking?: {
      state: string;
      rank: number;
      points: number;
      year: string;
    } | null;
    eventsByYear?: EventsByYear[];
    pvpOpponents?: PvpOpponentSummary[];
  } | null;
  matchplay: {
    rating?: number;
    ratingClass?: number;
    grade?: string;
    gameCount?: number;
    winCount?: number;
    lossCount?: number;
    efficiencyPercent?: number;
    tournamentPlayCount?: number;
  } | null;
  recentOpponents?: RecentOpponent[];
  recentOpponentsError?: string;
  idMismatchWarning?: string;
  lastUpdated: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp?: string;
}
