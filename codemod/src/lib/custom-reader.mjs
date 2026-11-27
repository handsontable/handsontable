/**
 * Finds the code that may read an option the tool is about to delete or move. A rule that removes `correctFormat`
 * is safe for the built-in cell types, which ignore it. A custom editor, renderer, or validator can still read it
 * (`this.correctFormat` in a validator, `cellProperties.datePickerConfig` in an editor), so a rule that asks for
 * this check reports instead of editing when it cannot rule that code out.
 *
 * The check is one question: could custom code read this option of this option object or wrapper element? It says
 * yes (and names what it saw) when:
 * - the object, or an enclosing option object or wrapper element, sets `editor`, `renderer`, or `validator` to
 *   anything that is not a built-in name (a function, an identifier, a name the project registered), or sets a
 *   `type` that is not a built-in cell type name;
 * - the object has a spread or a computed key that the tool cannot read, since either can carry any of those;
 * - the object, or an enclosing one, sets `cells`, `cell`, `afterGetCellMeta`, or `beforeGetCellMeta`, and what it holds
 *   sets or may set one of them: a function that returns an object with a custom `editor`, `renderer`, `validator`,
 *   or `type`, or something the tool cannot see; a hook that assigns one to the cell meta, by assignment or by a call
 *   (`setCellMeta()`, `Object.defineProperty()`, `Object.assign()`), or that makes such a call with a key, a
 *   descriptor, or a source object it cannot read (a variable, a spread, a computed key); or a function from another
 *   file;
 * - the file registers a cell type, editor, renderer, or validator under a built-in name again; or
 * - the file reads the option as a member (`.correctFormat`, `['correctFormat']`), destructures it, or tests it with `in`.
 *   A write is not a read: the target of a plain assignment, `delete`, and a destructuring or `for` head target
 *   (`isWriteOnly()`), and an object literal key, never count. A compound assignment and `++` read the value.
 *
 * Code in another file is out of reach: a cell type that another module registers under its own name is custom
 * (its name is not built in), but a reader attached to a grid in another file is not seen.
 *
 * @module lib/custom-reader
 */

import {
  attributeName,
  calleeName,
  isWriteOnly,
  lineOfNode,
  memberName,
  propertyName,
  stringValue,
  unwrapNode,
  unwrapPath,
} from './ast.mjs';
import { lookup } from './scope.mjs';
import { BUILT_IN_CELL_TYPES, BUILT_IN_EDITORS, BUILT_IN_RENDERERS, BUILT_IN_VALIDATORS } from './option-objects.mjs';

/**
 * Something that may read the option.
 *
 * @typedef {object} Reader
 * @property {'editor'|'renderer'|'validator'|'type'|'spread'|'computed'|'registered'|'read'|'cells'} kind What it is.
 * @property {number|undefined} line Line of the code that makes it a reader.
 * @property {'own'|'enclosing'} [scope] Whether the object or element itself holds it, or one that encloses it.
 */

const BUILT_INS = new Map([
  ['editor', BUILT_IN_EDITORS],
  ['renderer', BUILT_IN_RENDERERS],
  ['validator', BUILT_IN_VALIDATORS],
  ['type', BUILT_IN_CELL_TYPES],
]);

/**
 * The React wrapper takes a component or function for the editor and the renderer under these props. They are
 * always the project's own.
 */
const WRAPPER_ALIASES = new Map([['hotEditor', 'editor'], ['hotRenderer', 'renderer']]);
const REGISTER_CALLEES = new Set(['registerCellType', 'registerEditor', 'registerRenderer', 'registerValidator']);
const MEMBER_TYPES = new Set(['MemberExpression', 'OptionalMemberExpression']);
const SPREADS = new Set(['SpreadElement', 'SpreadProperty', 'ExperimentalSpreadProperty']);
const MAX_SPREAD_DEPTH = 4;
const CELL_HOOKS = new Set(['cells', 'cell', 'afterGetCellMeta', 'beforeGetCellMeta']);
const FUNCTION_NODES = new Set([
  'FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration', 'ObjectMethod',
]);
const SKIPPED_KEYS = new Set(['loc', 'tokens', 'comments', 'extra', 'leadingComments', 'trailingComments', 'original']);

