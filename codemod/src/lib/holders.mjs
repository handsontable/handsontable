/**
 * Who else holds an options object. A rule that edits an object reached through a variable edits it for every
 * reference to the variable, so it may rewrite the object only when each reference is a use the tool understands as
 * "this grid's settings": the object goes to `new Handsontable()`, to `updateSettings()` of a grid, to a wrapper
 * component, into another options object, or is read member by member. Any other reference (an argument of another
 * call, an export, a return, an alias) gives the object to code the tool cannot see, which would lose the key too.
 * An object that is spread into another one is a second place: the receiving object may set the same key.
 *
 * @module lib/holders
 */

import { attributeName, isFunctionNode, memberName, propertyName, unwrapPath } from './ast.mjs';
import { receiverOfGrid } from './hot-bindings.mjs';
import { printTree } from './print.mjs';
import { findReferences, lookup } from './scope.mjs';

const MEMBERS = new Set(['MemberExpression', 'OptionalMemberExpression']);
const CALLS = new Set(['CallExpression', 'OptionalCallExpression']);
const WRAPPERS = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'TSInstantiationExpression',
  'ParenthesizedExpression',
  'TypeCastExpression',
]);
const SPREADS = new Set(['SpreadElement', 'SpreadProperty', 'ExperimentalSpreadProperty']);
const MEMO_CALLEES = new Set(['useMemo', 'useCallback']);

/**
 * One use of the variable that holds an object.
 *
 * @typedef {object} Use
 * @property {string|null} other What the object goes to when the tool does not understand the use ("passed to
 * `legacy.configure()`"), `null` for a use it understands.
 * @property {number|undefined} line Line of the use.
 * @property {object|null} spreadInto For a spread into an object or an element, the NodePath of the receiver
 * (`ObjectExpression` or `JSXOpeningElement`) and the spread node, else `null`.
 */

/**
 * What an object that a rule is about to edit is held by.
 *
 * @typedef {object} Held
 * @property {string|null} other The first use the tool does not understand, as text, or `null`.
 * @property {number|undefined} otherLine Line of that use.
 * @property {Array<{receiver: object, spread: object, names: {after: Set<string>, anywhere: Set<string>}}>} spreads
 * The objects and elements that spread it, with the option names each sets after the spread and anywhere, as they
 * were when the analysis was built.
 */

/**
 * Build the holder analysis of a file.
 *
 * @param {object} context The file.
 * @param {object} context.j The jscodeshift API.
 * @param {object} context.root The parsed Collection.
 * @param {import('./hot-bindings.mjs').HotBindings} context.bindings The bindings of the file.
 * @param {(node: object) => boolean} context.isOptionObject Whether an object literal is an options object the tool
 * knows, so a spread into it or a property of it is the grid's own business.
 * @param {(node: object) => boolean} [context.isAnnotated] Whether a type annotation names an object literal as
 * Handsontable's. Such an object, and everything inside it, is held to that type by the compiler, so `heldBy()`
 * answers `null` for it.
 * @param {boolean} [context.aggressive] Whether `--aggressive` is on, which takes the `updateSettings()` of a receiver
 * that the file does not show for the grid's.
 * @returns {{heldBy: (objectPath: object) => Held|null}} The analysis. `heldBy()` is `null` for an object that stands
 * inline, with no variable, member, or export that could hold it.
 */
