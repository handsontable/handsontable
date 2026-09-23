/**
 * Strip HTML comments from a pull-request body, so a commented mention of a marker cannot activate it.
 *
 * A COPY of `stripHtmlComments` in `.github/scripts/lib/changelog-gate.mjs`, kept byte-identical and
 * pinned that way by `changelog-gate.test.mjs`. It is copied rather than imported because
 * `visual-tests/` is its own package: a relative import across the tree works from a checkout and
 * breaks the moment either side is packaged or moved, and a silent break here means the budget marker
 * stops being read at all. The pin is what makes the duplication safe — the two cannot drift without
 * a test naming both files.
 *
 * Stripping repeats until a fixed point: a single pass can reassemble a new `<!-- ... -->` from the
 * text around a removed match (CodeQL js/incomplete-multi-character-sanitization). Any unterminated
 * trailing `<!--` is dropped too, mirroring how renderers hide comment-to-EOF. Both choices bias
 * toward NOT recognizing an ambiguous marker, which for this gate means demanding the author state
 * the number rather than silently accepting growth.
 *
 * @param {string} body The pull-request description.
 * @returns {string} The description without `<!-- ... -->` blocks.
 */
export function stripHtmlComments(body) {
  let stripped = body;
  let previous;

  do {
    previous = stripped;
    stripped = previous.replace(/<!--[\s\S]*?-->/g, '');
  } while (stripped !== previous);

  return stripped.replace(/<!--[\s\S]*$/, '');
}
