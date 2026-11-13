/**
 * The website scan's page ids: the pure half the check run shares with the page list (`tests/a11y/website/pages.mjs`).
 * It lives in `tests/lib` because the verdict job of every a11y workflow checks out only `tests/lib` and
 * `tests/scripts`, and `lib/a11y-check-run.mjs`, which the verdict imports, needs the id to place an annotation. No I/O
 * in here.
 */

/**
 * A route as a page id, the way the website's list derives one.
 *
 * @param {string} route The route.
 * @returns {string} The id.
 */
export function pageIdOf(route) {
  const id = route.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return id === '' ? 'home' : id;
}