/**
 * Whether the value of `editor`, `renderer`, `validator`, or `type` is something the project wrote or registered.
 * A built-in name, `undefined`, `null`, `false` (no editor), and a regular expression (a validator that cannot
 * read the option) are not custom. A function, an identifier, a member read, a call, and a bare attribute are.
 *
 * @param {string} key `editor`, `renderer`, `validator`, or `type`.
 * @param {object|null|undefined} value The value node, `null` for a bare attribute.
 * @param {Set<string>} registered Built-in names that the file registers again.
 * @returns {boolean} `true` when the value is the project's own.
 */
function isCustomValue(key, value, registered) {
  const node = value ? unwrapNode(value) : null;

  if (!node) {
    return true;
  }

  if (node.type === 'ConditionalExpression') {
    return isCustomValue(key, node.consequent, registered) || isCustomValue(key, node.alternate, registered);
  }

  const text = stringValue(node);

  if (text !== null) {
    return !BUILT_INS.get(key).has(text) || registered.has(text);
  }

  const empty = (node.type === 'Identifier' && node.name === 'undefined') || node.type === 'NullLiteral'
    || node.type === 'RegExpLiteral' || (node.type === 'Literal' && (node.value === null || node.regex))
    || ((node.type === 'BooleanLiteral' || node.type === 'Literal') && node.value === false);

  return !empty;
}

/**
 * Call a function for a node and every node below it.
 *
 * @param {object} node An AST node.
 * @param {(node: object) => void} visit Called for each node.
 * @returns {void}
 */
function walkNodes(node, visit) {
  visit(node);

  for (const key of Object.keys(node)) {
    const value = node[key];

    if (SKIPPED_KEYS.has(key) || !value || typeof value !== 'object') {
      continue;
    }

    for (const child of Array.isArray(value) ? value : [value]) {
      if (child && typeof child.type === 'string') {
        walkNodes(child, visit);
      }
    }
  }
}

/**
 * Whether the value a function returns, or an arrow returns as its body, could carry a reader: anything but a plain
 * object literal, `undefined`, `null`, or another literal. A conditional or a logical expression is read branch by
 * branch. An object literal that has a spread or a computed key can carry one too.
 *
 * @param {object|null|undefined} expression The returned expression, `null` for a bare `return`.
 * @returns {boolean} `true` when the tool cannot tell the value holds no reader.
 */
function returnsUnknown(expression) {
  const node = expression ? unwrapNode(expression) : null;

  if (!node) {
    return false;
  }

  switch (node.type) {
    case 'ConditionalExpression':
      return returnsUnknown(node.consequent) || returnsUnknown(node.alternate);
    case 'LogicalExpression':
      return returnsUnknown(node.left) || returnsUnknown(node.right);
    case 'ObjectExpression':
      return node.properties.some(property => SPREADS.has(property.type)
        || (property.computed && stringValue(property.key) === null));
    case 'Identifier':
      return node.name !== 'undefined';
    case 'UnaryExpression':
      return node.operator !== 'void';
    default:
      return !/Literal$/.test(node.type);
  }
}

/**
 * Whether a node is an object literal whose keys the tool can all read: no spread, and no computed key that is not a
 * string. Any other value may carry a reader.
 *
 * @param {object|null|undefined} node An expression node.
 * @returns {boolean} `true` for a fully readable object literal.
 */
function isReadableLiteral(node) {
  const target = node ? unwrapNode(node) : null;

  return target?.type === 'ObjectExpression' && !target.properties.some(property => SPREADS.has(property.type)
    || (property.computed && stringValue(property.key) === null));
}

/**
 * Whether a call installs a reader on the cell meta, or may. As in the rest of the check, what the tool cannot read
 * counts as a reader:
 *
 * - `setCellMeta(row, col, key, value)` and `Reflect.set(meta, key, value)`: a key that is not a string literal, or a
 *   literal reader key with a custom value.
 * - `Object.defineProperty(meta, key, descriptor)` and `Reflect.defineProperty()`: a key that is not a literal, or
 *   a reader key whose descriptor is not a readable object literal, or whose `value` is custom (a getter counts as a
 *   function). A literal key that is no reader key is no reader, whatever the descriptor holds.
 * - `Object.defineProperties(meta, descriptors)`, `Object.assign(meta, ...sources)`, and `setCellMetaObject(row, col,
 *   settings)`: an argument that is not a readable object literal. The keys of a literal are read by the walk over
 *   the whole hook.
 *
 * @param {object} call A `CallExpression` or `OptionalCallExpression` node.
 * @param {(key: string, value: object|null) => boolean} isReader Whether a key and a value make a reader.
 * @param {(key: string) => boolean} isReaderKey Whether a key names an editor, a renderer, a validator, or a type.
 * @returns {boolean} `true` when the call sets a custom reader, or may.
 */
