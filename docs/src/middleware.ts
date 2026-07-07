import { fileURLToPath } from 'node:url';
import { defineMiddleware } from 'astro:middleware';
import { root } from 'astro:config/server';
import {
  RENDERED_HTML_MARKER_RE,
  readRenderedHtml,
} from './plugins/rendered-html-store.mjs';

// Resolve the directory from the project root provided by Astro. The
// module-relative default inside rendered-html-store.mjs is wrong here:
// at build time the middleware is bundled into `dist/.prerender/`, so its
// `import.meta.url` no longer points into `src/`.
const renderedHtmlDir = fileURLToPath(new URL('.astro/rendered-html/', root));

/**
 * Injects loader-rendered page HTML into responses (DEV-1991).
 *
 * The framework loader stores a `<!--hot-rendered:<id>-->` marker as
 * `entry.rendered.html` and keeps the real HTML in `.astro/rendered-html/`
 * to keep Astro's data store small (see `src/plugins/rendered-html-store.mjs`).
 * Starlight's route renders the marker into the page body; this middleware
 * swaps it for the file content — per request in dev, once per page at
 * prerender time in builds.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  let replaced = html;

  if (html.includes('<!--hot-rendered:')) {
    // A replacer function is used so `$`-sequences in the stored HTML are
    // not interpreted as replacement patterns.
    replaced = html.replace(RENDERED_HTML_MARKER_RE, (marker, id) => {
      const rendered = readRenderedHtml(id, renderedHtmlDir);

      if (rendered === null) {
        throw new Error(
          `Missing rendered HTML file for docs entry "${id}". ` +
          'The .astro/ cache is inconsistent — remove the docs/.astro directory and restart.'
        );
      }

      return rendered;
    });
  }

  const headers = new Headers(response.headers);

  // The body length changed; let the runtime recompute it.
  headers.delete('content-length');

  return new Response(replaced, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
