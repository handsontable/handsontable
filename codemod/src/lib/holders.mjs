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

import {
  attributeName, isFunctionNode, memberName, propertyName, typeArguments, typeMembers, unwrapPath,
} from './ast.mjs';
import { receiverOfGrid } from './hot-bindings.mjs';
import { printTree } from './print.mjs';
import { findReferences, lookup, patternIdentifiers } from './scope.mjs';

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
const CAST_TYPES = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSTypeAssertion']);
// Type helpers that name their first type argument's shape (`Partial<T>`), and the one that names its second.
const SHAPE_HELPERS = new Set(['Partial', 'Readonly', 'Required', 'Omit', 'Pick', 'Array', 'ReadonlyArray']);
const NEUTRAL_TYPES = new Set(['TSAnyKeyword', 'TSUnknownKeyword', 'TSNeverKeyword']);
const READ_OPERATORS = new Set(['==', '!=', '===', '!==', 'in', 'instanceof']);
// Methods that walk the elements of a value read from the object and hand each one to an inline callback. The numbers
// are the parameters that carry the elements (the element, and the array itself).
const ITERATION = new Map([
  ['forEach', [0, 2]], ['some', [0, 2]], ['every', [0, 2]], ['find', [0, 2]], ['findIndex', [0, 2]],
  ['findLast', [0, 2]], ['findLastIndex', [0, 2]], ['filter', [0, 2]], ['map', [0, 2]], ['flatMap', [0, 2]],
]);
// Iteration methods whose answer is some of the elements, or something made from them: the answer goes on.
const ITERATION_RESULT = new Set(['find', 'findLast', 'filter', 'map', 'flatMap']);
// Methods that answer with a part of the value they are called on.
const VALUE_METHODS = new Set(['at', 'slice', 'concat', 'pop', 'shift', 'splice', 'reverse', 'sort', 'flat']);
// Methods that answer with a boolean, a number, a string, or nothing, and give no element to anyone.
const QUIET_METHODS = new Set([
  'push', 'unshift', 'includes', 'indexOf', 'lastIndexOf', 'join', 'hasOwnProperty', 'toString', 'toLowerCase',
  'toUpperCase', 'trim', 'startsWith', 'endsWith',
]);
const QUIET_GLOBALS = new Set(['String', 'Number', 'Boolean', 'parseInt', 'parseFloat', 'isNaN', 'isFinite']);
const QUIET_MEMBERS = new Set(['Math', 'console']);
const QUIET_PAIRS = new Set(['JSON.stringify', 'Array.isArray', 'Object.keys', 'Number.isInteger', 'Number.isFinite']);

