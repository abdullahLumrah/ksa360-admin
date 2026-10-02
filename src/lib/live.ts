"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLiveRefresh(load: () => Promise<void>, ms = 2000) {
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());
  const loadRef = useRef(load);
  loadRef.current = load;

  const tick = useCallback(async () => {
    try {
      await loadRef.current();
      setUpdatedAt(Date.now());
    } catch {
      // keep the last good snapshot
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void tick();
    };
    run();
    const id = setInterval(run, ms);
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms, tick]);

  return updatedAt;
}
