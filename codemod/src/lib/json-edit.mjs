/**
 * Edits a JSON text, in practice `package.json`, by offset. The text outside the edited value is never printed
 * again, so key order, escapes (`é`, `\/`), number spelling (`1.0`, `1e3`), indentation, line endings, and
 * every other byte stay as they were.
 *
 * The parsed model of the file stays the source of truth for what the file means. Every edit is checked: the
 * edited text is parsed again and must equal the intended model, key order included. When the scan of the text and
 * the model disagree, nothing is edited and the caller reports a manual step.
 *
 * @module lib/json-edit
 */

/**
 * A node of the scanned text.
 *
 * @typedef {object} JsonNode
 * @property {'object'|'array'|'string'|'scalar'} type What the node is.
 * @property {number} start Offset of the first character.
 * @property {number} end Offset after the last character.
 * @property {JsonMember[]} [members] The members of an `object`, in text order.
 */

/**
 * One member of a scanned object.
 *
 * @typedef {object} JsonMember
 * @property {string} key The decoded key.
 * @property {number} keyStart Offset of the opening quote of the key.
 * @property {number} keyEnd Offset after the closing quote of the key.
 * @property {JsonNode} value The value.
 */

const WHITESPACE = /[ \t\n\r]/;

/**
 * Find the indentation of a JSON text: the leading whitespace of the first indented line.
 *
 * @param {string} source JSON text.
 * @returns {string|number} A tab character, or a number of spaces (2 when the text has no indented line).
 */
export function detectIndent(source) {
  const match = /^([ \t]+)\S/m.exec(source);

  if (!match) {
    return 2;
  }

  return match[1].startsWith('\t') ? '\t' : match[1].length;
}

/**
 * Where a new key goes among existing keys: in alphabetical order when the keys already are in that order, else
 * last.
 *
 * @param {string[]} keys The existing keys in order.
 * @param {string} name The new key.
 * @returns {number} The index the new key takes.
 */
export function memberPosition(keys, name) {
  const compare = (left, right) => left.localeCompare(right, 'en');
  const sorted = keys.every((key, index) => index === 0 || compare(keys[index - 1], key) <= 0);

  if (!sorted) {
    return keys.length;
  }

  const after = keys.findIndex(key => compare(key, name) > 0);

  return after === -1 ? keys.length : after;
}

/**
 * Scan a JSON text into a tree with offsets. The text must be valid JSON, as `JSON.parse` checked before.
 *
 * @param {string} text JSON text.
 * @returns {JsonNode|null} The root node, or `null` when the scan does not reach the end of the text cleanly.
 */
export function scanJson(text) {
  let position = 0;

  const skip = () => {
    while (position < text.length && WHITESPACE.test(text[position])) {
      position += 1;
    }
  };

  const string = () => {
    const start = position;

    position += 1;

    while (position < text.length && text[position] !== '"') {
      position += text[position] === '\\' ? 2 : 1;
    }

    position += 1;

    return { type: 'string', start, end: position };
  };

  const value = () => {
    skip();

    const start = position;

    if (text[position] === '"') {
      return string();
    }

    if (text[position] === '{') {
      const node = { type: 'object', start, end: 0, members: [] };

      position += 1;
      skip();

      while (text[position] !== '}') {
        if (text[position] !== '"' || position >= text.length) {
          throw new Error('unexpected character in an object');
        }

        const key = string();

        skip();

        if (text[position] !== ':') {
          throw new Error('expected a colon');
        }

        position += 1;
        node.members.push({
          key: JSON.parse(text.slice(key.start, key.end)),
          keyStart: key.start,
          keyEnd: key.end,
          value: value(),
        });
        skip();

        if (text[position] === ',') {
          position += 1;
          skip();
        }
      }

      position += 1;
      node.end = position;

      return node;
    }

    if (text[position] === '[') {
      position += 1;
      skip();

      while (text[position] !== ']') {
        if (position >= text.length) {
          throw new Error('unterminated array');
        }

        value();
        skip();

        if (text[position] === ',') {
          position += 1;
          skip();
        }
      }

      position += 1;

      return { type: 'array', start, end: position };
    }

    while (position < text.length && !/[,}\] \t\n\r]/.test(text[position])) {
      position += 1;
    }

    return { type: 'scalar', start, end: position };
  };

  try {
    const root = value();

    skip();

    return position === text.length ? root : null;
  } catch {
    return null;
  }
}

