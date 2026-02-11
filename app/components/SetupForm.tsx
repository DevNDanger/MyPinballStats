'use client';

import { useState } from 'react';
import type { PlayerIds } from '@/lib/hooks/usePlayerIds';

interface SetupFormProps {
  initialIds?: PlayerIds | null;
  onSave: (ids: PlayerIds) => void;
  onCancel?: () => void;
}

type IdSource = 'ifpa' | 'matchplay';

export default function SetupForm({ initialIds, onSave, onCancel }: SetupFormProps) {
  const [source, setSource] = useState<IdSource>('ifpa');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = playerId.trim();

    if (!trimmed) {
      setError('Please enter your player ID.');
      return;
    }

    if (!/^\d+$/.test(trimmed)) {
      setError('Player ID must be a number.');
      return;
    }

    // Pass whichever ID the user entered; the API will auto-discover the other
    onSave({
      ifpaId: source === 'ifpa' ? trimmed : '',
      matchPlayId: source === 'matchplay' ? trimmed : '',
    });
  };

  return (
    <div className="st-card p-8 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2 st-section-header text-center">
        {onCancel ? 'Change Player' : 'Welcome'}
      </h2>
      <p className="text-[var(--st-muted)] text-xs text-center mb-6 tracking-wider">
        Enter either your IFPA or Match Play ID — we&apos;ll find the rest automatically.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--st-border)]">
          <button
            type="button"
            onClick={() => { setSource('ifpa'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
              source === 'ifpa'
                ? 'bg-[var(--st-red)] text-white'
                : 'bg-transparent text-[var(--st-muted)] hover:text-[var(--st-text)]'
            }`}
          >
            IFPA ID
          </button>
          <button
            type="button"
            onClick={() => { setSource('matchplay'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
              source === 'matchplay'
                ? 'bg-[var(--st-red)] text-white'
                : 'bg-transparent text-[var(--st-muted)] hover:text-[var(--st-text)]'
            }`}
          >
            Match Play ID
          </button>
        </div>

        {/* Single ID input */}
        <div>
          <label
            htmlFor="playerId"
            className="block text-xs text-[var(--st-muted)] mb-1 tracking-wider uppercase"
          >
            {source === 'ifpa' ? 'IFPA Player ID' : 'Match Play User ID'}
          </label>
          <input
            id="playerId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={source === 'ifpa' ? 'e.g. 12345' : 'e.g. 54321'}
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="st-input w-full"
            autoFocus
          />
          <a
            href={
              source === 'ifpa'
                ? 'https://www.ifpapinball.com/players/find.php'
                : 'https://app.matchplay.events'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--st-orange)] hover:underline mt-1 inline-block"
          >
            {source === 'ifpa' ? 'Find your IFPA ID →' : 'Find your Match Play ID →'}
          </a>
        </div>

        {/* Stern IC — grayed out for future */}
        <div className="opacity-40 pointer-events-none">
          <label
            className="block text-xs text-[var(--st-muted)] mb-1 tracking-wider uppercase"
          >
            Stern Insider Connected ID
          </label>
          <input
            type="text"
            disabled
            placeholder="Coming soon"
            className="st-input w-full cursor-not-allowed"
          />
          <span className="text-[10px] text-[var(--st-muted)] mt-1 inline-block">
            Stern IC integration coming soon
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="text-[var(--st-red)] text-xs text-center">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="st-button py-2 px-6 rounded-lg text-sm flex-1 !border-[var(--st-muted)] !text-[var(--st-muted)] !shadow-none hover:!border-[var(--st-text)] hover:!text-[var(--st-text)]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="st-button py-2 px-6 rounded-lg text-sm flex-1"
          >
            {onCancel ? 'Save' : 'View My Stats'}
          </button>
        </div>
      </form>
    </div>
  );
}
