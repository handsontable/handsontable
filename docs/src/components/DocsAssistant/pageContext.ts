function slugFromPath(pathname: string): string {
  return pathname.replace(/\/$/, '').replace(/^\/docs\//, '');
}

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