/**
 * The last member of an object node with a key, which is the one `JSON.parse` keeps.
 *
 * @param {JsonNode|undefined} node An `object` node.
 * @param {string} key The key.
 * @returns {JsonMember|undefined} The member.
 */
function lastMember(node, key) {
  return node?.type === 'object' ? [...node.members].reverse().find(member => member.key === key) : undefined;
}

/**
 * The leading white space of the line that holds an offset.
 *
 * @param {string} text The text.
 * @param {number} offset An offset in the text.
 * @returns {string} The indentation.
 */
function lineIndent(text, offset) {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;

  return /^[ \t]*/.exec(text.slice(lineStart))[0];
}

/**
 * A JSON text with its parsed model, edited by offset.
 */
export class JsonDocument {
  /**
   * @param {string} text The file text.
   * @param {object} model The value `JSON.parse` returned for the text. The edits keep it up to date.
   */
  constructor(text, model) {
    this.text = text;
    this.model = model;
    this.eol = text.includes('\r\n') ? '\r\n' : '\n';
    this.unit = detectIndent(text);
    this.multiline = text.trim().includes('\n');
  }

  /**
   * Check an edited text against the intended model and, when they agree, keep both.
   *
   * @param {string} text The edited text.
   * @param {(model: object) => void} mutate Applies the edit to a model. It runs on a copy first, then on the
   * real model.
   * @returns {boolean} `true` when the edit was applied.
   */
  commit(text, mutate) {
    const intended = JSON.parse(JSON.stringify(this.model));

    mutate(intended);

    try {
      if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(intended)) {
        return false;
      }
    } catch {
      return false;
    }

    mutate(this.model);
    this.text = text;

