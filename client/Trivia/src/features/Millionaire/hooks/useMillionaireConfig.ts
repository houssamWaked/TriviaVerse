import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';

export type MillionaireLadder = {
  id: string;
  name?: string | null;
};

export function useMillionaireConfig() {
  const [ladders, setLadders] = useState<MillionaireLadder[]>([]);
  const [ladderId, setLadderId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getMillionaireConfig().then((data) => {
      const typed = data as { ladders?: MillionaireLadder[] };
      if (cancelled) return;
      const rows = Array.isArray(typed?.ladders) ? typed.ladders : [];
      setLadders(rows);
      if (!ladderId && rows[0]?.id) setLadderId(rows[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, [ladderId]);

  const selectedLadder = useMemo(
    () => ladders.find((l) => l.id === ladderId) || null,
    [ladders, ladderId]
  );

  return {
    ladders,
    ladderId,
    setLadderId,
    showAdvanced,
    setShowAdvanced,
    selectedLadder,
  };
}
