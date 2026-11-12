import { enclosingAnchor, hasOwnLines } from './anchor.mjs';

const MEMBER_NODES = new Set(['ObjectProperty', 'ObjectMethod', 'Property', 'ClassProperty', 'ClassMethod']);
const JSX_ELEMENTS = new Set(['JSXElement', 'JSXOpeningElement']);
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
 * Where a comment about the code at a path can go without changing the code around it. From the path it climbs to
 * the first of:
 *
 * - a JSX attribute or element: the opening element, which `addJsTodo()` puts a JSX comment or a statement comment
 *   in front of;
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
 * Index the nodes of a parsed js part by the line they start on, so a marker for a report line finds its place in one
 * lookup. Only nodes from the original parse count: a node the run built has no position. Where several nodes start
 * on one line, the outermost one is kept: the statement or property that the line opens takes the comment, so a
 * function body on the same line as its signature never does. `markerTargets()` climbs from it to the anchor.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {(line: number) => object[]} A function from a one-based line to the marker targets, nearest first (see
 * `markerTargets()`).
 */
export function createMarkerIndex(j, root) {
  const outermost = new Map();

  root.find(j.Node).forEach((path) => {
    const line = path.node.loc?.start?.line;

    if (!line || path.node.type === 'File' || path.node.type === 'Program') {
      return;
    }

    const depth = depthOf(path);

    if (!outermost.has(line) || outermost.get(line).depth > depth) {
      outermost.set(line, { path, depth });
    }
  });

  return line => (outermost.has(line) ? markerTargets(outermost.get(line).path) : []);
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
