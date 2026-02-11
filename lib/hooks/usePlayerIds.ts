'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PlayerIds {
  ifpaId: string;
  matchPlayId: string;
}

const STORAGE_KEY = 'mps_player_ids';

function loadIds(): PlayerIds | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerIds>;
    // At least one ID must be set
    if (!parsed.ifpaId && !parsed.matchPlayId) return null;
    return {
      ifpaId: parsed.ifpaId ?? '',
      matchPlayId: parsed.matchPlayId ?? '',
    };
  } catch {
    return null;
  }
}

function saveIds(ids: PlayerIds): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function clearIds(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function usePlayerIds() {
  const [playerIds, setPlayerIds] = useState<PlayerIds | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setPlayerIds(loadIds());
    setIsReady(true);
  }, []);

  const save = useCallback((ids: PlayerIds) => {
    saveIds(ids);
    setPlayerIds(ids);
  }, []);

  const clear = useCallback(() => {
    clearIds();
    setPlayerIds(null);
  }, []);

  return {
    playerIds,
    isReady,
    isConfigured: playerIds !== null,
    save,
    clear,
  };
}
