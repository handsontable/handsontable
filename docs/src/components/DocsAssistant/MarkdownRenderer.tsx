import { Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { supportsModernRegex } from '../../lib/supports-modern-regex.mjs';

interface Props {
  content: string;
}

const MarkdownRendererFull = lazy(() =>
  import('./MarkdownRendererFull').then((m) => ({ default: m.MarkdownRendererFull }))
);

const MarkdownRendererSimple = lazy(() =>
  import('./MarkdownRendererSimple').then((m) => ({ default: m.MarkdownRendererSimple }))
);

function MarkdownFallback() {
  return <div className="da-markdown" aria-hidden="true" />;
}

interface BoundaryProps {
  content: string;
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

/**
 * Keeps a failed renderer chunk from destroying the whole assistant root.
 *
 * Both renderers are lazy, so a chunk that does not load - stale deployment, offline, blocked
 * request - rejects during render. Without a boundary React unmounts the widget and rethrows to
 * window.onerror, which takes the launcher and the panel down with it. The fallback renders plain
 * text inline and never another lazy component, because a boundary cannot catch a throw raised
 * inside its own fallback.
 */
class MarkdownBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <div className="da-markdown da-markdown-plain">{this.props.content}</div>;
    }

    return this.props.children;
  }
}

export function MarkdownRenderer({ content }: Props) {
  const Renderer = supportsModernRegex() ? MarkdownRendererFull : MarkdownRendererSimple;

  return (
    <MarkdownBoundary content={content}>
      <Suspense fallback={<MarkdownFallback />}>
        <Renderer content={content} />
      </Suspense>
    </MarkdownBoundary>
  );
}
