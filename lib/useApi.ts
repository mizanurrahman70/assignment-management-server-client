"use client";

import { useCallback, useEffect, useState } from "react";

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Fetching data in an effect legitimately drives loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // The dynamic deps list is intentional: callers control when a refetch happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, ...deps, enabled]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, loading, error, reload };
}
