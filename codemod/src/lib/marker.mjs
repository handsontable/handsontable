import { enclosingAnchor, hasOwnLines } from './anchor.mjs';

const MEMBER_NODES = new Set(['ObjectProperty', 'ObjectMethod', 'Property', 'ClassProperty', 'ClassMethod']);
const JSX_ELEMENTS = new Set(['JSXElement', 'JSXOpeningElement']);
const JSX_PARENTS = new Set(['JSXElement', 'JSXFragment']);
const SKIPPED_KEYS = new Set(['loc', 'tokens', 'comments', 'extra', 'leadingComments', 'trailingComments']);
const ARRAYS = new WeakMap();

/**
 * The array literal that a marker target is an element of, when `markerTargets()` chose it as an array element.
 *
 * @param {object} node A node from the result of `markerTargets()`.
 * @returns {object|null} The `ArrayExpression` node, or `null` for any other target.
 */
export function arrayOfTarget(node) {
  return ARRAYS.get(node) ?? null;
}

/**
 * How deep a path sits in the tree.
 *
 * @param {object} path A NodePath.
 * @returns {number} The number of ancestors.
 */
function depthOf(path) {
  let depth = 0;

  for (let current = path.parent; current; current = current.parent) {
    depth += 1;
  }

  return depth;
}

/**
 * Whether an element of an array literal sits on lines of its own, so a comment before it does not land in the
 * middle of a line.
 *
 * @param {object} arrayNode The `ArrayExpression` node.
 * @param {object} node The element node.
 * @returns {boolean} `true` when no other element or bracket shares a line with it.
 */
function hasOwnArrayLines(arrayNode, node) {
  const list = arrayNode.elements;
  const index = list.indexOf(node);
  const before = list[index - 1]?.loc?.end.line ?? arrayNode.loc?.start.line;
  const after = list[index + 1]?.loc?.start.line ?? arrayNode.loc?.end.line;

  return Boolean(node.loc) && before < node.loc.start.line && after > node.loc.end.line;
}

/**
 * The first JSX element inside a path, in source order: the elements that no other element inside the path holds.
 *
 * @param {object} path NodePath to search below.
 * @returns {object|null} NodePath of the `JSXElement`, or `null` when the path holds none.
 */
function firstElementIn(path) {
  const found = [];
  const visit = (current) => {
    if (current.node.type === 'JSXElement') {
      found.push(current);

      return;
    }

    for (const key of Object.keys(current.node)) {
      const value = current.node[key];

      if (SKIPPED_KEYS.has(key) || !value || typeof value !== 'object') {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => item && typeof item.type === 'string' && visit(current.get(key, index)));
      } else if (typeof value.type === 'string') {
        visit(current.get(key));
      }
    }
  };

  visit(path);

  return found.sort((a, b) => (a.node.start ?? 0) - (b.node.start ?? 0))[0] ?? null;
}

/**
 * Where a comment about the code at a path can go without changing the code around it. From the path it climbs to
 * the first of:
 *
 * - a JSX attribute or element: the opening element, which `addJsTodo()` puts a JSX comment or a statement comment
 *   in front of. A child that is an expression container (`{ok && <HotTable />}`) stands for the element inside it, so
 *   the comment goes in front of the child and not on the element that holds it;
 * - a property, method, or class member on lines of its own;
 * - an array element on lines of its own;
 * - a statement or declaration, with its `export` wrapper.
 *
 * A comment never lands in the middle of a line of code, and never between `return` and the object it returns.
 *
 * The result lists every place on the way up, nearest first. The first one takes the comment. The others tell
 * whether a run already left the same comment further up: a comment that moves the printer to spread a one-line
 * object over several lines turns a property that had no line of its own into one that has, and the next run must
 * not add a second comment for it.
 *
 * @param {object} path NodePath to start from.
 * @returns {object[]} NodePaths of JSX elements and AST nodes for anything else, nearest first. Empty when nothing
 * fits.
 */
export function markerTargets(path) {
  const found = [];

  for (let current = path; current; current = current.parent) {
    const { node, parent } = current;

    if (node.type === 'JSXAttribute' && parent && JSX_ELEMENTS.has(parent.node.type)) {
      return [...found, parent];
    }

    if (JSX_ELEMENTS.has(node.type)) {
      return [...found, current];
    }

    if (node.type === 'JSXExpressionContainer' && parent && JSX_PARENTS.has(parent.node.type)
      && parent.node.children.includes(node)) {
      return [...found, firstElementIn(current) ?? parent];
    }

    if (MEMBER_NODES.has(node.type) && (parent?.node.type !== 'ObjectExpression' || hasOwnLines(parent.node, node))) {
      found.push(node);
    } else if (parent?.node.type === 'ArrayExpression' && hasOwnArrayLines(parent.node, node)) {
      ARRAYS.set(node, parent.node);
      found.push(node);
    } else if (/(?:Statement|Declaration)$/.test(node.type) && node.type !== 'BlockStatement') {
      // A block is no place for a comment about the line it opens: the comment would sit between a signature and its
      // body. The function or the statement that owns the block takes it.
      found.push(enclosingAnchor(current));

      return found;
    }
  }

  return found;
}

