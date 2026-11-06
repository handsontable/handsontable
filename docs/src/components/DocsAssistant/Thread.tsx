import { useEffect, useRef, useState } from 'react';
import { Message } from './Message';
import { BACK_TO_BOT_NOTICE_MS, STARTER_SUGGESTIONS, SUPPORT_UI, WELCOME } from './constants';
import { IconClose, IconRetry, IconSend, IconStop, IllustrationWelcome } from './icons';
import { outgoingMessage, retryableAssistantId } from './agentReplies';
import type { ChatMessage } from './useAssistant';

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  composerRef: React.RefObject<HTMLTextAreaElement>;
  pendingDraft?: string | null;
  onPendingDraftConsumed?: () => void;
  /** True while Support can still be written to: the conversation has a live Slack thread. */
  canWriteToSupport: boolean;
  onSend: (text: string) => void;
  onSendToSupport: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onFeedback: (id: string, feedback: 'up' | 'down') => void;
}

export function Thread({
  messages,
  streaming,
  error,
  composerRef,
  pendingDraft,
  onPendingDraftConsumed,
  canWriteToSupport,
  onSend,
  onSendToSupport,
  onStop,
  onRetry,
  onFeedback,
}: Props) {
  const [draft, setDraft] = useState('');
  // The next message goes to Support, not to the bot. It lasts for one message: sending it, or closing
  // the chip, puts the input back to the bot.
  const [toSupport, setToSupport] = useState(false);
  const [backToBotNotice, setBackToBotNotice] = useState(false);

  // The chip cannot outlive the conversation it belongs to (a cleared thread, a thread too old to poll).
  useEffect(() => {
    if (!canWriteToSupport) setToSupport(false);
  }, [canWriteToSupport]);

  useEffect(() => {
    if (!backToBotNotice) return undefined;
    const timer = window.setTimeout(() => setBackToBotNotice(false), BACK_TO_BOT_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [backToBotNotice]);

  const startSupportReply = () => {
    setBackToBotNotice(false);
    setToSupport(true);
    composerRef.current?.focus();
  };

  const stopSupportReply = () => {
    setToSupport(false);
    setBackToBotNotice(true);
    composerRef.current?.focus();
  };

  useEffect(() => {
    if (pendingDraft) {
      setDraft(pendingDraft);
      onPendingDraftConsumed?.();
      setTimeout(() => composerRef.current?.focus(), 100);
    }
  }, [pendingDraft]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const submit = () => {
    const text = draft.trim();
    // Ask the same rule the hook uses, so a draft that would send nothing (a bare `!reply`) stays put.
    if (!outgoingMessage(text, { toSupport, canWriteToSupport }) || streaming) return;
    if (toSupport) {
      onSendToSupport(text);
      setToSupport(false);
    } else {
      onSend(text);
    }
    setDraft('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;
  const retryableId = retryableAssistantId(messages);
  const empty = messages.length === 0;

  return (
    <div className="da-thread">
      <div className="da-scroll" ref={scrollRef}>
        {empty ? (
          <div className="da-welcome">
            <div className="da-welcome-hero">
              <div className="da-welcome-text">
                <h3>{WELCOME.headline}</h3>
                <p>{WELCOME.sub}</p>
              </div>
              <IllustrationWelcome className="da-welcome-illustration" />
            </div>
            <div className="da-suggestions">
              {STARTER_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="da-suggestion"
                  onClick={() => onSend(s)}
                  disabled={streaming}
                >
                  <span>{s}</span>
                  <span className="da-suggestion-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="da-messages" role="log">
            {messages.map((m) => (
              <Message
                key={m.id}
                message={m}
                isLastAssistant={m.id === lastAssistantId}
                canRetry={m.id === retryableId}
                streaming={streaming}
                canReplyToSupport={canWriteToSupport && !toSupport}
                onReplyToSupport={startSupportReply}
                onRetry={onRetry}
                onFeedback={onFeedback}
              />
            ))}
            {error && (
              <div className="da-error" role="alert">
                <span>Something went wrong: {error}</span>
                <button type="button" className="da-error-retry" onClick={onRetry}>
                  <IconRetry /> Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        className="da-composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className={`da-input-wrap${toSupport ? ' has-support-chip' : ''}`}>
          {toSupport && (
            <span className="da-support-chip">
              {SUPPORT_UI.chip}
              <button
                type="button"
                className="da-support-chip-remove"
                aria-label={SUPPORT_UI.chipRemove}
                onClick={stopSupportReply}
              >
                <IconClose width={10} height={10} />
              </button>
            </span>
          )}
          <textarea
            ref={composerRef}
            className="da-input"
            placeholder={toSupport ? SUPPORT_UI.placeholder : 'Ask a question...'}
            rows={2}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (backToBotNotice) setBackToBotNotice(false);
            }}
            onKeyDown={onKeyDown}
            aria-label={toSupport ? SUPPORT_UI.composerLabel : 'Ask a question'}
          />
          {streaming ? (
            <button
              type="button"
              className="da-send is-stop"
              aria-label="Stop generating"
              onClick={onStop}
            >
              <IconStop />
            </button>
          ) : (
            <button
              type="submit"
              className="da-send"
              aria-label="Send message"
              disabled={!draft.trim()}
            >
              <IconSend />
            </button>
          )}
        </div>
      </form>
      <p className="da-support-notice" role="status">
        {backToBotNotice ? SUPPORT_UI.backToBot : ''}
      </p>
      <p className="da-disclaimer" role="note">
        AI-generated responses may be inaccurate. Verify critical information before use.
      </p>
    </div>
  );
}
