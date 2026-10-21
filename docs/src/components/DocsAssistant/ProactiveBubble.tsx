/**
 * Small suggestion bubble shown near the bottom-right corner (SU-598, stage I).
 * It names the current page, so the question feels relevant, and lets the reader
 * open the assistant or dismiss it. It is never shown while the chat is open.
 */
import { useState } from 'react';
import { IconChatbot, IconClose } from './icons';

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
    <div className="da-bubble" role="region" aria-label="Docs assistant suggestion">
      <button type="button" className="da-bubble-ask" onClick={() => onAsk(title)}>
        <IconChatbot />
        <span className="da-bubble-text">Questions about &quot;{title}&quot;?</span>
        <strong className="da-bubble-cta">Ask AI</strong>
      </button>
      <button
        type="button"
        className="da-header-btn da-bubble-close"
        onClick={onDismiss}
        aria-label="Dismiss suggestion"
        title="Dismiss"
      >
        <IconClose />
      </button>
    </div>
  );
}