/**
 * Every node above a path where an earlier run could have left a marker for the code at the path: each statement,
 * declaration, class or object member, and array element on the way to the root. The printer spreads a one-line
 * object over several lines when a comment lands in it, so code that shared a line with its statement in the first run
 * has lines of its own in the second, and its nearest anchor is now a node inside the one the first run commented.
 * The layout only ever moves anchors inward, so the node the first run chose is always one of these.
 *
 * @param {object} path NodePath to start from.
 * @returns {object[]} AST nodes, nearest first.
 */
export function anchorsAbove(path) {
  const found = [];

  for (let current = path; current; current = current.parent) {
    const { node, parent } = current;
    const isStatement = /(?:Statement|Declaration)$/.test(node.type) && node.type !== 'BlockStatement';

    if (MEMBER_NODES.has(node.type) || parent?.node.type === 'ArrayExpression' || isStatement) {
      found.push(node, ...sharedLineSiblings(current));
    }
  }

  return found;
}

/**
 * The siblings before a node that end on the line it starts on, nearest first, and the ones that chain to them the
 * same way. When code shares a line with a statement, the first run puts its comment before the first of them (the
 * outermost node of the line, first in document order). The printer then spreads that first statement over lines, the
 * statement after it starts on the line where the first one ends, and the second run must look in front of the first.
 *
 * @param {object} path NodePath of a node that sits in a list (statements, members, elements).
 * @returns {object[]} The earlier siblings that share a line with the node or with one that chains to it.
 */
function sharedLineSiblings(path) {
  const list = path.parentPath?.value;
  const found = [];

  if (!Array.isArray(list)) {
    return found;
  }

  let next = path.node;

  for (let index = list.indexOf(path.node) - 1; index >= 0; index -= 1) {
    const sibling = list[index];

    if (!sibling?.loc || !next.loc || sibling.loc.end.line !== next.loc.start.line) {
      break;
    }

    found.push(sibling);
    next = sibling;
  }

  return found;
}

/**
 * Index the nodes of a parsed js part by the line they start on, so a marker for a report line finds its place in one
 * lookup. Only nodes from the original parse count: a node the run built has no position. Where several nodes start
 * on one line, the outermost one is kept: the statement or property that the line opens takes the comment, so a
 * function body on the same line as its signature never does. `markerTargets()` climbs from it to the anchor.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {(line: number, column?: number) => {targets: object[], above: object[]}} A function from a one-based line,
 * and a zero-based column that picks the node when several start on the line, to the marker targets, nearest first (see `markerTargets()`), and the nodes above them where an earlier run may have left the same
 * comment (see `anchorsAbove()`).
 */
export function createMarkerIndex(j, root) {
  const outermost = new Map();
  const outermostInBlock = new Map();
  const outermostAt = new Map();

  root.find(j.Node).forEach((path) => {
    const line = path.node.loc?.start?.line;

    if (!line || path.node.type === 'File' || path.node.type === 'Program') {
      return;
    }

    const depth = depthOf(path);
    const at = `${line}:${path.node.loc.start.column}`;

    if (!outermostAt.has(at) || outermostAt.get(at).depth > depth) {
      outermostAt.set(at, { path, depth });
    }

    if (!outermost.has(line) || outermost.get(line).depth > depth) {
      outermost.set(line, { path, depth });
    }

    const known = outermostInBlock.get(line);

    if (path.node.type !== 'BlockStatement' && (!known || known.depth > depth)) {
      outermostInBlock.set(line, { path, depth });
    }
  });

  return (line, column) => {
    if (!outermost.has(line)) {
      return { targets: [], above: [] };
    }

    // A JSX element of a line that holds several of them is found by its column. A column that no node starts at (the
    // text moved) falls back to the line.
    const exact = Number.isInteger(column) ? outermostAt.get(`${line}:${column}`) : undefined;
    const { path } = exact ?? outermost.get(line);
    const targets = markerTargets(path);

    // A block that opens the line has no statement above it to take the comment (`{ a(); b(); }` among the statements
    // of a program or of another block, whose parents are no anchors), so the first statement inside it that starts on
    // the line takes it, as the outermost node of the line would have.
    if (targets.length === 0 && outermostInBlock.has(line)) {
      const inner = outermostInBlock.get(line).path;

      return { targets: markerTargets(inner), above: anchorsAbove(inner) };
    }

    return { targets, above: anchorsAbove(path) };
  };
}

/**
 * Find the postcss node a CSS marker goes before: the first node in document order that starts on the line. A rule
 * comes before the declarations inside it, so `a { color: red }` gets one comment before the rule.
 *
 * @param {object} root The postcss Root.
 * @param {number} line One-based line.
 * @returns {object|null} The node, or `null`.
 */
export function cssTargetAt(root, line) {
  let found = null;

  root.walk((node) => {
    if (node.type !== 'comment' && node.source?.start?.line === line) {
      found = node;

      return false;
    }

    return true;
  });

  return found;
}