function installsReader(call, isReader, isReaderKey) {
  const callee = unwrapNode(call.callee);
  const method = calleeName(callee);
  const host = MEMBER_TYPES.has(callee.type) ? unwrapNode(callee.object) : null;
  const hostName = host?.type === 'Identifier' ? host.name : null;
  const args = call.arguments;
  const keyOf = argument => (argument ? stringValue(argument) : null);

  if (method === 'setCellMeta' || (hostName === 'Reflect' && method === 'set')) {
    const at = method === 'setCellMeta' ? 2 : 1;
    const key = keyOf(args[at]);

    return key === null || isReader(key, args[at + 1] ?? null);
  }

  if (method === 'setCellMetaObject') {
    return !isReadableLiteral(args[2]);
  }

  if (hostName === 'Object' && method === 'assign') {
    return args.slice(1).some(source => !isReadableLiteral(source));
  }

  if (hostName === 'Object' && method === 'defineProperties') {
    return !isReadableLiteral(args[1]);
  }

  if ((hostName === 'Object' || hostName === 'Reflect') && method === 'defineProperty') {
    const key = keyOf(args[1]);

    if (key === null) {
      return true;
    }

    if (!isReaderKey(key)) {
      return false;
    }

    if (!isReadableLiteral(args[2])) {
      return true;
    }

    return unwrapNode(args[2]).properties.some((property) => {
      const field = propertyName(property);

      if (field === 'value') {
        return isReader(key, property.value);
      }

      return field === 'get' && isReader(key, { type: 'FunctionExpression' });
    });
  }

  return false;
}

/**
 * Create the reader finder of one file.
 *
 * @param {object} args The file.
 * @param {object} args.j The jscodeshift API.
 * @param {object} args.root The parsed Collection.
 * @param {ReturnType<import('./resolve.mjs').createHop>} args.resolver The one-hop resolver of the file.
 * @param {Set<object>} args.optionNodes The `ObjectExpression` nodes that are option objects. An enclosing object
 * that is not one is not an option holder, so its keys say nothing.
 * @returns {{ofObject: (path: object) => Reader|null, ofElement: (path: object) => Reader|null,
 * reads: (name: string) => Reader|null, readsNested: (parent: string, child: string) => Reader|null}} The finder.
 */
