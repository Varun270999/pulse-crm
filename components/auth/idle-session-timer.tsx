'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const CHECK_INTERVAL_MS = 15 * 1000; // check every 15 seconds

export function IdleSessionTimer() {
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleEvent = () => {
      if (!throttleTimeout) {
        updateActivity();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleEvent, { passive: true });
    });

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_TIMEOUT_MS) {
        clearInterval(intervalId);
        signOut({ redirectTo: '/login?timeout=1' });
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      clearInterval(intervalId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleEvent);
      });
    };
  }, []);

  return null;
}
