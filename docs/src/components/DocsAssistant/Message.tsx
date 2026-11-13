import { useState } from 'react';
import { AGENT_LABEL, SUPPORT_UI } from './constants';
import type { ChatMessage } from './useAssistant';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  IconCheck,
  IconCopy,
  IconReply,
  IconRetry,
  IconThumbDown,
  IconThumbUp,
  LoaderBoxes,
} from './icons';

interface Props {
  message: ChatMessage;
  isLastAssistant: boolean;
  /**
   * Show Retry under this answer. Off once the reader wrote again after it: Retry would redo that message.
   */
  canRetry: boolean;
  streaming: boolean;
  /** Show "Reply to Support" under a Support message. Off while the reader already writes to Support. */
  canReplyToSupport: boolean;
  onReplyToSupport: () => void;
  onRetry: () => void;
  onFeedback: (id: string, feedback: 'up' | 'down') => void;
}

export function Message({
  message,
  isLastAssistant,
  canRetry,
  streaming,
  canReplyToSupport,
  onReplyToSupport,
  onRetry,
  onFeedback,
}: Props) {
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
        {message.supportSent && <div className="da-support-note">{SUPPORT_UI.sentNote}</div>}
      </div>
    );
  }

  // A reply a teammate wrote from Slack: its own background and a label, so a reader can tell a
  // person from the bot. No copy, rating or retry actions: it is not an answer the bot can redo.
  if (message.role === 'agent') {
    return (
      <div className="da-msg da-msg-agent">
        <div className="da-agent-label">{AGENT_LABEL}</div>
        <div className="da-assistant-body da-agent-body">
          <MarkdownRenderer content={message.content} />
        </div>
        {canReplyToSupport && (
          <button type="button" className="da-reply-support" onClick={onReplyToSupport}>
            <IconReply /> {SUPPORT_UI.replyButton}
          </button>
        )}
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
          {canRetry && (
            <button type="button" className="da-action" aria-label="Retry" onClick={onRetry}>
              <IconRetry />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
