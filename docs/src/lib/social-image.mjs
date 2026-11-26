import { SITE_URL } from '../agent-note.mjs';

/**
 * The image that link previews (LinkedIn, Slack, X) show for every docs page.
 * The file lives in `docs/public/`, and `width` and `height` must match it:
 * `__tests__/social-image.test.mjs` reads the PNG header to check.
 *
 * The URL is absolute because crawlers don't resolve a relative `og:image`.
 * So a pull request preview serves the production copy of the file, and a
 * changed image shows only after the production deploy.
 */
export const SOCIAL_IMAGE = {
  file: 'handsontable-docs-cover.png',
  url: `${SITE_URL}/docs/handsontable-docs-cover.png`,
  width: 1160,
  height: 600,
  alt: 'Handsontable DataGrid: read the docs',
};

/**
 * Returns the Starlight `head` entries for the social preview image.
 * Starlight emits `og:title`, `og:description`, and
 * `twitter:card=summary_large_image` by itself, but no image.
 *
 * @returns {Array<{ tag: 'meta', attrs: Record<string, string> }>}
 */
export function socialImageHead() {
  const { url, width, height, alt } = SOCIAL_IMAGE;

  return [
    { tag: 'meta', attrs: { property: 'og:image', content: url } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: String(width) } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: String(height) } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: alt } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: url } },
    { tag: 'meta', attrs: { name: 'twitter:image:alt', content: alt } },
  ];
}
