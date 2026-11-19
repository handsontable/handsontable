/**
 * Suggestion card shown near the bottom-right corner (SU-598, stage I).
 * It names the current page, so the question feels relevant, and lets the reader
 * open the assistant or dismiss it. It is never shown while the chat is open.
 *
 * The whole card is one "Ask AI" button; the welcome illustration (the same one the
 * chat panel greets the reader with) sticks out above it and is decorative.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconClose, IllustrationWelcome } from './icons';

interface ProactiveBubbleProps {
  onAsk: (pageTitle: string) => void;
  onDismiss: () => void;
  /**
   * Called with a focused element the card would cover, so the card can step aside
   * (WCAG 2.2, SC 2.4.11 Focus Not Obscured).
   */
  onFocusCovered: (focused: Element) => void;
}

function getPageTitle(): string {
  return document.querySelector('h1')?.textContent?.trim() || document.title;
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * The area the card covers once it has slid in: the card and the illustration that
 * sticks out above it. Read from the layout (`offset*`), not from
 * `getBoundingClientRect()`, which includes the slide-in transform while it runs.
 */
function getCoveredArea(root: HTMLElement): Box {
  const illustration = root.querySelector('.da-proactive-illustration');
  const overhang = illustration ? Math.max(0, -parseFloat(getComputedStyle(illustration).top) || 0) : 0;

  return {
    left: root.offsetLeft,
    top: root.offsetTop - overhang,
    right: root.offsetLeft + root.offsetWidth,
    bottom: root.offsetTop + root.offsetHeight,
  };
}

export function ProactiveBubble({ onAsk, onDismiss, onFocusCovered }: ProactiveBubbleProps) {
  const [title] = useState(getPageTitle);
  const rootRef = useRef<HTMLDivElement>(null);

  // Runs before the first paint, and on every focus move while the card is shown.
  const checkFocus = () => {
    const root = rootRef.current;
    const focused = document.activeElement;

    if (!root || !focused || focused === document.body || root.contains(focused)) return;

    if (overlaps(focused.getBoundingClientRect(), getCoveredArea(root))) {
      onFocusCovered(focused);
    }
  };

  useLayoutEffect(checkFocus, []);

  useEffect(() => {
    document.addEventListener('focusin', checkFocus);

    return () => document.removeEventListener('focusin', checkFocus);
  });

  return (
    <div ref={rootRef} className="da-proactive" role="region" aria-label="Docs assistant suggestion">
      <button type="button" className="da-proactive-ask" onClick={() => onAsk(title)}>
        <strong className="da-proactive-title">Ask AI</strong>{' '}
        <span className="da-proactive-text">Questions about &quot;{title}&quot;?</span>
        <IllustrationWelcome className="da-proactive-illustration" />
      </button>
      <button
        type="button"
        className="da-header-btn da-proactive-close"
        onClick={onDismiss}
        aria-label="Dismiss suggestion"
        title="Dismiss"
      >
        <IconClose />
      </button>
    </div>
  );
}
