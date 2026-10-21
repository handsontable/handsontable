/**
 * Decides when the docs assistant shows its proactive bubble (SU-598, stage I).
 *
 * The bubble appears when the reader has scrolled to the bottom of a long page
 * and then stays idle for `BUBBLE.idleMs`. It shows at most once per browser
 * session (`sessionStorage`): showing it, dismissing it, or opening the chat all
 * count as "seen". It never opens the chat on its own.
 */
import { useCallback, useEffect, useState } from 'react';
import { BUBBLE, STORAGE_KEYS } from './constants';

/**
 * Any of these means the reader is active, so the idle countdown restarts.
 */
const ACTIVITY_EVENTS = ['scroll', 'wheel', 'keydown', 'pointerdown', 'pointermove', 'touchstart'] as const;

function wasSeen(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.bubbleSeen) === 'true';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.bubbleSeen, 'true');
  } catch {
    // ignore
  }
}

function isLongPage(): boolean {
  return document.documentElement.scrollHeight >= window.innerHeight * BUBBLE.minPageViewports;
}

function isAtBottom(): boolean {
  const { scrollHeight } = document.documentElement;

  return window.scrollY + window.innerHeight >= scrollHeight - BUBBLE.bottomTolerancePx;
}

export function useProactiveBubble(panelOpen: boolean) {
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    markSeen();
  }, []);

  // A reader who opened the chat does not need a nudge, now or later this session.
  useEffect(() => {
    if (panelOpen) {
      dismiss();
    }
  }, [panelOpen, dismiss]);

  useEffect(() => {
    if (panelOpen || wasSeen()) return;

    let timer: number | undefined;

    const stop = () => {
      window.clearTimeout(timer);
      timer = undefined;
    };

    const show = () => {
      if (document.hidden) return;

      stop();
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      markSeen();
      setVisible(true);
    };

    function onActivity() {
      stop();

      if (isLongPage() && isAtBottom()) {
        timer = window.setTimeout(show, BUBBLE.idleMs);
      }
    }

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));

    return () => {
      stop();
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [panelOpen]);

  return { visible, dismiss };
}
