"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "mousemove",
] as const;

/**
 * Monitors user activity and redirects to /login after TIMEOUT_MS of
 * inactivity.  The timer resets on every qualifying user interaction
 * (click, keypress, scroll, touch, mouse movement).
 *
 * Works purely client-side — no server state involved.  When the
 * timeout fires the browser navigates to /login; Supabase will then
 * reject any stale session on the next server request.
 */
export function useSessionTimeout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeout_ = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimeout_();
    timerRef.current = setTimeout(() => {
      // Force a full page reload through /login so server-side session
      // state is cleared properly.
      window.location.href = "/login?session_expired=1";
    }, TIMEOUT_MS);
  }, [clearTimeout_]);

  useEffect(() => {
    startTimer();

    const handler = () => startTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handler, { passive: true });
    });

    return () => {
      clearTimeout_();
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handler);
      });
    };
  }, [startTimer, clearTimeout_]);
}