export function createReaderFinder({ j, root, resolver, optionNodes }) {
  let registered = null;
  let members = null;
  let tests = null;
  const reads = new Map();

  /**
   * Every member expression of the file, listed once.
   *
   * @returns {object[]} NodePaths.
   */
  const memberPaths = () => {
    members = members ?? [j.MemberExpression, j.OptionalMemberExpression].filter(Boolean)
      .flatMap(type => root.find(type).paths());

    return members;
  };

  /**
   * Every `'key' in object` test of the file, listed once. It reads the key without a member expression.
   *
   * @returns {object[]} NodePaths of the `BinaryExpression`s.
   */
  const inChecks = () => {
    tests = tests ?? root.find(j.BinaryExpression, { operator: 'in' }).paths();

    return tests;
  };

  /**
   * The built-in names the file registers again, with the line of the first such call.
   *
   * @returns {{names: Set<string>, line: Map<string, number|undefined>}} The names.
   */
  const registrations = () => {
    if (registered === null) {
      registered = { names: new Set(), line: new Map() };

      [...root.find(j.CallExpression).paths(), ...root.find(j.OptionalCallExpression).paths()].forEach((path) => {
        const name = REGISTER_CALLEES.has(calleeName(path.node.callee)) ? stringValue(path.node.arguments[0]) : null;

        if (name !== null) {
          registered.names.add(name);
          registered.line.set(name, registered.line.get(name) ?? lineOfNode(path.node));
        }
      });
    }

    return registered;
  };

  /**
   * The function that a `cells` option or a meta hook holds, when the file shows it: written there, wrapped in
   * `useCallback()`, or named by a `const` or a function declaration of the file.
   *
   * @param {object|null|undefined} path NodePath of the value.
   * @param {object} node The value node, or the method.
   * @returns {object|null} The function node, or `null` when it cannot be seen.
   */
  const functionOfHook = (path, node) => {
    const target = unwrapNode(node);

    if (FUNCTION_NODES.has(target.type)) {
      return target;
    }

    const callback = target.arguments?.[0];

    if ((target.type === 'CallExpression' || target.type === 'OptionalCallExpression')
      && calleeName(target.callee) === 'useCallback' && callback && FUNCTION_NODES.has(callback.type)) {
      return callback;
    }

    if (target.type !== 'Identifier' || !path) {
      return null;
    }

    const binding = lookup(unwrapPath(path), target.name, 'value');

    if (binding?.kind === 'function') {
      return binding.node;
    }

    return binding?.kind === 'const' && binding.init ? functionOfHook(null, binding.init) : null;
  };

  /**
   * Whether a `cells` option or a meta hook sets, or may set, a reader: an `editor`, `renderer`, `validator`, or `type`
   * that is not a built-in name, as a key of an object or an assignment to the cell meta anywhere in it. A `cells`
   * function also counts when what it returns could carry one. A function or an object the file does not show counts.
   *
   * @param {{name: string, value: object|null, node: object, path?: object}} entry The key or attribute.
   * @returns {boolean} `true` when a reader is possible.
   */
  const mayAssignReader = ({ name, value, node, path }) => {
    const { names } = registrations();
    const holder = node.type === 'ObjectMethod' || !value ? node : unwrapNode(value);
    const code = name === 'cell' ? holder : functionOfHook(path, holder ?? node);
    let found = false;

    if (!code || (name === 'cell' && !['ArrayExpression', 'ObjectExpression'].includes(code.type))) {
      return true;
    }

    const isReaderKey = key => BUILT_INS.has(WRAPPER_ALIASES.get(key) ?? key);
    const isReader = (key, valueNode) => {
      const kind = WRAPPER_ALIASES.get(key) ?? key;

      return BUILT_INS.has(kind) && isCustomValue(kind, valueNode, names);
    };

    walkNodes(code, (current) => {
      if (found) {
        return;
      }

      if (['ObjectProperty', 'Property'].includes(current.type)) {
        const key = propertyName(current);

        found = key !== null && isReader(key, current.value);
      } else if (current.type === 'ObjectMethod') {
        found = current !== code && isReader(propertyName(current) ?? '', { type: 'FunctionExpression' });
      } else if (current.type === 'AssignmentExpression' && current.operator === '='
        && MEMBER_TYPES.has(current.left.type)) {
        found = isReader(memberName(current.left) ?? '', current.right);
      } else if (current.type === 'CallExpression' || current.type === 'OptionalCallExpression') {
        found = installsReader(current, isReader, isReaderKey);
      } else if (current.type === 'ObjectExpression') {
        // A spread or a computed key can carry any key of the cell meta, an editor among them.
        found = !isReadableLiteral(current);
      } else if (name === 'cells' && FUNCTION_NODES.has(current.type) && current.type !== 'FunctionDeclaration') {
        found = current.body.type === 'BlockStatement' ? false : returnsUnknown(current.body);
      } else if (name === 'cells' && current.type === 'ReturnStatement') {
        found = returnsUnknown(current.argument);
      }
    });

    return found;
  };

  /**
   * The reader a list of properties or attributes gives, own keys only.
   *
   * @param {Array<{name: string|null, value: object|null, node: object}>} entries The keys and values.
   * @returns {Reader|null} The first reader, or `null`.
   */
  const ofEntries = (entries) => {
    const { names, line } = registrations();

    for (const { name: written, value, node } of entries) {
      const name = WRAPPER_ALIASES.get(written) ?? written;

      if (!BUILT_INS.has(name)) {
        continue;
      }

      if (isCustomValue(name, value, names)) {
        const text = stringValue(value ? unwrapNode(value) : null);
        const again = text !== null && names.has(text) && BUILT_INS.get(name).has(text);

        return again ? { kind: 'registered', line: line.get(text) } : { kind: name, line: lineOfNode(node) };
      }
    }

    const hook = entries.find(entry => CELL_HOOKS.has(entry.name) && mayAssignReader(entry));

    return hook ? { kind: 'cells', line: lineOfNode(hook.node) } : null;
  };

  /**
   * The reader an object literal gives: its own keys, the objects its spreads resolve to, and the spreads and
   * computed keys that cannot be read.
   *
   * @param {object} objectPath NodePath of an `ObjectExpression`.
   * @param {number} depth Recursion guard for a spread of a spread.
   * @param {boolean} unreadable Whether a spread or a computed key that cannot be read counts as a reader. It does
   * for the object itself and not for an object that encloses it: a spread of an unknown object on the settings
   * of a whole grid is too common to say anything about one column.
   * @returns {Reader|null} The reader, or `null`.
   */
  const ofLiteral = (objectPath, depth = 0, unreadable = true) => {
    const entries = [];

    for (const [index, node] of objectPath.node.properties.entries()) {
      if (SPREADS.has(node.type)) {
        continue;
      }

      const name = propertyName(node);

      if (name === null) {
        if (unreadable) {
          return { kind: 'computed', line: lineOfNode(node) };
        }

        continue;
      }

      entries.push({
        name,
        value: node.type === 'ObjectMethod' ? { type: 'FunctionExpression' } : node.value,
        node,
        path: node.type === 'ObjectMethod' ? null : objectPath.get('properties', index, 'value'),
      });
    }

    const own = ofEntries(entries);

    if (own) {
      return own;
    }

    const spreads = resolver.spreadsOf(objectPath, { exact: true });

    if (spreads === null || depth >= MAX_SPREAD_DEPTH) {
      if (!unreadable) {
        return null;
      }

      const spread = objectPath.node.properties.find(node => SPREADS.has(node.type));

      return { kind: 'spread', line: lineOfNode(spread) };
    }

    for (const spread of spreads) {
      const found = ofLiteral(spread, depth + 1, unreadable);

      if (found) {
        return found;
      }
    }

    return null;
  };

  /**
   * The reader the attributes of one wrapper element give, spreads included.
   *
   * @param {object} openingPath NodePath of a `JSXOpeningElement`.
   * @param {boolean} unreadable Whether a spread that cannot be read counts as a reader (see `ofLiteral`).
   * @returns {Reader|null} The reader, or `null`.
   */
  const ofAttributes = (openingPath, unreadable = true) => {
    const entries = [];

    for (const [index, attribute] of openingPath.node.attributes.entries()) {
      if (attribute.type === 'JSXSpreadAttribute') {
        const spread = resolver.hop(openingPath.get('attributes', index, 'argument'), { exact: true });
        const found = spread?.node.type === 'ObjectExpression' ? ofLiteral(spread, 1, unreadable)
          : unreadable && { kind: 'spread', line: lineOfNode(attribute) };

        if (found) {
          return found;
        }

        continue;
      }

      const value = attribute.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : attribute.value;

      const valuePath = attribute.value?.type === 'JSXExpressionContainer'
        ? openingPath.get('attributes', index, 'value', 'expression') : null;

      entries.push({ name: attributeName(attribute), value, node: attribute, path: valuePath });
    }

    return ofEntries(entries);
  };

  /**
   * The reader an enclosing option object or wrapper element gives. Merged settings reach every cell below them.
   *
   * @param {object} path NodePath to start from. Its own node is not read.
   * @returns {Reader|null} The reader, or `null`.
   */
  const ofAncestors = (path) => {
    for (let current = path.parent; current; current = current.parent) {
      const { type } = current.node;
      let found = null;

      if (type === 'ObjectExpression' && optionNodes.has(current.node)) {
        found = ofLiteral(current, 0, false);
      } else if (type === 'JSXOpeningElement') {
        found = ofAttributes(current, false);
      } else if (type === 'JSXElement') {
        found = ofAttributes(current.get('openingElement'), false);
      }

      if (found) {
        return { ...found, scope: 'enclosing' };
      }
    }

    return null;
  };

  /**
   * The line of the first read of `<name>`: a member read or a destructured key.
   *
   * @param {string} name The option name.
   * @returns {Reader|null} The reader, or `null`.
   */
  const readsOf = (name) => {
    if (!reads.has(name)) {
      let line = null;

      memberPaths().forEach((path) => {
        if (line === null && memberName(path.node) === name && !isWriteOnly(path)) {
          line = lineOfNode(path.node) ?? 0;
        }
      });

      root.find(j.ObjectPattern).forEach((path) => {
        const hit = path.node.properties
          .find(property => property.type !== 'RestElement' && propertyName(property) === name);

        if (line === null && hit) {
          line = lineOfNode(hit) ?? 0;
        }
      });

      inChecks().forEach((path) => {
        if (line === null && stringValue(path.node.left) === name) {
          line = lineOfNode(path.node) ?? 0;
        }
      });

      reads.set(name, line === null ? null : { kind: 'read', line: line || undefined });
    }

    return reads.get(name);
  };

  /**
   * The first read of `<parent>.<child>` anywhere: `numericFormat.culture`, `cellProperties.numericFormat?.culture`,
   * `(x.numericFormat ?? {}).culture`, and a destructuring of the child out of the parent, through `as` and
   * parentheses.
   *
   * @param {string} parentKey The option, for example `numericFormat`.
   * @param {string} childKey The nested key, for example `culture`.
   * @returns {Reader|null} The reader, or `null`.
   */
  const readsNested = (parentKey, childKey) => {
    const key = `${parentKey}.${childKey}`;

    if (reads.has(key)) {
      return reads.get(key);
    }

    const isParent = (expression) => {
      let node = expression ? unwrapNode(expression) : null;

      while (node?.type === 'LogicalExpression' && (node.operator === '??' || node.operator === '||')) {
        node = unwrapNode(node.left);
      }

      if (!node) {
        return false;
      }

      return node.type === 'Identifier' ? node.name === parentKey
        : MEMBER_TYPES.has(node.type) && memberName(node) === parentKey;
    };
    let hit = null;

    memberPaths().forEach((path) => {
      if (hit === null && memberName(path.node) === childKey && isParent(path.node.object) && !isWriteOnly(path)) {
        hit = path.node;
      }
    });

    inChecks().forEach((path) => {
      if (hit === null && stringValue(path.node.left) === childKey && isParent(path.node.right)) {
        hit = path.node;
      }
    });

    root.find(j.ObjectPattern).forEach((path) => {
      const names = path.node.properties.map(property => (property.type === 'RestElement' ? null
        : propertyName(property)));

      if (hit !== null || !names.includes(childKey)) {
        return;
      }

      const owner = path.parent?.node;
      const matches = (owner?.type === 'VariableDeclarator' && owner.id === path.node && isParent(owner.init))
        || (owner?.type === 'AssignmentExpression' && owner.left === path.node && isParent(owner.right))
        || ((owner?.type === 'ObjectProperty' || owner?.type === 'Property') && owner.value === path.node
          && propertyName(owner) === parentKey);

      if (matches) {
        hit = path.node;
      }
    });

    const reader = hit === null ? null : { kind: 'read', line: lineOfNode(hit) };

    reads.set(key, reader);

    return reader;
  };

  return {
    ofObject: (objectPath) => {
      const own = ofLiteral(unwrapPath(objectPath));

      return own ? { ...own, scope: 'own' } : ofAncestors(objectPath);
    },
    ofElement: (openingPath) => {
      const own = ofAttributes(openingPath);

      return own ? { ...own, scope: 'own' } : ofAncestors(openingPath);
    },
    reads: readsOf,
    readsNested,
  };
}

