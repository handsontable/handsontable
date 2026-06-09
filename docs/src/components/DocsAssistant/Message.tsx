import { useState } from 'react';
import type { ChatMessage } from './useAssistant';
import { MarkdownRenderer } from './MarkdownRenderer';
import { IconCheck, IconCopy, IconRetry, IconThumbDown, IconThumbUp, LoaderBoxes } from './icons';

interface Props {
  message: ChatMessage;
  isLastAssistant: boolean;
  streaming: boolean;
  onRetry: () => void;
  onFeedback: (id: string, feedback: 'up' | 'down') => void;
}

export function Message({ message, isLastAssistant, streaming, onRetry, onFeedback }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (message.role === 'user') {
    return (
      <div className="da-msg da-msg-user">
        <div className="da-bubble">{message.content}</div>
      </div>
    );
  }

  const isStreaming = streaming && isLastAssistant;
  const showTyping = isStreaming && !message.content;
  return (
    <div className="da-msg da-msg-assistant">
      <div
        className="da-assistant-body"
        aria-live={isStreaming ? 'polite' : undefined}
      >
        {showTyping ? (
          <div className="da-typing" aria-label="Assistant is thinking">
            <LoaderBoxes />
          </div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
      {!isStreaming && message.content && (
        <div className="da-msg-actions">
          <button type="button" className="da-action" aria-label="Copy message" onClick={copy}>
            {copied ? <IconCheck /> : <IconCopy />}
          </button>
          <button
            type="button"
            className={`da-action${message.feedback === 'up' ? ' is-active' : ''}`}
            aria-label="Helpful"
            aria-pressed={message.feedback === 'up'}
            onClick={() => onFeedback(message.id, 'up')}
          >
            <IconThumbUp />
          </button>
          <button
            type="button"
            className={`da-action${message.feedback === 'down' ? ' is-active' : ''}`}
            aria-label="Not helpful"
            aria-pressed={message.feedback === 'down'}
            onClick={() => onFeedback(message.id, 'down')}
          >
            <IconThumbDown />
          </button>
          {isLastAssistant && (
            <button type="button" className="da-action" aria-label="Retry" onClick={onRetry}>
              <IconRetry />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
