/**
 * Builds the chat payload's page-context prefix. Mirrors the slug logic
 * used by the "Copy Markdown" button in PageSidebar.astro so the assistant
 * receives the same markdown the user could copy from the page.
 */

/**
 * Converts the current pathname into a `/docs/_md/*.md` slug (no leading
 * `/docs/`, no trailing slash). Returns an empty string for the docs root.
 */
function slugFromPath(pathname: string): string {
  return pathname.replace(/\/$/, '').replace(/^\/docs\//, '');
}

/**
 * Fetches the generated markdown for the current docs page. Returns
 * `null` when the page has no `_md` counterpart (root pages, 404s) or
 * when the fetch fails, so the caller can fall back to a URL-only prefix.
 */
async function fetchPageMarkdown(): Promise<string | null> {
  const slug = slugFromPath(window.location.pathname);

  if (!slug) return null;

  try {
    const res = await fetch(`/docs/_md/${slug}.md`);

    if (!res.ok) return null;

    return (await res.text()).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Wraps a user message with the current page's title, URL, and (when
 * available) its markdown source. This is sent as the final user message
 * to the chat API so the assistant can ground answers in the page the
 * reader is looking at.
 */
export async function buildContextualMessage(userMessage: string): Promise<string> {
  const title = document.title;
  const url = window.location.href;
  const prefix = `[Page: ${title} — ${url}]`;
  const markdown = await fetchPageMarkdown();

  if (markdown) {
    return `${prefix}\n\n[Page markdown]:\n${markdown}\n\n${userMessage}`;
  }

  return `${prefix}\n\n${userMessage}`;
}
