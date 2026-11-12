/**
 * Edits a stylesheet by offset, the way `JsonDocument` edits a `package.json`. postcss reads the text and gives
 * every node its offsets, but printing the whole root changes bytes the transform never touched: the stringifier
 * escapes `<style` in comments and strings, for one. So a transform keeps its postcss nodes for reading, calls the
 * helpers below for every edit, and the printed file is the original text with the recorded edits spliced in.
 * Every other byte stays.
 *
 * A helper also updates the postcss node, so a later rule of the same run sees the edit. `print()` parses the
 * edited text again and compares it with that model. A helper returns `false` and records nothing when the text at
 * the node's offsets is not what the model says, and the transform then reports `manual` instead of editing.
 *
 * @module lib/css-edit
 */

const BOM = 0xFEFF;

/**
 * The part of a node's text that a helper edits, as it stood when the node was first touched.
 *
 * @typedef {object} Snapshot
 * @property {number} start Offset of the node in the part's text, a leading byte order mark included.
 * @property {string} [prop] Property name of a declaration.
 * @property {string} [value] Value of a declaration.
 * @property {string} [between] Text between the property and the value of a declaration (`: `).
 * @property {string} [params] Parameters of an at-rule.
 * @property {string} [afterName] Text between an at-rule name and its parameters.
 * @property {string} [name] Name of an at-rule.
 * @property {boolean} propIsRaw Whether the property carries comments or other raw text the helper cannot splice.
 * @property {boolean} valueIsRaw Whether the value carries comments or other raw text the helper cannot splice.
 */

/**
 * Reduce a node to what the model comparison looks at: its type, its text fields, and its children.
 *
 * @param {object} node A postcss node.
 * @returns {object} A plain object that two equal trees share.
 */
function shapeOf(node) {
  const shape = { type: node.type };

  if (node.type === 'decl') {
    Object.assign(shape, { prop: node.prop, value: node.value, important: Boolean(node.important) });
  } else if (node.type === 'rule') {
    shape.selector = node.selector;
  } else if (node.type === 'atrule') {
    Object.assign(shape, { name: node.name, params: node.params });
  } else if (node.type === 'comment') {
    shape.text = node.text;
  }

  if (node.nodes) {
    shape.nodes = node.nodes.map(shapeOf);
  }

  return shape;
}

/**
 * The line ending a text uses.
 *
 * @param {string} source The text.
 * @returns {string} `\r\n` when the first line break is one, otherwise `\n`.
 */
function lineEnding(source) {
  const index = source.indexOf('\n');

  return index > 0 && source[index - 1] === '\r' ? '\r\n' : '\n';
}

/**
 * Order two edits for splicing from the end of the text to its start. At one offset a replacement goes first (it
 * starts there and keeps its place), then the insertions, the latest first, so the earliest ends up in front.
 *
 * @param {{at: number, order: number}} a An edit. A replacement has `order` -1.
 * @param {{at: number, order: number}} b An edit.
 * @returns {number} Negative when `a` is spliced first.
 */
function spliceOrder(a, b) {
  if (a.at !== b.at) {
    return b.at - a.at;
  }

  if ((a.order < 0) !== (b.order < 0)) {
    return a.order < 0 ? -1 : 1;
  }

  return b.order - a.order;
}

/**
 * The edits of one stylesheet part.
 */
export class CssDocument {
  /**
   * @param {string} source Original text of the part.
   * @param {object} root The postcss Root parsed from it. The document edits its nodes along with the text.
   * @param {(text: string) => object} parse Parses edited text with the syntax of the part, for the final check.
   */
  constructor(source, root, parse) {
    this.source = source;
    this.root = root;
    this.parse = parse;
    this.base = source.charCodeAt(0) === BOM ? 1 : 0;
    this.snapshots = new WeakMap();
    this.replacements = new Map();
    this.insertions = [];
  }

  /**
   * Remember what a node looked like before the first edit, so offsets stay valid after the model changes.
   *
   * @param {object} node A declaration or an at-rule.
   * @returns {Snapshot|null} The snapshot, or `null` when the node has no offset.
   */
  snapshot(node) {
    if (this.snapshots.has(node)) {
      return this.snapshots.get(node);
    }

    const start = node.source?.start?.offset;

    if (!Number.isInteger(start)) {
      return null;
    }

    const snapshot = {
      start: start + this.base,
      prop: node.prop,
      value: node.value,
      between: node.raws?.between,
      params: node.params,
      afterName: node.raws?.afterName,
      name: node.name,
      propIsRaw: node.raws?.prop !== undefined,
      valueIsRaw: node.raws?.value !== undefined,
    };

    this.snapshots.set(node, snapshot);

    return snapshot;
  }

  /**
   * Whether the text at an offset is the text the model says it is.
   *
   * @param {number} start Offset of the text.
   * @param {string} expected The text.
   * @returns {boolean} `true` when the two are equal.
   */
  matches(start, expected) {
    return this.source.slice(start, start + expected.length) === expected;
  }

  /**
   * Record the new text of a range of the original file. A second edit of the same range replaces the first.
   *
   * @param {number} start Offset of the range.
   * @param {string} original Text the range holds in the original file.
   * @param {string} text New text.
   * @returns {void}
   */
  replace(start, original, text) {
    this.replacements.set(start, { start, end: start + original.length, text });
  }