/**
 * Say what a reader is, for a sentence that starts with "Check". The text names no line: a TODO comment is
 * compared as text on the next run, and a line number moves when the edit of the first run changes the layout.
 *
 * @param {Reader} reader The reader.
 * @param {string} option The option name, for a reader that reads it.
 * @returns {string} A noun phrase.
 */
export function describeReader(reader, option) {
  const where = reader.scope === 'enclosing' ? 'of an enclosing object or element' : 'set next to it';

  switch (reader.kind) {
    case 'read':
      return `the code in this file that reads ${option}`;
    case 'spread':
      return 'the spread next to it that the tool cannot read';
    case 'computed':
      return 'the computed key next to it';
    case 'registered':
      return 'the built-in name that this file registers again';
    case 'cells':
      return `the cells option or the meta hook ${where} that can set an editor, a renderer, or a validator`;
    case 'type':
      return `the cell type ${where}`;
    default:
      return `the custom ${reader.kind} ${where}`;
  }
}

/**
 * The sentence that says where a reader is. It is for the report entry, not for the TODO comment.
 *
 * @param {Reader} reader The reader.
 * @param {number} [lineOffset] The zero-based line of the part in its file (a Vue `<script>` block does not start on
 * line 1), so the sentence names a line of the file, as the entry does.
 * @returns {string} A sentence with a leading space, or an empty string when the line is unknown.
 */
export function describeReaderLine(reader, lineOffset = 0) {
  return reader.line ? ` It is on line ${reader.line + lineOffset}.` : '';
}
