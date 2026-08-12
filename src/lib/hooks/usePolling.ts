"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePollingOptions<T> {
  url: string;
  interval: number; // ms
  enabled: boolean;
  onData: (data: T) => void;
}

interface UsePollingReturn {
  isPolling: boolean;
  refresh: () => Promise<void>;
}

export function usePolling<T>(options: UsePollingOptions<T>): UsePollingReturn {
  const { url, interval, enabled, onData } = options;

  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDataRef = useRef(onData);

  // Keep onData ref fresh without triggering effect re-runs
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data: T = await res.json();
      onDataRef.current(data);
    } catch {
      // Handle fetch errors silently — skip failed polls, continue next cycle
    }
  }, [url]);

  const startPolling = useCallback(() => {
    if (intervalRef.current !== null) return;
    intervalRef.current = setInterval(fetchData, interval);
    setIsPolling(true);
  }, [fetchData, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Start/stop polling based on `enabled` flag
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // Pause polling when the browser tab is hidden, resume when visible
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else if (document.visibilityState === "visible" && enabled) {
        startPolling();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  // `refresh` allows immediate re-fetch on demand
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { isPolling, refresh };
}
