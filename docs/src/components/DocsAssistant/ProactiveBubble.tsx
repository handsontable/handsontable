/**
 * Suggestion card shown near the bottom-right corner (SU-598, stage I).
 * It names the current page, so the question feels relevant, and lets the reader
 * open the assistant or dismiss it. It is never shown while the chat is open.
 *
 * The whole card is one "Ask AI" button; the welcome illustration (the same one the
 * chat panel greets the reader with) sticks out above it and is decorative.
 */
import { useState } from 'react';
import { IconClose, IllustrationWelcome } from './icons';

interface ProactiveBubbleProps {
  onAsk: (pageTitle: string) => void;
  onDismiss: () => void;
}

function getPageTitle(): string {
  return document.querySelector('h1')?.textContent?.trim() || document.title;
}

export function ProactiveBubble({ onAsk, onDismiss }: ProactiveBubbleProps) {
  const [title] = useState(getPageTitle);

  return (
    <div className="da-proactive" role="region" aria-label="Docs assistant suggestion">
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
