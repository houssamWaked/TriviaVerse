import { useEffect, useState } from 'react';
import { api, graphqlPublicApi } from '@/api';

type Category = {
  id: string;
};

type CategoryLevel = {
  pool_count?: number | null;
};

export function useClassicCategoryCounts(categories: Category[]) {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    if (!categories.length) return () => {};

    Promise.all(
      categories.map(async (c) => {
        try {
          const levelsRes = (await api.getClassicCategoryLevels(c.id)) as {
            levels?: CategoryLevel[];
          };
          const list = Array.isArray(levelsRes?.levels) ? levelsRes.levels : [];
          const hasCounts = list.some((l) => Number.isFinite(Number(l?.pool_count)));
          if (list.length > 0 && hasCounts) {
            const sum = list.reduce((acc, l) => acc + (Number(l?.pool_count) || 0), 0);
            return [c.id, sum] as const;
          }
        } catch {
          // fall through
        }

        try {
          const s = (await graphqlPublicApi.getCategoryStats(c.id).catch(() =>
            api.getCategoryStats(c.id)
          )) as {
            questions_available?: number | null;
          };
          return [c.id, Number(s?.questions_available)] as const;
        } catch {
          return [c.id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [id, count] of entries) {
        if (!id) continue;
        if (Number.isFinite(count)) next[String(id)] = Number(count);
      }
      setCategoryCounts(next);
    });

    return () => {
      cancelled = true;
    };
  }, [categories]);

  return categoryCounts;
}
