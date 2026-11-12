/**
 * Replace the value of a string literal and keep its original quote style.
 *
 * recast prints a `StringLiteral` with the file-wide quote style and ignores the raw text, so editing `value`
 * in place would flip a double-quoted string in a single-quoted file. A `Literal` with `extra.raw` is printed
 * as is. This function swaps the node for such a `Literal`, carrying over comments and location. Use it only
 * for text that has no escape sequences in the part being edited (identifiers and CSS names), because `edit`
 * runs on the raw text too.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} path Path of a string literal node (`StringLiteral`, or `Literal` with a string value).
 * @param {(text: string) => string} edit Function that rewrites a text. It is applied to the value and to the
 * raw source text of the literal, so both must give the same result.
 * @returns {void}
 */
export function replaceStringLiteral(j, path, edit) {
  const { node } = path;
  const value = edit(node.value);
  const raw = node.extra?.raw ?? node.raw;

  if (typeof raw !== 'string') {
    node.value = value;

    return;
  }

  const literal = j.literal(value);

  literal.extra = { raw: edit(raw), rawValue: value };
  literal.comments = node.comments;
  literal.loc = node.loc;
  path.replace(literal);
}
