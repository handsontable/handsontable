/**
 * Decides when the docs assistant shows its proactive bubble (SU-598, stage I).
 *
 * The bubble appears when the reader has scrolled to the bottom of a long page
 * and then stays idle for `BUBBLE.idleMs`. It can show again later (on another
 * page, or after the chat was opened and closed), until the reader closes it:
 * that is remembered in `localStorage`, and the bubble never shows again.
 * Opening the chat only hides it. It never opens the chat on its own.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { BUBBLE, STORAGE_KEYS } from './constants';

/**
 * Any of these means the reader is active, so the idle countdown restarts.
 * `focusin` runs after a Tab has moved the focus, which `keydown` runs before.
 */
const ACTIVITY_EVENTS = ['scroll', 'wheel', 'keydown', 'focusin', 'pointerdown', 'pointermove', 'touchstart'] as const;

/**
 * The close is also kept here, for the rest of the page's life, so it holds when
 * `localStorage` throws (blocked site data, a sandboxed iframe).
 */
let dismissedInMemory = false;

function wasDismissed(): boolean {
  if (dismissedInMemory) return true;

  try {
    return localStorage.getItem(STORAGE_KEYS.bubbleDismissed) === 'true';
  } catch {
    return false;
  }
}

function markDismissed(): void {
  dismissedInMemory = true;

  try {
    localStorage.setItem(STORAGE_KEYS.bubbleDismissed, 'true');
  } catch {
    // The in-memory flag above still holds the close for this page.
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
  // The element whose keyboard focus the bubble would cover. The bubble stays away
  // while that element keeps the focus (WCAG 2.2, SC 2.4.11 Focus Not Obscured).
  const coveredFocusRef = useRef<Element | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    markDismissed();
  }, []);

  // Not a dismissal: the bubble can come back once the focus moves on.
  const hideForFocus = useCallback((focused: Element) => {
    coveredFocusRef.current = focused;
    setVisible(false);
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

    // The trigger can stop holding during the countdown without an activity event:
    // the tab went to the background, or the page grew (a lazy example mounted).
    // Each of those waits for the next activity, which re-checks and restarts it.
    const canShow = () => !document.hidden
      && isLongPage()
      && isAtBottom()
      && document.activeElement !== coveredFocusRef.current;

    const show = () => {
      timer = undefined;

      if (!canShow()) return;

      coveredFocusRef.current = null;
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      document.removeEventListener('visibilitychange', onActivity);
      setVisible(true);
    };

    function onActivity() {
      stop();

      if (canShow()) {
        timer = window.setTimeout(show, BUBBLE.idleMs);
      }
    }

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    // Coming back to the tab counts as activity, so a countdown the hidden tab
    // skipped starts again.
    document.addEventListener('visibilitychange', onActivity);
    // A reader may already be at the bottom when the trigger arms (a restored scroll
    // position, or the chat just closed), so start counting without waiting for an event.
    onActivity();

    return () => {
      stop();
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      document.removeEventListener('visibilitychange', onActivity);
    };
  }, [panelOpen, visible]);

  return { visible, dismiss, hideForFocus };
}
