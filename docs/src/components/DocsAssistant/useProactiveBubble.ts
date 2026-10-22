/**
 * Decides when the docs assistant shows its proactive bubble (SU-598, stage I).
 *
 * The bubble appears when the reader has scrolled to the bottom of a long page
 * and then stays idle for `BUBBLE.idleMs`. It can show again later (on another
 * page, or after the chat was opened and closed), until the reader closes it:
 * that is remembered in `localStorage`, and the bubble never shows again.
 * Opening the chat only hides it. It never opens the chat on its own.
 */
import { useCallback, useEffect, useState } from 'react';
import { BUBBLE, STORAGE_KEYS } from './constants';

/**
 * Any of these means the reader is active, so the idle countdown restarts.
 */
const ACTIVITY_EVENTS = ['scroll', 'wheel', 'keydown', 'pointerdown', 'pointermove', 'touchstart'] as const;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.bubbleDismissed) === 'true';
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.bubbleDismissed, 'true');
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
    markDismissed();
  }, []);

  // An open chat hides the bubble, but does not dismiss it: it can come back after the chat closes.
  useEffect(() => {
    if (panelOpen) {
      setVisible(false);
    }
  }, [panelOpen]);

  useEffect(() => {
    if (panelOpen || visible || wasDismissed()) return;

    let timer: number | undefined;

    const stop = () => {
      window.clearTimeout(timer);
      timer = undefined;
    };

    const show = () => {
      if (document.hidden) return;

      stop();
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      setVisible(true);
    };

    function onActivity() {
      stop();

      if (isLongPage() && isAtBottom()) {
        timer = window.setTimeout(show, BUBBLE.idleMs);
      }
    }

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    // A reader may already be at the bottom when the trigger arms (a restored scroll
    // position, or the chat just closed), so start counting without waiting for an event.
    onActivity();

    return () => {
      stop();
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [panelOpen, visible]);

  return { visible, dismiss };
}
