'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '@/lib/types';
import { usePlayerIds } from '@/lib/hooks/usePlayerIds';
import SetupForm from '@/app/components/SetupForm';

interface CardProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

function Card({ title, children, isLoading, error }: CardProps) {
  return (
    <div className="st-card p-6">
      <h2 className="text-lg font-bold mb-4 st-section-header">
        {title}
      </h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--st-red)]"></div>
        </div>
      ) : error ? (
        <div className="text-[var(--st-red)] text-sm py-4">
          {error}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string | number | undefined;
  highlight?: boolean;
}

function StatRow({ label, value, highlight }: StatRowProps) {
  const displayValue = value !== undefined && value !== null ? value : 'N/A';

  return (
    <div className="st-stat-row">
      <span className="st-stat-label">{label}</span>
      <span className={`st-stat-value ${highlight ? 'text-[var(--st-orange)]' : ''}`}>
        {displayValue}
      </span>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const classMap: Record<string, string> = {
    'A+': 'st-grade-a-plus',
    'A': 'st-grade-a',
    'B': 'st-grade-b',
    'C': 'st-grade-c',
    'D': 'st-grade-d',
  };

  return (
    <div className={`st-grade ${classMap[grade] ?? 'st-grade-d'}`}>
      {grade}
    </div>
  );
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

export default function DashboardPage() {
  const { playerIds, isReady, isConfigured, save, clear } = usePlayerIds();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (!playerIds) return;

    try {
      setIsLoading(!refresh);
      setIsRefreshing(refresh);
      setError(null);

      const params = new URLSearchParams();
      if (playerIds.ifpaId) params.set('ifpaId', playerIds.ifpaId);
      if (playerIds.matchPlayId) params.set('matchPlayId', playerIds.matchPlayId);
      if (refresh) params.set('refresh', 'true');

      const url = `/api/combined/me?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch data`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [playerIds]);

  useEffect(() => {
    if (isReady && isConfigured) {
      fetchData();
    } else if (isReady) {
      setIsLoading(false);
    }
  }, [isReady, isConfigured, fetchData]);

  // Still hydrating — show nothing
  if (!isReady) {
    return (
      <>
        <div className="st-background" />
        <main className="relative min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--st-red)]" />
        </main>
      </>
    );
  }

  // No IDs configured yet, or user clicked "Change Player"
  if (!isConfigured || showSetup) {
    return (
      <>
        <div className="st-background" />
        <main className="relative min-h-screen py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-10 text-center">
              <h1 className="st-title text-3xl sm:text-4xl mb-3">
                My Pinball Stats
              </h1>
              <p className="text-[var(--st-muted)] text-xs tracking-widest uppercase mt-2">
                Enter your player IDs to get started
              </p>
            </div>
            <SetupForm
              initialIds={showSetup ? null : playerIds}
              onSave={(ids) => {
                save(ids);
                setShowSetup(false);
                setData(null);
              }}
              onCancel={isConfigured ? () => setShowSetup(false) : undefined}
            />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Stranger Things background */}
      <div className="st-background" />

      <main className="relative min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="st-title text-3xl sm:text-4xl mb-3">
              My Pinball Stats
            </h1>
            <p className="text-[var(--st-muted)] text-xs tracking-widest uppercase">
              {data?.lastUpdated
                ? `Last updated: ${new Date(data.lastUpdated).toLocaleString()}`
                : 'Loading...'}
            </p>
          </div>

          {/* Actions */}
          <div className="mb-8 flex justify-center gap-3">
            <button
              onClick={() => setShowSetup(true)}
              className="st-button py-2 px-6 rounded-lg text-sm !border-[var(--st-orange)] !text-[var(--st-orange)] !shadow-none hover:!bg-[rgba(255,107,53,0.15)]"
            >
              Change Player
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing || isLoading}
              className="st-button py-2 px-8 rounded-lg text-sm"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Cards */}
          <div className="space-y-6">
            {/* Identity Card */}
            <Card title="Player Identity" isLoading={isLoading} error={error}>
              {data && (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-[var(--st-text)]" style={{ fontFamily: 'Righteous, sans-serif' }}>
                    {data.identity.name}
                  </div>
                  {data.identity.location && (
                    <div className="text-[var(--st-muted)] text-sm">
                      {data.identity.location}
                    </div>
                  )}
                  <div className="flex gap-4 mt-4 text-xs text-[var(--st-muted)]">
                    {data.identity.ifpa_id && (
                      <div>IFPA ID: <span className="text-[var(--st-orange)]">{data.identity.ifpa_id}</span></div>
                    )}
                    {data.identity.matchplay_id && (
                      <div>Match Play ID: <span className="text-[var(--st-orange)]">{data.identity.matchplay_id}</span></div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* IFPA Rankings Card */}
            <Card
              title="IFPA Rankings"
              isLoading={isLoading}
              error={data?.ifpa === null ? 'IFPA data unavailable' : undefined}
            >
              {data?.ifpa && (
                <div>
                  <StatRow label="Current Rank" value={data.ifpa.rank} highlight />
                  <StatRow
                    label="WPPR Points"
                    value={data.ifpa.wppr?.toFixed(2)}
                  />
                  {data.ifpa.lastMonthRank != null && (
                    <StatRow label="Last Month Rank" value={data.ifpa.lastMonthRank} />
                  )}
                  {data.ifpa.lastYearRank != null && (
                    <StatRow label="Last Year Rank" value={data.ifpa.lastYearRank} />
                  )}
                  {data.ifpa.highestRank != null && (
                    <StatRow label="Highest Rank" value={data.ifpa.highestRank} />
                  )}
                  {data.ifpa.ratingsValue != null && (
                    <StatRow label="Rating" value={data.ifpa.ratingsValue.toFixed(2)} />
                  )}
                  {data.ifpa.efficiencyValue != null && (
                    <StatRow label="Efficiency" value={`${data.ifpa.efficiencyValue.toFixed(1)}%`} />
                  )}
                  {data.ifpa.totalEvents != null && (
                    <StatRow label="Total Events" value={data.ifpa.totalEvents} />
                  )}

                  {/* State Ranking */}
                  {data.ifpa.stateRanking && (
                    <div className="mt-4 pt-4 border-t border-[var(--st-border)]">
                      <h3 className="st-section-header mb-2">
                        State Ranking — {data.ifpa.stateRanking.state}
                      </h3>
                      <StatRow
                        label={`${data.ifpa.stateRanking.state} Rank (${data.ifpa.stateRanking.year})`}
                        value={`#${data.ifpa.stateRanking.rank}`}
                        highlight
                      />
                      <StatRow
                        label="State Points"
                        value={data.ifpa.stateRanking.points.toFixed(2)}
                      />
                    </div>
                  )}

                  {/* Events By Year */}
                  {data.ifpa.eventsByYear && data.ifpa.eventsByYear.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--st-border)]">
                      <h3 className="st-section-header mb-3">
                        Events &amp; Tournaments by Year
                      </h3>
                      <table className="st-year-table">
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Events</th>
                            <th>WPPR Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.ifpa.eventsByYear.map((ey) => (
                            <tr key={ey.year}>
                              <td className="font-bold text-[var(--st-orange)]">{ey.year}</td>
                              <td>{ey.eventCount}</td>
                              <td>{ey.totalPoints.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Match Play Summary Card */}
            <Card
              title="Match Play Summary"
              isLoading={isLoading}
              error={
                data?.matchplay === null ? 'Match Play data unavailable' : undefined
              }
            >
              {data?.matchplay && (
                <div>
                  {/* Grade badge — prominent at top */}
                  {data.matchplay.grade && (
                    <div className="flex flex-col items-center mb-6 pb-4 border-b border-[var(--st-border)]">
                      <div className="st-section-header mb-3">Player Grade</div>
                      <GradeBadge grade={data.matchplay.grade} />
                      <div className="text-xs text-[var(--st-muted)] mt-2 tracking-wider">
                        CLASS {data.matchplay.ratingClass}
                      </div>
                    </div>
                  )}

                  {data.matchplay.rating != null && (
                    <StatRow label="Match Play Rating" value={data.matchplay.rating} highlight />
                  )}
                  {data.matchplay.gameCount != null && (
                    <StatRow label="Games Played" value={data.matchplay.gameCount} />
                  )}
                  {data.matchplay.winCount != null &&
                    data.matchplay.lossCount != null && (
                      <StatRow
                        label="Record (W–L)"
                        value={`${data.matchplay.winCount}–${data.matchplay.lossCount}`}
                      />
                    )}
                  {data.matchplay.efficiencyPercent != null && (
                    <StatRow
                      label="Win Rate"
                      value={`${(data.matchplay.efficiencyPercent * 100).toFixed(1)}%`}
                    />
                  )}
                  {data.matchplay.tournamentPlayCount != null && (
                    <StatRow
                      label="Tournaments Played"
                      value={data.matchplay.tournamentPlayCount}
                    />
                  )}
                </div>
              )}
            </Card>

            {/* Recent Opponents Card */}
            <Card
              title="Recent Opponents (Match Play)"
              isLoading={isLoading}
              error={!data?.recentOpponents ? 'Match Play data unavailable' : data?.recentOpponentsError ? data.recentOpponentsError : undefined}
            >
              {data?.recentOpponents && (
                <div>
                  <div className="text-xs text-[var(--st-muted)] mb-3 tracking-wider">
                    Last 10 unique opponents from your recent Match Play tournaments.
                  </div>

                  {data.recentOpponents.length > 0 ? (
                    <table className="st-year-table">
                      <thead>
                        <tr>
                          <th>Opponent</th>
                          <th>W–L</th>
                          <th>Win%</th>
                          <th>Games</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOpponents.map((o) => (
                          <tr key={o.name}>
                            <td className="font-bold text-[var(--st-orange)]">{o.name}</td>
                            <td>{`${o.wins}–${o.losses}`}</td>
                            <td>{formatPercent(o.winRate)}</td>
                            <td>{o.totalGames}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-sm text-[var(--st-muted)]">
                      No recent opponent data available.
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-[var(--st-muted)] tracking-widest uppercase">
            Data provided by IFPA and Match Play Events
          </div>
        </div>
      </main>
    </>
  );
}
