/**
 * Docs assistant widget root.
 *
 * The panel is triggered by header buttons (`#header-assistant-btn` and
 * `#mobile-assistant-btn`) rendered in Header.astro. The panel is
 * *non-modal* (`aria-modal="false"`) so readers can keep interacting
 * with the docs while the assistant is open. ESC and the close button
 * both dismiss the panel; opening moves focus to the composer.
 *
 * Open state, thread, and panel width are persisted to localStorage
 * (see `STORAGE_KEYS`) so navigation between docs pages does not reset
 * the conversation.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS, WIDTH } from './constants';
import { IconChatbot, IconClose, IconTrash } from './icons';
import { Thread } from './Thread';
import { useAssistant } from './useAssistant';
import './DocsAssistant.css';

function readInitialOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.open) === 'true';
  } catch {
    return false;
  }
}

function readInitialWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.width);
    if (!raw) return WIDTH.default;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return WIDTH.default;
    return Math.min(WIDTH.max, Math.max(WIDTH.min, n));
  } catch {
    return WIDTH.default;
  }
}

export function DocsAssistantWidget() {
  const [open, setOpen] = useState<boolean>(() => readInitialOpen());
  const [width, setWidth] = useState<number>(() => readInitialWidth());
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const resizingRef = useRef(false);
  const { state, send, stop, retry, clear, clearAndSend, setFeedback } = useAssistant();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.open, open ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.width, String(width));
    } catch {
      // ignore
    }
  }, [width]);

  // Header buttons dispatch `docs-assistant:toggle` from Header.astro (re-bound on
  // astro:after-swap). ToC uses document delegation because PageSidebar can swap too.
  useEffect(() => {
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener('docs-assistant:toggle', onToggle);
    // Tell the bootstrap the toggle listener is now attached. The widget is
    // mounted lazily on the first button click, and the bootstrap waits for
    // this signal before dispatching that first toggle — otherwise the click
    // would be lost to the mount/listener race and the panel would not open.
    window.dispatchEvent(new Event('docs-assistant:ready'));
    return () => window.removeEventListener('docs-assistant:toggle', onToggle);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const tocBtn = (e.target as HTMLElement).closest('#toc-assistant-btn');
      if (!tocBtn) return;
      const pageTitle = tocBtn.getAttribute('data-page-title') || document.title;
      clear();
      setPendingDraft(`I have a question about the "${pageTitle}" page.\n`);
      setOpen(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [clear]);

  // "Ask AI about this API" buttons on API reference pages — opens assistant
  // and auto-submits the prefilled question without user interaction.
  useEffect(() => {
    const handleAskAboutApi = (e: Event) => {
      const { question } = (e as CustomEvent<{ question: string }>).detail;
      setOpen(true);
      clearAndSend(question);
    };
    window.addEventListener('docs-assistant:ask', handleAskAboutApi);
    return () => window.removeEventListener('docs-assistant:ask', handleAskAboutApi);
  }, [clearAndSend]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => composerRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      if (!resizingRef.current) return;
      const next = Math.min(WIDTH.max, Math.max(WIDTH.min, window.innerWidth - ev.clientX));
      setWidth(next);
    };
    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  return (
    <aside
      className="da-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Docs assistant"
      data-open={open ? 'true' : 'false'}
      style={{ width: `${width}px` }}
    >
      <div
        className="da-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize assistant panel"
        onPointerDown={startResize}
      />
      <header className="da-header">
        <div className="da-title">
          <IconChatbot />
          <span>Docs assistant</span>
        </div>
        <div className="da-header-actions">
          {state.messages.length > 0 && (
            <button
              type="button"
              className="da-header-btn"
              onClick={clear}
              aria-label="Clear chat"
              title="Clear chat"
            >
              <IconTrash />
            </button>
          )}
          <button
            type="button"
            className="da-header-btn"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            title="Close"
          >
            <IconClose />
          </button>
        </div>
      </header>

      <Thread
        messages={state.messages}
        streaming={state.streaming}
        error={state.error}
        composerRef={composerRef}
        pendingDraft={pendingDraft}
        onPendingDraftConsumed={() => setPendingDraft(null)}
        onSend={send}
        onStop={stop}
        onRetry={retry}
        onFeedback={setFeedback}
      />
    </aside>
  );
}
