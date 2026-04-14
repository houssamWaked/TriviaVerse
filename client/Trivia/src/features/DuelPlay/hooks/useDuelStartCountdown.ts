import { useCallback, useEffect, useMemo, useState } from 'react';

type UseDuelStartCountdownArgs = {
  serverMsUntilStart: number;
  isCompleted: boolean;
  questionStartedAt?: string | null;
};

type UseDuelStartCountdownResult = {
  nowMs: number;
  stateReceivedAtMs: number;
  msUntilStart: number;
  markStateReceived: (...args: [number?]) => void;
};

/**
 * Keep a local countdown in sync with server-provided duel start timing.
 * @param serverMsUntilStart Remaining start delay reported by server.
 * @param isCompleted Whether the duel is already completed.
 * @returns Live countdown state and a marker callback for state refreshes.
 */
export function useDuelStartCountdown({
  serverMsUntilStart,
  isCompleted,
  questionStartedAt,
}: UseDuelStartCountdownArgs): UseDuelStartCountdownResult {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [stateReceivedAtMs, setStateReceivedAtMs] = useState(() => Date.now());

  const msUntilStart = useMemo(() => {
    return Math.max(0, serverMsUntilStart - Math.max(0, nowMs - stateReceivedAtMs));
  }, [nowMs, serverMsUntilStart, stateReceivedAtMs]);

  const markStateReceived = useCallback((receivedAtMs = Date.now()) => {
    setNowMs(receivedAtMs);
    setStateReceivedAtMs(receivedAtMs);
  }, []);

  useEffect(() => {
    if (isCompleted) return undefined;
    if (msUntilStart <= 0 && !questionStartedAt) return undefined;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCompleted, msUntilStart, questionStartedAt]);

  return {
    nowMs,
    stateReceivedAtMs,
    msUntilStart,
    markStateReceived,
  };
}
