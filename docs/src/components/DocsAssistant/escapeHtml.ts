export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escapes text for HTML attribute values (e.g. href). */
export function escapeHtmlAttr(s: string): string {
  return escapeHtml(s)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
