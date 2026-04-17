import { useEffect, useRef, useState } from 'react';
import { Message } from './Message';
import { STARTER_SUGGESTIONS, WELCOME } from './constants';
import { IconRetry, IconSend, IconStop } from './icons';
import type { ChatMessage } from './useAssistant';

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  composerRef: React.RefObject<HTMLTextAreaElement>;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onFeedback: (id: string, feedback: 'up' | 'down') => void;
}

export function Thread({
  messages,
  streaming,
  error,
  composerRef,
  onSend,
  onStop,
  onRetry,
  onFeedback,
}: Props) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const submit = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    onSend(text);
    setDraft('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;
  const empty = messages.length === 0;

  return (
    <div className="da-thread">
      <div className="da-scroll" ref={scrollRef}>
        {empty ? (
          <div className="da-welcome">
            <h3>{WELCOME.headline}</h3>
            <p>{WELCOME.sub}</p>
            <div className="da-suggestions">
              {STARTER_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="da-suggestion"
                  onClick={() => onSend(s)}
                  disabled={streaming}
                >
                  {s}
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
                streaming={streaming}
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
        <textarea
          ref={composerRef}
          className="da-input"
          placeholder="Ask a question…"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Ask a question"
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
      </form>
    </div>
  );
}
