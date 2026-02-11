import { fetchJson } from '../http';
import {
  MatchPlayProfileResponse,
  MatchPlayUser,
  MatchPlayRating,
  MatchPlayUserCounts,
  RecentOpponent,
} from '../types';

/**
 * Match Play Events API — https://app.matchplay.events/api
 *
 * The user profile endpoint is **public** (no auth needed).
 * It returns {user, rating, userCounts} in a single call,
 * so there is no need for separate stats or tournament list endpoints.
 *
 * The tournament & games endpoints **require** a Bearer token.
 *
 * Note: camelCase field names throughout.
 */
const MATCHPLAY_API_BASE = 'https://app.matchplay.events/api';

function getApiToken(): string {
  const token = process.env.MATCHPLAY_API_TOKEN;
  if (!token) throw new Error('Missing MATCHPLAY_API_TOKEN environment variable');
  return token;
}

/** Helper to make authenticated Match Play API calls */
async function fetchMatchPlayAuth<T>(path: string): Promise<T> {
  const url = `${MATCHPLAY_API_BASE}${path}`;
  return fetchJson<T>(url, {
    headers: {
      Authorization: `Bearer ${getApiToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Fetch the full user profile (includes rating + aggregate counts).
 */
export async function getUserProfile(
  userId: number
): Promise<MatchPlayProfileResponse> {
  const url = `${MATCHPLAY_API_BASE}/users/${userId}`;

  const response = await fetchJson<MatchPlayProfileResponse>(url);

  if (!response.user) {
    throw new Error('User data not found in Match Play response');
  }

  return response;
}

/**
 * Primary entry-point used by the dashboard route.
 * Returns the user, rating, and userCounts in one object.
 */
export async function getUserSummary(userId: number): Promise<{
  user: MatchPlayUser;
  rating: MatchPlayRating | null;
  userCounts: MatchPlayUserCounts | null;
}> {
  const profile = await getUserProfile(userId);
  return {
    user: profile.user,
    rating: profile.rating ?? null,
    userCounts: profile.userCounts ?? null,
  };
}

// ── Types for internal Match Play API responses ──────────────────────

interface MPTournamentListResponse {
  data: MPTournament[];
}

interface MPTournament {
  tournamentId: number;
  name: string;
  status: string;
  type: string;
  startUtc: string;
  completedAt: string | null;
}

interface MPTournamentDetailResponse {
  data: {
    tournamentId: number;
    players?: MPTournamentPlayer[];
    [key: string]: unknown;
  };
}

interface MPTournamentPlayer {
  playerId: number;
  name: string;
  claimedBy: number | null;
  ifpaId?: number | null;
  status: string;
}

interface MPGamesResponse {
  data: MPGame[];
}

interface MPGame {
  gameId: number;
  tournamentId: number;
  status: string;
  bye: boolean;
  startedAt: string | null;
  playerIds: number[];
  userIds: (number | null)[];
  resultPositions: number[];
  resultPoints: (string | null)[];
}

/**
 * Fetch the most recent opponents for a Match Play user by scanning
 * their completed tournament game history.
 *
 * Strategy:
 *  1. GET /tournaments?played={userId}&status=completed  (most recent first)
 *  2. For the first N tournaments, fetch player rosters + games
 *  3. For each completed game involving our user, record W/L per opponent
 *  4. Return the 10 most-recently-encountered unique opponents with W/L stats
 */
export async function getRecentOpponents(
  userId: number,
  maxTournaments = 5
): Promise<RecentOpponent[]> {
  // 1  Recent completed tournaments (page 1 is newest-first)
  const tourneyList = await fetchMatchPlayAuth<MPTournamentListResponse>(
    `/tournaments?played=${userId}&status=completed&page=1`
  );

  const recentTourneys = (tourneyList.data ?? []).slice(0, maxTournaments);
  if (recentTourneys.length === 0) return [];

  // 2  For each tournament, fetch roster + games in parallel
  const tourneyData = await Promise.allSettled(
    recentTourneys.map(async (t) => {
      const [detail, games] = await Promise.all([
        fetchMatchPlayAuth<MPTournamentDetailResponse>(
          `/tournaments/${t.tournamentId}?includePlayers=1`
        ),
        fetchMatchPlayAuth<MPGamesResponse>(
          `/tournaments/${t.tournamentId}/games`
        ),
      ]);
      return {
        tournamentId: t.tournamentId,
        startUtc: t.startUtc,
        players: detail.data.players ?? [],
        games: games.data ?? [],
      };
    })
  );

  // 3  Walk through games and accumulate W/L per opponent
  //    Key = opponent name (stable across tournaments)
  const opponentMap = new Map<
    string,
    { wins: number; losses: number; lastPlayed: string }
  >();

  for (const result of tourneyData) {
    if (result.status !== 'fulfilled') continue;
    const { players, games, startUtc } = result.value;

    // Find our tournament-local player ID
    const ourPlayer = players.find((p) => p.claimedBy === userId);
    if (!ourPlayer) continue;
    const ourPlayerId = ourPlayer.playerId;

    // Build playerId → name lookup
    const nameOf = new Map<number, string>();
    for (const p of players) nameOf.set(p.playerId, p.name);

    for (const game of games) {
      if (game.status !== 'completed' || game.bye) continue;

      // playerIds and resultPositions are parallel arrays:
      //   playerIds[i] finished in position resultPositions[i]
      //   (lower position number = higher finish, e.g. 1 = 1st place)
      const ourIdx = game.playerIds.indexOf(ourPlayerId);
      if (ourIdx === -1) continue; // We weren't in this game

      const ourPos = game.resultPositions[ourIdx];
      if (!ourPos) continue; // No result recorded

      // Determine the game date (use game.startedAt if available, else tournament start)
      const gameDate = game.startedAt || startUtc || '';

      // Compare our finishing position against every other player in the game
      for (let i = 0; i < game.playerIds.length; i++) {
        if (i === ourIdx) continue;
        const oppId = game.playerIds[i];
        const oppName = nameOf.get(oppId) || `Player ${oppId}`;
        const oppPos = game.resultPositions[i];
        if (!oppPos) continue; // No result for this opponent

        const rec = opponentMap.get(oppName) ?? {
          wins: 0,
          losses: 0,
          lastPlayed: '',
        };

        // Lower position number = better finish (1st beats 2nd)
        if (ourPos < oppPos) rec.wins++;
        else if (ourPos > oppPos) rec.losses++;

        // Track most recent encounter
        if (gameDate > rec.lastPlayed) rec.lastPlayed = gameDate;

        opponentMap.set(oppName, rec);
      }
    }
  }

  // 4  Sort by most-recently-played, take 10
  return Array.from(opponentMap.entries())
    .map(([name, r]) => {
      const total = r.wins + r.losses;
      return {
        name,
        wins: r.wins,
        losses: r.losses,
        totalGames: total,
        winRate: total > 0 ? r.wins / total : null,
        lastPlayed: r.lastPlayed,
      } satisfies RecentOpponent;
    })
    .sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed))
    .slice(0, 10);
}
