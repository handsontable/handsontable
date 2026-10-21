/**
 * Strip HTML comments from a pull-request body, so a commented mention of a marker cannot activate it.
 *
 * Its own module because two gates need it and neither should drag the other in. The changelog gate
 * reads `[skip changelog]`; the visual budget reads `[visual budget: N – reason]`. Both markers are
 * documented inside `<!-- ... -->` in the pull-request template, so both have to agree on what a
 * commented marker means — and the template's own example must never authorise anything.
 *
 * It lived in `changelog-gate.mjs` until the budget needed it too. Importing it from there would have
 * pulled `presence-gate.mjs` into `visual-tests/` along with it, for ten lines; copying it created a
 * second definition to keep in step. Neither is necessary when the function can simply be its own file.
 *
 * Stripping repeats until a fixed point: a single pass can reassemble a new `<!-- ... -->` from the
 * text around a removed match (CodeQL js/incomplete-multi-character-sanitization) — `A <!<!-- x -->-- b
 * --> C` is the shape. Any unterminated trailing `<!--` is dropped too, mirroring how renderers hide
 * comment-to-EOF. Both choices bias toward NOT recognizing an ambiguous marker, which is the safe
 * direction for both callers: the changelog gate demands an entry, the budget demands the number.
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
