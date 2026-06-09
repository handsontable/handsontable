import { lazy, Suspense } from 'react';
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

export function MarkdownRenderer({ content }: Props) {
  const Renderer = supportsModernRegex() ? MarkdownRendererFull : MarkdownRendererSimple;

  return (
    <Suspense fallback={<MarkdownFallback />}>
      <Renderer content={content} />
    </Suspense>
  );
}