/**
 * One use of the variable that holds an object.
 *
 * @typedef {object} Use
 * @property {string|null} other What the object goes to when the tool does not understand the use ("passed to
 * `legacy.configure()`"), `null` for a use it understands.
 * @property {number|undefined} line Line of the use.
 * @property {object|null} spreadInto For a spread into an object or an element, the NodePath of the receiver
 * (`ObjectExpression` or `JSXOpeningElement`) and the spread node, else `null`.
 * @property {object[]} [alsoSpreadInto] More spreads of the same kind, found in the uses of a part of the object that
 * the code copied into a name (a destructured member, a callback parameter).
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
   * Whether a type node names a type of the project, one that Handsontable does not export: `MyOptions`,
   * `MyOptions[]`, `Partial<MyOptions>`, an inline object type. An object held to such a type may be read as that
   * type elsewhere, so a rule must not change its keys. `GridSettings` and the other types of Handsontable, `any`,
   * `unknown`, and `as const` are not.
   *
   * @param {object|null|undefined} typeNode The type node, or a type annotation.
   * @returns {boolean} `true` for a type of the project.
   */
  const isForeignType = (typeNode) => {
    const node = typeNode?.type === 'TSTypeAnnotation' || typeNode?.type === 'TSParenthesizedType'
      ? typeNode.typeAnnotation : typeNode;

    if (!node || NEUTRAL_TYPES.has(node.type)) {
      return false;
    }

    switch (node.type) {
      case 'TSUnionType':
      case 'TSIntersectionType':
        return typeMembers(node).some(isForeignType);
      case 'TSArrayType':
        return isForeignType(node.elementType);
      case 'TSTypeOperator':
        return isForeignType(node.typeAnnotation);
      case 'TSTypeLiteral':
        return true;
      case 'TSTypeReference': {
        const { typeName } = node;

        if (bindings.resolveTypeName(typeName) !== null) {
          return false;
        }

        if (typeName.type === 'Identifier') {
          const args = typeArguments(node);

          if (typeName.name === 'const') {
            return false;
          }

          if (SHAPE_HELPERS.has(typeName.name)) {
            return isForeignType(args[0]);
          }

          if (typeName.name === 'Record') {
            return isForeignType(args[1]);
          }
        }

        return true;
      }
      default:
        return false;
    }
  };

  /**
   * The text of a type node for a message, `MyOptions`.
   *
   * @param {object} typeNode The type node, or a type annotation.
   * @returns {string} The type as text.
   */
  const typeText = (typeNode) => {
    const text = printTree(j, typeNode?.type === 'TSTypeAnnotation' ? typeNode.typeAnnotation : typeNode)
      .replace(/\s+/g, ' ').trim();

    return text.length > 40 ? `${text.slice(0, 37)}...` : text;
  };

  /**
   * What the object a path stands for is stored in: climb through the shapes that keep the object inside a bigger
   * value (a type assertion, an array, a property of another object, a conditional, a `useMemo` callback) to the
   * declaration, assignment, or export that names it.
   *
   * @param {object} objectPath NodePath of an object literal.
   * @returns {{key: object, kind: 'binding'|'member'|'exported'|'typed', name?: string, declarator?: object}|null} The
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

      // A cast or an annotation to a type of the project: the object is that type's too, and every reader of the type
      // sees the keys. A type of Handsontable is handled above (`isAnnotated`), or leaves the check to the references.
      if (CAST_TYPES.has(node.type) && node.expression === current.node && isForeignType(node.typeAnnotation)) {
        return { key: node, kind: 'typed', type: typeText(node.typeAnnotation), line: node.loc?.start?.line };
      }

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
          return { key: node, kind: 'factory', fn: parent };
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
          return fn ? { key: fn.node, kind: 'factory', fn } : null;
        }
      } else if (node.type === 'VariableDeclarator' && node.init === current.node && node.id.type === 'Identifier') {
        const declaration = parent.parent;

        if (isForeignType(node.id.typeAnnotation)) {
          return { key: node, kind: 'typed', type: typeText(node.id.typeAnnotation), line: node.loc?.start?.line };
        }

        return declaration?.parent?.node.type === 'ExportNamedDeclaration'
          ? { key: node, kind: 'exported' }
          : { key: node, kind: 'binding', name: node.id.name, declarator: parent };
      } else if (node.type === 'ClassProperty' && node.value === current.node && !node.computed
        && node.key.type === 'Identifier') {
        if (isForeignType(node.typeAnnotation)) {
          return { key: node, kind: 'typed', type: typeText(node.typeAnnotation), line: node.loc?.start?.line };
        }

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

  let classify;
  let heldBy;

  /**
   * The uses of the names that take a part of the object (a destructured member, an alias of a member read, the
   * parameter of a callback): the first one the tool does not understand wins, and every spread is kept.
   *
   * @param {string[]} names The declared names.
   * @param {object} scopePath A path inside the scope that declares them.
   * @param {number|undefined} line Line of the use that copied the part.
   * @param {Set<object>} seen The bindings already followed, so a cycle ends.
   * @returns {Use} The use.
   */
  const followNames = (names, scopePath, line, seen) => {
    const spreads = [];

    for (const name of names) {
      const binding = lookup(scopePath, name, 'value');

      if (!binding) {
        return { other: 'used here', line, spreadInto: null };
      }

      if (seen.has(binding.idNode)) {
        continue;
      }

      seen.add(binding.idNode);

      for (const reference of findReferences(j, root, binding)) {
        const use = classify(reference, true, seen);

        if (use.other !== null) {
          return use;
        }

        if (use.spreadInto) {
          spreads.push(use.spreadInto);
        }

        spreads.push(...use.alsoSpreadInto ?? []);
      }
    }

    return { other: null, line, spreadInto: spreads[0] ?? null, alsoSpreadInto: spreads.slice(1) };
  };

  /**
   * Whether a call is one that only reads what it is given (`console.log()`, `Number()`, `JSON.stringify()`).
   *
   * @param {object} callee NodePath of the callee.
   * @returns {boolean} `true` for a call that gives its arguments to no one.
   */
  const isQuietCall = (callee) => {
    const { node } = callee;

    if (node.type === 'Identifier') {
      return QUIET_GLOBALS.has(node.name) && !lookup(callee, node.name, 'value');
    }

    if (!MEMBERS.has(node.type) || node.object.type !== 'Identifier' || lookup(callee, node.object.name, 'value')) {
      return false;
    }

    return QUIET_MEMBERS.has(node.object.name) || QUIET_PAIRS.has(`${node.object.name}.${memberName(node)}`);
  };

  /**
   * Whether a reference to the object is a use of the grid's own settings, and what it is when not.
   *
   * @param {object} reference NodePath of the reference (an identifier or a member expression).
   * @param {boolean} [read] Whether the reference is a value that was read from the object (a member, an element, a
   * destructured part) and not the object itself. Such a value is the object's too, because it is the same
   * object, but a read that ends in an expression gives no object to anyone (`cfg.title + 'x'`).
   * @param {Set<object>} [seen] The bindings followed so far.
   * @returns {Use} The use.
   */
  classify = (reference, read = false, seen = new Set()) => {
    let current = reference;
    let reads = read;

    while (current.parent && WRAPPERS.has(current.parent.node.type)
      && current.parent.node.expression === current.node) {
      current = current.parent;
    }

    const line = current.node.loc?.start?.line;
    const other = what => ({ other: what, line, spreadInto: null });
    const fine = { other: null, line, spreadInto: null };
    const skipWrappers = () => {
      while (current.parent && WRAPPERS.has(current.parent.node.type)) {
        current = current.parent;
      }
    };

    for (;;) {
      const parent = current.parent;

      if (!parent) {
        return other('used here');
      }

      const { node } = parent;

      switch (node.type) {
        case 'MemberExpression':
        case 'OptionalMemberExpression':
          if (node.object !== current.node) {
            return other('used here');
          }

          // A member of the object is the object's too: it goes wherever the read goes.
          reads = true;
          current = parent;
          skipWrappers();

          continue;
        case 'ExpressionStatement':
          return fine;
        case 'UnaryExpression':
          // A read that only asks about the value (`typeof x`, `!x`, `void x`) never gives the object to anyone, and a
          // member read ends in a primitive under any other operator (`delete cfg.key`, `-cfg.size`).
          return reads || ['typeof', '!', 'void'].includes(node.operator) ? fine : other('used here');
        case 'UpdateExpression':
          return reads ? fine : other('used here');
        case 'BinaryExpression':
          // A comparison, `'key' in x`, and `x instanceof Y` give a boolean, not the object.
          return reads || READ_OPERATORS.has(node.operator) ? fine : other('used here');
        case 'TemplateLiteral':
          return reads ? fine : other('used here');
        case 'IfStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ForStatement':
          return node.test === current.node ? fine : other('used here');
        case 'ForInStatement':
          // The loop gets the keys.
          return node.right === current.node ? fine : other('used here');
        case 'ForOfStatement': {
          if (!reads || node.right !== current.node || node.left.type !== 'VariableDeclaration') {
            return other('used here');
          }

          const names = patternIdentifiers(node.left.declarations[0]?.id).map(id => id.name);

          return followNames(names, parent.get('body'), line, seen);
        }
        case 'LogicalExpression':
          // `x && y` gives `y` when `x` is an object, so `x` on the left is a test. Any other operand can be the value
          // of the whole expression, which then goes wherever the expression goes.
          if (node.operator === '&&' && node.left === current.node) {
            return fine;
          }

          current = parent;
          skipWrappers();

          continue;
        case 'AssignmentExpression': {
          if (node.left === current.node) {
            return fine;
          }

          // `total += c.width` makes a number. `w = cfg.width` puts the part under another name.
          if (reads && !['=', '||=', '&&=', '??='].includes(node.operator)) {
            return fine;
          }

          return reads && node.operator === '=' && node.left.type === 'Identifier'
            ? followNames([node.left.name], parent, line, seen)
            : other(`assigned to \`${printTree(j, node.left).trim()}\``);
        }
        case 'VariableDeclarator': {
          if (node.init !== current.node) {
            return other('used here');
          }

          // The object itself under another name is a second holder. A part of it, a destructured member or a
          // member read, is the same object under that name, so every use of the name counts.
          if (node.id.type === 'Identifier' && !reads) {
            return other(`assigned to \`${printTree(j, node.id).trim()}\``);
          }

          if (parent.parent?.parent?.node.type === 'ExportNamedDeclaration') {
            return other('exported');
          }

          return followNames(patternIdentifiers(node.id).map(id => id.name), parent, line, seen);
        }
        case 'NewExpression':
          return node.callee !== current.node && bindings.isInstance(parent) ? fine
            : other(`passed to \`new ${calleeText(node)}()\``);
        case 'CallExpression':
        case 'OptionalCallExpression': {
          if (node.callee === current.node) {
            const method = reads && MEMBERS.has(current.node.type) ? memberName(current.node) : null;

            if (method !== null && ITERATION.has(method) && isFunctionNode(node.arguments[0])) {
              const callback = parent.get('arguments', 0);
              const indexes = ITERATION.get(method);
              const names = callback.node.params
                .filter((param, index) => indexes.includes(index))
                .flatMap(param => patternIdentifiers(param).map(id => id.name));
              const use = followNames(names, callback.get('body'), line, seen);

              if (use.other !== null || !ITERATION_RESULT.has(method)) {
                return use;
              }

              // `find()`, `filter()`, and `map()` answer with the elements or what the callback made of them.
              current = parent;
              skipWrappers();

              const rest = classify(current, true, seen);
              const spreads = [use.spreadInto, ...use.alsoSpreadInto ?? [], rest.spreadInto,
                ...rest.alsoSpreadInto ?? []].filter(Boolean);

              return rest.other !== null ? rest
                : { ...rest, spreadInto: spreads[0] ?? null, alsoSpreadInto: spreads.slice(1) };
            }

            if (method !== null && ITERATION.has(method)) {
              return other(`handed to a callback by \`${calleeText(node)}()\``);
            }

            if (method !== null && QUIET_METHODS.has(method)) {
              return fine;
            }

            if (method !== null && VALUE_METHODS.has(method)) {
              current = parent;
              skipWrappers();

              continue;
            }

            return other(`called as \`${calleeText(node)}()\``);
          }

          if (node.callee.type === 'Identifier' && node.callee.name === 'Boolean' && node.arguments[0] === current.node
            && !lookup(parent.get('callee'), 'Boolean', 'value')) {
            return fine;
          }

          if (reads && isQuietCall(unwrapPath(parent.get('callee')))) {
            return fine;
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

          if (receiver?.node.type === 'ArrayExpression') {
            current = receiver;
            skipWrappers();

            continue;
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

          if (reads && !element && ['JSXElement', 'JSXFragment'].includes(attribute?.node.type)) {
            return fine;
          }

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
          skipWrappers();

          continue;
        case 'ExportSpecifier':
        case 'ExportDefaultDeclaration':
          return other('exported');
        case 'ReturnStatement':
        case 'ArrowFunctionExpression': {
          let fn = parent;

          while (fn && !isFunctionNode(fn.node)) {
            fn = fn.parent;
          }

          const call = reads && fn ? fn.parent : null;
          const method = call && CALLS.has(call.node.type) && call.node.arguments[0] === fn.node
            && MEMBERS.has(unwrapPath(call.get('callee')).node.type) ? memberName(call.node.callee) : null;

          if (method !== null && ITERATION.has(method)) {
            if (!ITERATION_RESULT.has(method) || method === 'filter' || method === 'find') {
              // The callback's answer is a test or is dropped.
              return fine;
            }

            // `map()` and `flatMap()` collect what the callback returns.
            current = call;
            skipWrappers();

            continue;
          }

          return other('returned');
        }
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

  /**
   * Whether an expression is the initializer of a declaration of one name.
   *
   * @param {object} path NodePath of the expression.
   * @returns {boolean} `true` for `const name = <expression>`.
   */
  const isNamedInit = path => path.parent?.node.type === 'VariableDeclarator' && path.parent.node.init === path.node
    && path.parent.node.id.type === 'Identifier';

  /**
   * The path above the type assertions and parentheses around an expression.
   *
   * @param {object} path NodePath of the expression.
   * @returns {object} NodePath of the outermost wrapper, or the path itself.
   */
  const outsideWrappers = (path) => {
    let current = path;

    while (current.parent && WRAPPERS.has(current.parent.node.type)
      && current.parent.node.expression === current.node) {
      current = current.parent;
    }

    return current;
  };

  /**
   * The first use the tool does not understand among several, and every spread.
   *
   * @param {Use[]} uses The uses.
   * @param {number|undefined} line Line to report when there is no use.
   * @returns {Use} One use.
   */
  const mergeUses = (uses, line) => {
    const spreads = uses.flatMap(use => [use.spreadInto, ...use.alsoSpreadInto ?? []]).filter(Boolean);
    const other = uses.find(use => use.other !== null);

    return other ? { ...other, spreadInto: spreads[0] ?? null, alsoSpreadInto: spreads.slice(1) }
      : { other: null, line, spreadInto: spreads[0] ?? null, alsoSpreadInto: spreads.slice(1) };
  };

  /**
   * Whether a use is the grid's own, as `classify()` says, for the value a call or a name stands for: the object that
   * a factory returns, or an array of them. A call that is the value of a declaration with a name follows every use of
   * that name, as the object of a declaration does.
   *
   * @param {object} path NodePath of the call (or of the factory).
   * @param {Set<object>} seen The bindings followed so far.
   * @returns {Use} The use.
   */
  const classifyValue = (path, seen) => {
    const current = outsideWrappers(path);

    const parent = current.parent;

    if (parent?.node.type !== 'VariableDeclarator' || parent.node.init !== current.node
      || parent.node.id.type !== 'Identifier') {
      return classify(path, false, seen);
    }

    const line = current.node.loc?.start?.line;

    if (parent.parent?.parent?.node.type === 'ExportNamedDeclaration') {
      return { other: 'exported', line, spreadInto: null };
    }

    const binding = lookup(parent.get('id'), parent.node.id.name, 'value');

    if (!binding) {
      return { other: 'used here', line, spreadInto: null };
    }

    if (seen.has(binding.idNode)) {
      return { other: null, line, spreadInto: null };
    }

    seen.add(binding.idNode);

    return mergeUses(findReferences(j, root, binding).map(reference => classify(reference, false, seen)), line);
  };

  /**
   * Whether a use of a factory by name is the grid's own: a call gives the object to whatever the call goes to, and any
   * other reference is the function itself (`cells: make`), which the same rules read.
   *
   * @param {object} reference NodePath of the reference.
   * @param {Set<object>} seen The bindings followed so far.
   * @returns {Use} The use.
   */
  const classifyFactoryReference = (reference, seen) => {
    const current = outsideWrappers(reference);

    const parent = current.parent;

    return parent && CALLS.has(parent.node.type) && parent.node.callee === current.node
      ? classifyValue(parent, seen) : classify(reference, false, seen);
  };

  /**
   * Whether the object that holds a function or a class member is handed on to code the file does not show: it is
   * exported, assigned to a member of another object (`module.exports = {...}`), or named in an `export` later.
   *
   * @param {object} ownerPath NodePath of the object literal or the class.
   * @returns {boolean} `true` when other modules can reach it.
   */
  const isExposed = (ownerPath) => {
    let current = ownerPath;

    while (current.parent && WRAPPERS.has(current.parent.node.type)) {
      current = current.parent;
    }

    const parent = current.parent;
    const type = parent?.node.type;

    if (type === 'ExportDefaultDeclaration' || type === 'ExportNamedDeclaration' || type === 'AssignmentExpression') {
      return true;
    }

    let named = current.node.type === 'ClassDeclaration' ? current.node.id : null;

    if (isNamedInit(current)) {
      named = parent.node.id;
    }

    if (!named) {
      return false;
    }

    if (parent.parent?.parent?.node.type === 'ExportNamedDeclaration') {
      return true;
    }

    const binding = lookup(type === 'VariableDeclarator' ? parent.get('id') : current.get('id'), named.name, 'value');

    const hands = reference => ['ExportSpecifier', 'ExportDefaultDeclaration'].includes(reference.parent?.node.type)
      || (reference.parent?.node.type === 'AssignmentExpression' && reference.parent.node.right === reference.node);

    return Boolean(binding) && findReferences(j, root, binding).some(hands);
  };

  /**
   * What a function that returns an options object is handed to. The objects it returns reach whatever the function,
   * or its calls, reach: `cells: make` and `new Handsontable(el, make())` are the grid's own, and `legacy(make())`,
   * `export const make`, `register(make)`, and a method of an exported object are not.
   *
   * @param {object} fnPath NodePath of the function.
   * @returns {Held} What holds the objects the function returns.
   */
  const factoryHeld = (fnPath) => {
    // A function that sits in an options object is the grid's own (`cells() {}`), unless that object is held.
    const heldOwner = (ownerPath) => {
      const owner = heldBy(ownerPath);

      return { other: owner?.other ?? null, line: owner?.otherLine, spreadInto: null };
    };
    const seen = new Set();
    const line = fnPath.node.loc?.start?.line;
    const exposed = { other: 'exported', line, spreadInto: null };
    const uses = [];
    const current = outsideWrappers(fnPath);

    const { node } = current;
    const parent = current.parent;
    const byName = (name, scopePath) => {
      const binding = lookup(scopePath, name, 'value');

      if (!binding) {
        return [{ other: 'used here', line, spreadInto: null }];
      }

      seen.add(binding.idNode);

      return findReferences(j, root, binding).map(reference => classifyFactoryReference(reference, seen));
    };
    const byMember = name => (membersByName().get(name) ?? [])
      .map(reference => classifyFactoryReference(reference, seen));

    if (node.type === 'FunctionDeclaration') {
      if (['ExportDefaultDeclaration', 'ExportNamedDeclaration'].includes(parent?.node.type) || !node.id) {
        uses.push(exposed);
      } else {
        uses.push(...byName(node.id.name, current.get('id')));
      }
    } else if (['ObjectMethod', 'ClassMethod', 'ClassPrivateMethod'].includes(node.type) && !node.computed
      && (node.key?.type === 'Identifier' || node.key?.type === 'PrivateName')) {
      const owner = parent?.node.type === 'ClassBody' ? parent.parent : parent;
      const name = node.key.name ?? node.key.id?.name;

      if (owner?.node.type === 'ObjectExpression' && isOptionObject(owner.node)) {
        uses.push(heldOwner(owner));
      } else if (!owner || isExposed(owner)) {
        uses.push(exposed);
      } else {
        uses.push(...byMember(name));
      }
    } else if (isNamedInit(current)) {
      if (parent.parent?.parent?.node.type === 'ExportNamedDeclaration') {
        uses.push(exposed);
      } else {
        uses.push(...byName(parent.node.id.name, parent.get('id')));
      }
    } else if (['ObjectProperty', 'Property'].includes(parent?.node.type) && parent.node.value === node
      && parent.parent?.node.type === 'ObjectExpression' && isOptionObject(parent.parent.node)) {
      uses.push(heldOwner(parent.parent));
    } else if (['ObjectProperty', 'Property'].includes(parent?.node.type) && parent.node.value === node
      && parent.parent?.node.type === 'ObjectExpression' && !isOptionObject(parent.parent.node)
      && propertyName(parent.node) !== null) {
      uses.push(isExposed(parent.parent) ? exposed : mergeUses(byMember(propertyName(parent.node)), line));
    } else if (parent?.node.type === 'ClassProperty' && parent.node.value === node && !parent.node.computed
      && parent.node.key.type === 'Identifier') {
      uses.push(isExposed(parent.parent.parent) ? exposed : mergeUses(byMember(parent.node.key.name), line));
    } else if (parent && CALLS.has(parent.node.type) && parent.node.callee === node) {
      uses.push(classifyValue(parent, seen));
    } else if (parent && CALLS.has(parent.node.type) && parent.node.arguments[0] === node
      && MEMBERS.has(unwrapPath(parent.get('callee')).node.type) && ITERATION.has(memberName(parent.node.callee))) {
      // A callback of `map()` makes the elements of the array that the call answers with. The others drop the answer.
      const method = memberName(parent.node.callee);
      const collects = method === 'map' || method === 'flatMap';

      uses.push(collects ? classifyValue(parent, seen) : { other: null, line, spreadInto: null });
    } else {
      uses.push(classify(current, false, seen));
    }

    const merged = mergeUses(uses.flat(), line);
    const held = { other: merged.other, otherLine: merged.line, spreads: [] };

    for (const spread of [merged.spreadInto, ...merged.alsoSpreadInto ?? []].filter(Boolean)) {
      held.spreads.push({ ...spread, names: around.get(spread.spread) });
    }

    return held;
  };

  heldBy = (objectPath) => {
    const holder = holderOf(objectPath);

    if (!holder) {
      return null;
    }

    if (!cache.has(holder.key)) {
      const held = { other: null, otherLine: undefined, spreads: [] };

      if (holder.kind === 'typed') {
        held.other = `typed as \`${holder.type}\``;
        held.otherLine = holder.line;
        cache.set(holder.key, held);

        return held;
      }

      if (holder.kind === 'factory') {
        const result = factoryHeld(holder.fn);

        cache.set(holder.key, result);

        return result;
      }

      if (holder.kind === 'exported') {
        held.other = 'exported';
      }

      for (const reference of referencesOf(holder)) {
        const use = classify(reference);

        if (use.other !== null && held.other === null) {
          held.other = use.other;
          held.otherLine = use.line;
        }

        for (const spread of [use.spreadInto, ...use.alsoSpreadInto ?? []].filter(Boolean)) {
          held.spreads.push({ ...spread, names: around.get(spread.spread) });
        }
      }

      cache.set(holder.key, held);
    }

    return cache.get(holder.key);
  };

  return { heldBy };
}
