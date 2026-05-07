import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCurrentTheme, getHighlighter, normalizeLang } from './shiki';
import { IconCheck, IconCopy } from './icons';

interface CodeBlockProps {
  lang: string;
  source: string;
}

function CodeBlock({ lang, source }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const theme = getCurrentTheme();
      if (lang === 'text') {
        const lines = escapeHtml(source)
          .split('\n')
          .map((l) => `<span class="ec-line">${l}</span>`)
          .join('\n');
        if (!cancelled) setHtml(`<pre><code>${lines}</code></pre>`);
        return;
      }
      try {
        const hl = await getHighlighter();
        const out = hl.codeToHtml(source, {
          lang,
          theme: theme === 'dark' ? 'github-dark' : 'github-light',
          transformers: [{
            line(node) {
              node.properties.class = 'ec-line';
            },
          }],
        });
        if (!cancelled) setHtml(out);
      } catch {
        if (!cancelled) setHtml(`<pre><code>${escapeHtml(source)}</code></pre>`);
      }
    };

    render();

    const observer = new MutationObserver(render);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [lang, source]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in some contexts; no-op.
    }
  };

  return (
    <div className="da-code">
      <button
        type="button"
        className={`da-code-copy${copied ? ' is-copied' : ''}`}
        onClick={copy}
        aria-label="Copy code to clipboard"
      >
        {copied ? <IconCheck /> : <IconCopy />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      {/* Shiki output is HTML-escaped token spans. The fallback path (render
          failure) also escapes via escapeHtml above, so no user-controlled
          HTML ever reaches this node. */}
      <div className="da-code-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node: _n, href, children, ...rest }: any) => (
          <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
            {children}
          </a>
        ),
        // react-markdown v9 no longer passes `inline`; we detect fenced blocks
        // by the `language-*` className set on the <code> child of <pre>.
        pre: ({ children }: any) => {
          const child = Array.isArray(children) ? children[0] : children;
          const props = child?.props ?? {};
          const className = props.className ?? '';
          const raw = String(props.children ?? '').replace(/\n$/, '');
          const match = /language-(\w+)/.exec(className);
          const lang = normalizeLang(match?.[1]);
          return <CodeBlock lang={lang} source={raw} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