  /**
   * Replace every match of a pattern in the property and in the value of a declaration. The text is spliced where it
   * stands, so the spacing around it stays. A declaration whose property or value holds a comment is not edited.
   *
   * @param {object} declaration A postcss declaration.
   * @param {RegExp} pattern A global pattern.
   * @param {string} replacement The replacement text.
   * @returns {boolean|null} `null` when nothing matches, `true` when the declaration was edited, and `false` when
   * the text at the declaration's offsets is not what the model says (nothing is edited then).
   */
  replaceInDeclaration(declaration, pattern, replacement) {
    const prop = declaration.prop.replace(pattern, replacement);
    const value = declaration.value.replace(pattern, replacement);

    if (prop === declaration.prop && value === declaration.value) {
      return null;
    }

    const snapshot = this.snapshot(declaration);

    if (!snapshot || typeof snapshot.between !== 'string') {
      return false;
    }

    const valueStart = snapshot.start + snapshot.prop.length + snapshot.between.length;
    const propOk = prop === declaration.prop
      || (!snapshot.propIsRaw && this.matches(snapshot.start, snapshot.prop));
    const valueOk = value === declaration.value
      || (!snapshot.valueIsRaw && this.matches(valueStart, snapshot.value));

    if (!propOk || !valueOk) {
      return false;
    }

    if (prop !== declaration.prop) {
      this.replace(snapshot.start, snapshot.prop, prop);
      declaration.prop = prop;
    }

    if (value !== declaration.value) {
      this.replace(valueStart, snapshot.value, value);
      declaration.value = value;
    }

    return true;
  }

  /**
   * Replace every match of a pattern in the parameters of an at-rule.
   *
   * @param {object} atRule A postcss at-rule.
   * @param {RegExp} pattern A global pattern.
   * @param {string} replacement The replacement text.
   * @returns {boolean|null} `null` when nothing matches, `true` when the at-rule was edited, and `false` when the text
   * at its offsets is not what the model says (nothing is edited then).
   */
  replaceInAtRule(atRule, pattern, replacement) {
    const params = atRule.params.replace(pattern, replacement);

    if (params === atRule.params) {
      return null;
    }

    const snapshot = this.snapshot(atRule);

    if (!snapshot || typeof snapshot.afterName !== 'string' || atRule.raws.params !== undefined) {
      return false;
    }

    const paramsStart = snapshot.start + 1 + snapshot.name.length + snapshot.afterName.length;

    if (!this.matches(snapshot.start, `@${snapshot.name}`) || !this.matches(paramsStart, snapshot.params)) {
      return false;
    }

    this.replace(paramsStart, snapshot.params, params);
    atRule.params = params;

    return true;
  }

  /**
   * Insert a block comment in front of a node, on a line of its own with the node's indentation when the node starts
   * its line. Several insertions in front of one node keep their order. The postcss model gets the comment too.
   *
   * @param {object} node A postcss node.
   * @param {string} body The comment text.
   * @returns {void}
   * @throws {Error} When the node has no offset, which a parsed node always has.
   */
  insertCommentBefore(node, body) {
    const start = node.source?.start?.offset;

    if (!Number.isInteger(start) || start + this.base >= this.source.length) {
      throw new Error('A stylesheet node has no position, so a comment cannot be placed before it.');
    }

    const at = start + this.base;
    const lineStart = Math.max(this.source.lastIndexOf('\n', at - 1) + 1, this.base);
    const indent = this.source.slice(lineStart, at);
    let text = `/* ${body} */`;

    if (/^[ \t]*$/.test(indent)) {
      text += lineEnding(this.source) + indent;
    } else if (/\s$/.test(indent)) {
      text += ' ';
    }

    this.insertions.push({ at, text, order: this.insertions.length, node, body });
    node.before({ type: 'comment', text: body });
  }

  /**
   * The comments this run put in front of a node, oldest first.
   *
   * @param {object} node A postcss node.
   * @returns {string[]} The comment bodies.
   */
  insertedBefore(node) {
    return this.insertions.filter(item => item.node === node).map(item => item.body);
  }

  /**
   * Whether anything was edited.
   *
   * @returns {boolean} `true` when a replacement or a comment is recorded.
   */
  get edited() {
    return this.replacements.size > 0 || this.insertions.length > 0;
  }

  /**
   * The edited text: the original with every recorded edit spliced in. The text is parsed again and must equal the
   * model of the edits, also when no edit is recorded, so a transform that changed the postcss root without the
   * helpers fails here and never claims an edit that the file does not have.
   *
   * @returns {string} The text.
   * @throws {Error} When the edited text does not parse to the model, so no file is written from it.
   */
  print() {
    const operations = [
      ...[...this.replacements.values()].map(item => ({ at: item.start, end: item.end, text: item.text, order: -1 })),
      ...this.insertions.map(item => ({ at: item.at, end: item.at, text: item.text, order: item.order })),
    ].sort(spliceOrder);
    let output = this.source;

    for (const operation of operations) {
      output = output.slice(0, operation.at) + operation.text + output.slice(operation.end);
    }

    let reparsed;

    try {
      reparsed = this.parse(output);
    } catch (error) {
      throw new Error(`The edited stylesheet does not parse: ${error.message}`);
    }

    if (JSON.stringify(shapeOf(reparsed)) !== JSON.stringify(shapeOf(this.root))) {
      throw new Error('The edited stylesheet does not match the intended edits.');
    }

    return output;
  }
}
