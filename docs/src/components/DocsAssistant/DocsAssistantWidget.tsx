import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS, WIDTH } from './constants';
import { IconChat, IconClose, IconNew } from './icons';
import { LogoMark } from './icons';
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
  const fabRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const resizingRef = useRef(false);
  const { state, send, stop, retry, clear, setFeedback } = useAssistant();

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

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => composerRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
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

  const toggleOpen = () => setOpen((v) => !v);

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className="da-fab"
        aria-label="Open docs assistant"
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        onClick={toggleOpen}
        data-open={open ? 'true' : 'false'}
      >
        <IconChat />
      </button>

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
            <LogoMark />
            <span>Docs assistant</span>
          </div>
          <div className="da-header-actions">
            <button
              type="button"
              className="da-header-btn"
              onClick={clear}
              aria-label="New conversation"
              title="New conversation"
            >
              <IconNew />
            </button>
            <button
              type="button"
              className="da-header-btn"
              onClick={() => {
                setOpen(false);
                fabRef.current?.focus();
              }}
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
          onSend={send}
          onStop={stop}
          onRetry={retry}
          onFeedback={setFeedback}
        />
      </aside>
    </>
  );
}
