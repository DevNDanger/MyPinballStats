'use client';

import { useState } from 'react';
import type { PlayerIds } from '@/lib/hooks/usePlayerIds';

interface SetupFormProps {
  initialIds?: PlayerIds | null;
  onSave: (ids: PlayerIds) => void;
  onCancel?: () => void;
}

export default function SetupForm({ initialIds, onSave, onCancel }: SetupFormProps) {
  const [ifpaId, setIfpaId] = useState(initialIds?.ifpaId ?? '');
  const [matchPlayId, setMatchPlayId] = useState(initialIds?.matchPlayId ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedIfpa = ifpaId.trim();
    const trimmedMP = matchPlayId.trim();

    if (!trimmedIfpa && !trimmedMP) {
      setError('Please enter at least one player ID.');
      return;
    }

    // Validate that entered values are numeric
    if (trimmedIfpa && !/^\d+$/.test(trimmedIfpa)) {
      setError('IFPA ID must be a number.');
      return;
    }
    if (trimmedMP && !/^\d+$/.test(trimmedMP)) {
      setError('Match Play ID must be a number.');
      return;
    }

    onSave({ ifpaId: trimmedIfpa, matchPlayId: trimmedMP });
  };

  return (
    <div className="st-card p-8 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2 st-section-header text-center">
        {onCancel ? 'Update Player IDs' : 'Welcome'}
      </h2>
      <p className="text-[var(--st-muted)] text-xs text-center mb-6 tracking-wider">
        Enter your player IDs to load your stats. You need at least one.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* IFPA ID */}
        <div>
          <label
            htmlFor="ifpaId"
            className="block text-xs text-[var(--st-muted)] mb-1 tracking-wider uppercase"
          >
            IFPA Player ID
          </label>
          <input
            id="ifpaId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 12345"
            value={ifpaId}
            onChange={(e) => setIfpaId(e.target.value)}
            className="st-input w-full"
          />
          <a
            href="https://www.ifpapinball.com/players/find.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--st-orange)] hover:underline mt-1 inline-block"
          >
            Find your IFPA ID →
          </a>
        </div>

        {/* Match Play ID */}
        <div>
          <label
            htmlFor="matchPlayId"
            className="block text-xs text-[var(--st-muted)] mb-1 tracking-wider uppercase"
          >
            Match Play User ID
          </label>
          <input
            id="matchPlayId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 54321"
            value={matchPlayId}
            onChange={(e) => setMatchPlayId(e.target.value)}
            className="st-input w-full"
          />
          <a
            href="https://app.matchplay.events"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--st-orange)] hover:underline mt-1 inline-block"
          >
            Find your Match Play ID →
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
