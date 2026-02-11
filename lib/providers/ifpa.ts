import { fetchJson, getEnvVar } from '../http';
import { IFPAPlayer, IFPAPlayerResponse, IFPAPlayerStats, IFPASeriesEntry, IFPAResult, EventsByYear, IFPAPvpResponse, IFPAPvpOpponent, PvpOpponentSummary } from '../types';

/**
 * IFPA API v2.1 — https://api.ifpapinball.com/docs
 *
 * Auth: query-param `api_key`
 * Base URL has NO /v1 or /v2 prefix (legacy versions are deprecated).
 * The single GET /player/{id} endpoint returns the player profile
 * together with nested ranking stats in player.player_stats.system.MAIN.
 */
const IFPA_API_BASE = 'https://api.ifpapinball.com';

function getApiKey(): string {
  return getEnvVar('IFPA_API_KEY');
}

/**
 * Fetch full player profile (includes embedded stats).
 * Note: The API wraps `player` in an array even for a single ID.
 */
export async function getPlayerProfile(playerId: number): Promise<IFPAPlayer> {
  const apiKey = getApiKey();
  const url = `${IFPA_API_BASE}/player/${playerId}?api_key=${apiKey}`;

  // API returns { player: [{...}] } — an array, even for one player.
  const response = await fetchJson<{ player: IFPAPlayer[] }>(url);

  const player = Array.isArray(response.player)
    ? response.player[0]
    : response.player;

  if (!player) {
    throw new Error('Player data not found in IFPA response');
  }

  return player;
}

/**
 * Extract the OPEN ranking system stats from a player profile.
 * The API returns the key in lowercase, e.g. "open" (not "MAIN").
 * All numeric values arrive as strings, so we parse them.
 */
export function getOpenStats(player: IFPAPlayer): IFPAPlayerStats | null {
  const system = player.player_stats?.system;
  if (!system) return null;

  // Try lowercase first (actual), then uppercase fallback
  const raw = system['open'] ?? system['OPEN'] ?? system['MAIN'] ?? null;
  if (!raw) return null;

  // Parse every string-typed numeric field
  const parsed: IFPAPlayerStats = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === '' || value === null || value === undefined) continue;
    const num = Number(value);
    (parsed as Record<string, number>)[key] = isNaN(num) ? (value as unknown as number) : num;
  }
  return parsed;
}

/**
 * Fetch player results (active + non-active) and group by year.
 */
export async function getEventsByYear(playerId: number): Promise<EventsByYear[]> {
  const apiKey = getApiKey();
  const [activeRes, nonActiveRes] = await Promise.allSettled([
    fetchJson<{ results: IFPAResult[] }>(
      `${IFPA_API_BASE}/player/${playerId}/results/MAIN/ACTIVE?api_key=${apiKey}`
    ),
    fetchJson<{ results: IFPAResult[] }>(
      `${IFPA_API_BASE}/player/${playerId}/results/MAIN/NONACTIVE?api_key=${apiKey}`
    ),
  ]);

  const allResults: IFPAResult[] = [];
  if (activeRes.status === 'fulfilled' && Array.isArray(activeRes.value.results)) {
    allResults.push(...activeRes.value.results);
  }
  if (nonActiveRes.status === 'fulfilled' && Array.isArray(nonActiveRes.value.results)) {
    allResults.push(...nonActiveRes.value.results);
  }

  // Group by year
  const yearMap = new Map<string, { count: number; points: number }>();
  for (const r of allResults) {
    const year = r.event_date?.substring(0, 4);
    if (!year) continue;
    const existing = yearMap.get(year) ?? { count: 0, points: 0 };
    existing.count += 1;
    existing.points += Number(r.current_points) || 0;
    yearMap.set(year, existing);
  }

  // Sort descending by year
  return Array.from(yearMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, data]) => ({
      year,
      eventCount: data.count,
      totalPoints: Math.round(data.points * 100) / 100,
    }));
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetch PVP opponent records and normalize to a "top 10 opponents by total games" list.
 * Note: IFPA does not provide timestamps here, so this cannot be truly "last 10" by recency.
 */
export async function getPvpOpponentsTop10(playerId: number): Promise<PvpOpponentSummary[]> {
  const apiKey = getApiKey();
  const url = `${IFPA_API_BASE}/player/${playerId}/pvp?api_key=${apiKey}`;

  const response = await fetchJson<IFPAPvpResponse>(url);
  const rawPvp = (response as any)?.pvp;
  const opponents: IFPAPvpOpponent[] = Array.isArray(rawPvp) ? rawPvp : rawPvp ? [rawPvp] : [];

  const normalized = opponents
    .map((o) => {
      const wins = toNumber((o as any).win_count);
      const losses = toNumber((o as any).loss_count);
      const ties = toNumber((o as any).tie_count);
      const totalGames = wins + losses + ties;
      const decisiveGames = wins + losses;
      const winRate = decisiveGames > 0 ? wins / decisiveGames : null;

      const firstName = (o as any).first_name ?? '';
      const lastName = (o as any).last_name ?? '';
      const name = `${firstName} ${lastName}`.trim() || 'Unknown';
      const playerIdNum = toNumber((o as any).player_id);

      return {
        playerId: playerIdNum,
        name,
        wins,
        losses,
        ties,
        totalGames,
        winRate,
      } satisfies PvpOpponentSummary;
    })
    .filter((o) => o.totalGames > 0)
    .sort((a, b) => b.totalGames - a.totalGames)
    .slice(0, 10);

  return normalized;
}

/**
 * Extract the most recent NACS state ranking from the player's series data.
 */
export function getStateRanking(player: IFPAPlayer): {
  state: string;
  rank: number;
  points: number;
  year: string;
} | null {
  const series = player.series;
  if (!series || series.length === 0) return null;

  // Filter to NACS open entries and pick the most recent year
  const nacsOpen = series
    .filter(
      (s: IFPASeriesEntry) =>
        s.series_code === 'NACS' && (s.system === 'open' || s.system === 'OPEN')
    )
    .sort((a: IFPASeriesEntry, b: IFPASeriesEntry) =>
      (b.year ?? '').localeCompare(a.year ?? '')
    );

  const latest = nacsOpen[0];
  if (!latest) return null;

  const regionName = latest.region_name ?? player.stateprov ?? 'Unknown';
  const rank = Number(latest.series_rank);
  const points = Number(latest.total_points);
  const year = latest.year ?? '';

  if (isNaN(rank)) return null;

  return { state: regionName, rank, points: isNaN(points) ? 0 : points, year };
}

/**
 * Primary entry-point used by the dashboard route.
 * Returns the player profile + pre-extracted MAIN stats + state ranking + events by year.
 */
export async function getPlayerData(playerId: number) {
  const player = await getPlayerProfile(playerId);
  const stats = getOpenStats(player);
  const stateRanking = getStateRanking(player);
  const eventsByYear = await getEventsByYear(playerId);
  return { player, stats, stateRanking, eventsByYear };
}