    return true;
  }

  /**
   * Replace a string value, such as a version range.
   *
   * @param {string} section The top-level object (`dependencies`).
   * @param {string} name The key inside it.
   * @param {string} value The new string.
   * @returns {boolean} `true` when the text was edited. `false` leaves the text and the model as they were.
   */
  setString(section, name, value) {
    const root = scanJson(this.text);
    const member = lastMember(lastMember(root, section)?.value, name);

    if (!member || member.value.type !== 'string') {
      return false;
    }

    const before = this.text.slice(0, member.value.start);
    const text = `${before}${JSON.stringify(value)}${this.text.slice(member.value.end)}`;

    return this.commit(text, (model) => {
      model[section][name] = value;
    });
  }

  /**
   * Add a string member to a top-level object. The key goes in alphabetical order when the keys already are, and
   * last otherwise. A missing object is created before `devDependencies`, or last. The new line copies the
   * indentation, separators, and line ending of its neighbors.
   *
   * @param {string} section The top-level object (`dependencies`).
   * @param {string} name The new key.
   * @param {string} value The string value.
   * @returns {boolean} `true` when the text was edited. `false` leaves the text and the model as they were.
   */
  addMember(section, name, value) {
    const root = scanJson(this.text);

    if (!root || root.type !== 'object') {
      return false;
    }

    const holder = lastMember(root, section);
    const text = holder ? this.insertInto(holder.value, Object.keys(this.model[section] ?? {}), name, value)
      : this.insertSection(root, section, name, value);

    if (text === null) {
      return false;
    }

    return this.commit(text, (model) => {
      if (holder) {
        const keys = Object.keys(model[section]);
        const index = memberPosition(keys, name);
        const entries = Object.entries(model[section]);

        entries.splice(index, 0, [name, value]);
        Object.keys(model[section]).forEach(key => delete model[section][key]);
        entries.forEach(([key, entry]) => {
          model[section][key] = entry;
        });

        return;
      }

      const entries = Object.entries(model);
      const before = entries.findIndex(([key]) => key === 'devDependencies');

      entries.splice(before === -1 ? entries.length : before, 0, [section, { [name]: value }]);
      Object.keys(model).forEach(key => delete model[key]);
      entries.forEach(([key, entry]) => {
        model[key] = entry;
      });
    });
  }

  /**
   * The member text and the separators that a new member of an object needs, copied from its neighbors.
   *
   * @param {JsonNode} node The `object` node.
   * @returns {{colon: string, separator: string}} The text between a key and its value, and between two members
   * (the comma included).
   */
  styleOf(node) {
    const { members } = node;
    const [first] = members;
    const fallback = this.multiline ? ': ' : ':';
    const colon = first ? this.text.slice(first.keyEnd, first.value.start) : fallback;

    if (members.length >= 2) {
      return { colon, separator: this.text.slice(members[0].value.end, members[1].keyStart) };
    }

    if (first && this.text.slice(node.start, first.keyStart).includes('\n')) {
      return { colon, separator: `,${this.eol}${lineIndent(this.text, first.keyStart)}` };
    }

    return { colon, separator: colon.includes(' ') ? ', ' : ',' };
  }

  /**
   * Text of an object that holds one member, laid out like the document.
   *
   * @param {string} memberText The member.
   * @param {string} baseIndent The indentation of the line that holds the opening brace.
   * @returns {string} The object text.
   */
  objectWith(memberText, baseIndent) {
    if (!this.multiline) {
      return `{${memberText}}`;
    }

    const unit = typeof this.unit === 'string' ? this.unit : ' '.repeat(this.unit);

    return `{${this.eol}${baseIndent}${unit}${memberText}${this.eol}${baseIndent}}`;
  }

  /**
   * Insert a member into an existing object node.
   *
   * @param {JsonNode} node The `object` node.
   * @param {string[]} keys The keys of the model for this object, in order.
   * @param {string} name The new key.
   * @param {string} value The string value.
   * @returns {string|null} The edited text, or `null` when the scan and the model disagree.
   */
  insertInto(node, keys, name, value) {
    if (node.type !== 'object' || node.members.length !== keys.length
      || node.members.some((member, index) => member.key !== keys[index])) {
      return null;
    }

    const { colon, separator } = this.styleOf(node);
    const member = `${JSON.stringify(name)}${colon}${JSON.stringify(value)}`;

    if (node.members.length === 0) {
      const inner = this.objectWith(member, lineIndent(this.text, node.start));

      return `${this.text.slice(0, node.start)}${inner}${this.text.slice(node.end)}`;
    }

    const index = memberPosition(keys, name);

    if (index === keys.length) {
      const last = node.members[index - 1];

      return `${this.text.slice(0, last.value.end)}${separator}${member}${this.text.slice(last.value.end)}`;
    }

    const next = node.members[index];

    return `${this.text.slice(0, next.keyStart)}${member}${separator}${this.text.slice(next.keyStart)}`;
  }

  /**
   * Insert a new top-level object that holds one member, before `devDependencies` or last.
   *
   * @param {JsonNode} root The root `object` node.
   * @param {string} section The new top-level key.
   * @param {string} name The key inside it.
   * @param {string} value The string value.
   * @returns {string|null} The edited text, or `null` when the scan and the model disagree.
   */
  insertSection(root, section, name, value) {
    const keys = Object.keys(this.model);

    if (root.members.length !== keys.length || root.members.some((member, index) => member.key !== keys[index])) {
      return null;
    }

    const { colon, separator } = this.styleOf(root);
    const unit = typeof this.unit === 'string' ? this.unit : ' '.repeat(this.unit);
    const baseIndent = root.members.length > 0 ? lineIndent(this.text, root.members[0].keyStart) : unit;
    const inner = `${JSON.stringify(name)}${colon}${JSON.stringify(value)}`;
    const member = `${JSON.stringify(section)}${colon}${this.objectWith(inner, baseIndent)}`;

    if (root.members.length === 0) {
      return `${this.text.slice(0, root.start)}${this.objectWith(member, '')}${this.text.slice(root.end)}`;
    }

    const before = keys.indexOf('devDependencies');

    if (before === -1) {
      const last = root.members[root.members.length - 1];

      return `${this.text.slice(0, last.value.end)}${separator}${member}${this.text.slice(last.value.end)}`;
    }

    const next = root.members[before];

    return `${this.text.slice(0, next.keyStart)}${member}${separator}${this.text.slice(next.keyStart)}`;
  }
}