export function createHolders({ j, root, bindings, isOptionObject, isAnnotated = () => false, aggressive = false }) {
  const cache = new Map();
  const around = new Map();
  let members = null;

  // The option names of every object and element that spreads something, before any rule edits the file: a rule that
  // renames or removes the receiver's own key first must not change the answer for the object it spreads.
  const noteReceivers = (list, nameOf) => list.forEach((item, start) => {
    if (SPREADS.has(item.type) || item.type === 'JSXSpreadAttribute') {
      const names = { after: new Set(), anywhere: new Set() };

      list.forEach((other, index) => {
        const name = nameOf(other);

        if (name !== null) {
          names.anywhere.add(name);

          if (index > start) {
            names.after.add(name);
          }
        }
      });
      around.set(item, names);
    }
  });

  root.find(j.ObjectExpression).forEach(path => noteReceivers(path.node.properties, propertyName));
  root.find(j.JSXOpeningElement).forEach(path => noteReceivers(path.node.attributes, attributeName));

  /**
   * What the object a path stands for is stored in: climb through the shapes that keep the object inside a bigger
   * value (a type assertion, an array, a property of another object, a conditional, a `useMemo` callback) to the
   * declaration, assignment, or export that names it.
   *
   * @param {object} objectPath NodePath of an object literal.
   * @returns {{key: object, kind: 'binding'|'member'|'exported', name?: string, declarator?: object}|null} The
   * holder, or `null` for an object that is handed on inline.
   */
  const holderOf = (objectPath) => {
    let current = objectPath;

    while (current.parent) {
      const parent = current.parent;

      if (isAnnotated(current.node)) {
        return null;
      }

      const { node } = parent;

      if (WRAPPERS.has(node.type) || node.type === 'ArrayExpression' || SPREADS.has(node.type)
        || (node.type === 'ObjectExpression' && SPREADS.has(current.node.type))) {
        current = parent;
      } else if (node.type === 'ConditionalExpression' && node.test !== current.node) {
        current = parent;
      } else if ((node.type === 'ObjectProperty' || node.type === 'Property') && node.value === current.node
        && parent.parent?.node.type === 'ObjectExpression') {
        current = parent.parent;
      } else if (isFunctionNode(node) && node.body === current.node) {
        const call = parent.parent;

        if (call && CALLS.has(call.node.type) && MEMO_CALLEES.has(memberName(call.node.callee) ?? call.node.callee.name)
          && call.node.arguments[0] === node) {
          current = call;
        } else {
          return null;
        }
      } else if (node.type === 'ReturnStatement') {
        let fn = parent.parent;

        while (fn && !isFunctionNode(fn.node)) {
          fn = fn.parent;
        }

        const call = fn?.parent;

        if (call && CALLS.has(call.node.type) && MEMO_CALLEES.has(memberName(call.node.callee) ?? call.node.callee.name)
          && call.node.arguments[0] === fn.node) {
          current = call;
        } else {
          return null;
        }
      } else if (node.type === 'VariableDeclarator' && node.init === current.node && node.id.type === 'Identifier') {
        const declaration = parent.parent;

        return declaration?.parent?.node.type === 'ExportNamedDeclaration'
          ? { key: node, kind: 'exported' }
          : { key: node, kind: 'binding', name: node.id.name, declarator: parent };
      } else if (node.type === 'ClassProperty' && node.value === current.node && !node.computed
        && node.key.type === 'Identifier') {
        return { key: node, kind: 'member', name: node.key.name };
      } else if (node.type === 'AssignmentExpression' && node.right === current.node && node.operator === '=') {
        const left = unwrapPath(parent.get('left'));

        if (left.node.type === 'Identifier') {
          const binding = lookup(left, left.node.name, 'value');

          return binding ? { key: node, kind: 'binding', name: left.node.name, declarator: null, binding } : null;
        }

        return MEMBERS.has(left.node.type) && memberName(left.node) !== null
          ? { key: node, kind: 'member', name: memberName(left.node) } : null;
      } else if (node.type === 'ExportDefaultDeclaration') {
        return { key: node, kind: 'exported' };
      } else {
        return null;
      }
    }

    return null;
  };

  /**
   * Every member expression of the file, by member name.
   *
   * @returns {Map<string, object[]>} NodePaths.
   */
  const membersByName = () => {
    if (members === null) {
      members = new Map();

      [j.MemberExpression, j.OptionalMemberExpression].forEach((type) => {
        root.find(type).forEach((path) => {
          const name = memberName(path.node);

          if (name !== null) {
            members.set(name, [...(members.get(name) ?? []), path]);
          }
        });
      });
    }

    return members;
  };

  /**
   * The text for a call that takes the object, `legacy.configure()`.
   *
   * @param {object} callNode The call node.
   * @returns {string} The callee as text.
   */
  const calleeText = (callNode) => {
    const text = printTree(j, callNode.callee).trim();

    return text.length > 40 ? `${text.slice(0, 37)}...` : text;
  };

  /**
   * Whether a reference to the object is a use of the grid's own settings, and what it is when not.
   *
   * @param {object} reference NodePath of the reference (an identifier or a member expression).
   * @returns {Use} The use.
   */
  const classify = (reference) => {
    let current = reference;

    while (current.parent && WRAPPERS.has(current.parent.node.type)
      && current.parent.node.expression === current.node) {
      current = current.parent;
    }

    const line = current.node.loc?.start?.line;
    const other = what => ({ other: what, line, spreadInto: null });
    const fine = { other: null, line, spreadInto: null };

    for (;;) {
      const parent = current.parent;

      if (!parent) {
        return other('used here');
      }

      const { node } = parent;

      switch (node.type) {
        case 'MemberExpression':
        case 'OptionalMemberExpression':
          return node.object === current.node ? fine : other('used here');
        case 'ExpressionStatement':
          return fine;
        case 'UnaryExpression':
          return node.operator === 'typeof' ? fine : other('used here');
        case 'IfStatement':
          return node.test === current.node ? fine : other('used here');
        case 'AssignmentExpression':
          return node.left === current.node
            ? fine : other(`assigned to \`${printTree(j, node.left).trim()}\``);
        case 'VariableDeclarator':
          return node.id.type === 'ObjectPattern' ? fine : other(`assigned to \`${printTree(j, node.id).trim()}\``);
        case 'NewExpression':
          return node.callee !== current.node && bindings.isInstance(parent) ? fine
            : other(`passed to \`new ${calleeText(node)}()\``);
        case 'CallExpression':
        case 'OptionalCallExpression': {
          if (node.callee === current.node) {
            return other(`called as \`${calleeText(node)}()\``);
          }

          const callee = unwrapPath(parent.get('callee'));

          if (memberName(node.callee) === 'updateSettings' && MEMBERS.has(callee.node.type)) {
            const kind = receiverOfGrid(callee.get('object'), bindings);

            // A receiver the file does not show is the grid only for `--aggressive`, as it is for the option finder.
            if (kind === 'instance' || (kind === 'unknown' && aggressive)) {
              return fine;
            }
          }

          return other(`passed to \`${calleeText(node)}()\``);
        }
        case 'SpreadElement':
        case 'SpreadProperty':
        case 'ExperimentalSpreadProperty': {
          const receiver = parent.parent;

          if (receiver?.node.type === 'ObjectExpression') {
            return isOptionObject(receiver.node)
              ? { other: null, line, spreadInto: { receiver, spread: node } }
              : other('spread into an object that is not Handsontable options');
          }

          return other('spread here');
        }
        case 'JSXSpreadAttribute': {
          const element = parent.parent;

          return bindings.getComponent(element)
            ? { other: null, line, spreadInto: { receiver: element, spread: node } }
            : other('spread into a component that is not a Handsontable wrapper');
        }
        case 'JSXExpressionContainer': {
          const attribute = parent.parent;
          const element = attribute?.node.type === 'JSXAttribute' ? attribute.parent : null;

          return element && bindings.getComponent(element)
            ? fine : other('passed to a component that is not a Handsontable wrapper');
        }
        case 'ObjectProperty':
        case 'Property': {
          const owner = parent.parent;

          return node.value === current.node && owner?.node.type === 'ObjectExpression' && isOptionObject(owner.node)
            ? fine : other('stored in an object that is not Handsontable options');
        }
        case 'ArrayExpression':
        case 'ConditionalExpression':
          if (node.type === 'ConditionalExpression' && node.test === current.node) {
            return fine;
          }

          current = parent;

          while (current.parent && WRAPPERS.has(current.parent.node.type)) {
            current = current.parent;
          }

          continue;
        case 'ExportSpecifier':
        case 'ExportDefaultDeclaration':
          return other('exported');
        case 'ReturnStatement':
          return other('returned');
        case 'ArrowFunctionExpression':
          return other('returned');
        default:
          return other('used here');
      }
    }
  };

  /**
   * The references to a holder: the references of the variable, or every member expression of the name.
   *
   * @param {object} holder The holder.
   * @returns {object[]} NodePaths.
   */
  const referencesOf = (holder) => {
    if (holder.kind === 'binding') {
      const binding = holder.binding ?? lookup(holder.declarator.get('id'), holder.name, 'value');

      return binding ? findReferences(j, root, binding) : [];
    }

    return holder.kind === 'member' ? membersByName().get(holder.name) ?? [] : [];
  };

  const heldBy = (objectPath) => {
    const holder = holderOf(objectPath);

    if (!holder) {
      return null;
    }

    if (!cache.has(holder.key)) {
      const held = { other: null, otherLine: undefined, spreads: [] };

      if (holder.kind === 'exported') {
        held.other = 'exported';
      }

      for (const reference of referencesOf(holder)) {
        const use = classify(reference);

        if (use.other !== null && held.other === null) {
          held.other = use.other;
          held.otherLine = use.line;
        }

        if (use.spreadInto) {
          held.spreads.push({ ...use.spreadInto, names: around.get(use.spreadInto.spread) });
        }
      }

      cache.set(holder.key, held);
    }

    return cache.get(holder.key);
  };

  return { heldBy };
}
