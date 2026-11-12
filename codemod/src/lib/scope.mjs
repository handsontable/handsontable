/**
 * A small, exact name resolver for the Babel AST that jscodeshift produces. It exists because the scope
 * tracker bundled with jscodeshift does not model block scopes or type parameters, and a rename or a
 * "which variable is this" question must never answer wrongly.
 *
 * It answers two questions: whether an identifier is a reference at all (`referenceSpace`), and which
 * declaration a reference resolves to (`lookup`). A declaration lives in the value space, the type space, or
 * both. A value-only declaration never shadows a type reference and the other way around.
 *
 * @module lib/scope
 */

import { edgeKey, isFunctionNode } from './ast.mjs';

/**
 * A name declared in a scope.
 *
 * @typedef {object} Binding
 * @property {string} name The declared name.
 * @property {string} kind What declares it: `import`, `var`, `let`, `const`, `function`, `class`, `param`, `catch`,
 * `type`, `typeParam`, `enum`, `enumMember`, or `namespace`.
 * @property {'value'|'type'|'both'} space Which namespace of names it occupies.
 * @property {object} idNode The `Identifier` (or type parameter) node that declares the name. It is the same
 * node object that `ImportSpecifier#local` or a `VariableDeclarator#id` holds, so it can be compared by
 * identity.
 * @property {object} node The declaring node: the specifier, declarator, function, class, or statement.
 * @property {object|null} init The initializer expression of a variable declarator, otherwise `null`.
 */

const NO_BINDINGS = new Map();
let declarationCache = new WeakMap();

/**
 * Forget every cached scope. Scopes are computed from the tree and cached per node, so any edit of the tree
 * that adds, removes, or renames a declaration makes the cache stale. The helpers in `imports.mjs` call this
 * themselves; code that edits declarations by hand must call it before the next lookup. The same holds for a
 * `HotBindings` result, which is a snapshot: collect it again after edits.
 */
export function invalidateScope() {
  declarationCache = new WeakMap();
}

const ROOT_SCOPE_TYPES = new Set(['Program', 'TSModuleBlock']);
const LEXICAL_BLOCK_TYPES = new Set(['BlockStatement', 'StaticBlock']);
const FOR_IN_OF_TYPES = new Set(['ForInStatement', 'ForOfStatement']);

/**
 * Add a binding to a map.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {Binding} binding The binding.
 */
function add(map, binding) {
  const list = map.get(binding.name);

  if (list) {
    list.push(binding);
  } else {
    map.set(binding.name, [binding]);
  }
}

/**
 * Identifiers a binding pattern declares.
 *
 * @param {object|null} pattern An `Identifier`, destructuring pattern, default, rest, or parameter property.
 * @param {object[]} [out] Accumulator.
 * @returns {object[]} The declared `Identifier` nodes.
 */
export function patternIdentifiers(pattern, out = []) {
  if (!pattern) {
    return out;
  }

  switch (pattern.type) {
    case 'Identifier':
      out.push(pattern);
      break;
    case 'ObjectPattern':
      pattern.properties.forEach(property => patternIdentifiers(
        property.type === 'RestElement' ? property.argument : property.value,
        out
      ));
      break;
    case 'ArrayPattern':
      pattern.elements.forEach(element => patternIdentifiers(element, out));
      break;
    case 'AssignmentPattern':
      patternIdentifiers(pattern.left, out);
      break;
    case 'RestElement':
      patternIdentifiers(pattern.argument, out);
      break;
    case 'TSParameterProperty':
      patternIdentifiers(pattern.parameter, out);
      break;
    default:
      break;
  }

  return out;
}

/**
 * Declare every identifier of a pattern.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {object} pattern Binding pattern.
 * @param {string} kind Binding kind.
 * @param {string} space Binding space.
 * @param {object} node Declaring node.
 * @param {object|null} init Initializer of the declarator, when the pattern is a plain identifier.
 */
function declarePattern(map, pattern, kind, space, node, init = null) {
  patternIdentifiers(pattern).forEach((idNode) => {
    add(map, { name: idNode.name, kind, space, idNode, node, init: idNode === pattern ? init : null });
  });
}

/**
 * Declare the declarators of a variable declaration.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {object} declaration A `VariableDeclaration`.
 */
function declareVariables(map, declaration) {
  declaration.declarations.forEach((declarator) => {
    declarePattern(map, declarator.id, declaration.kind, 'value', declarator, declarator.init);
  });
}

/**
 * Declare what a statement list declares in a lexical scope: imports, `let`, `const`, functions, classes, and
 * the TypeScript declarations. `var` is hoisted separately.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {object[]} statements Statement nodes.
 */
function declareLexical(map, statements) {
  statements.forEach((statement) => {
    const node = (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration')
      && statement.declaration ? statement.declaration : statement;

    switch (node.type) {
      case 'ImportDeclaration':
        node.specifiers.forEach((specifier) => {
          add(map, {
            name: specifier.local.name,
            kind: 'import',
            space: 'both',
            idNode: specifier.local,
            node: specifier,
            init: null,
          });
        });
        break;
      case 'TSImportEqualsDeclaration':
        add(map, { name: node.id.name, kind: 'import', space: 'both', idNode: node.id, node, init: null });
        break;
      case 'VariableDeclaration':
        if (node.kind !== 'var') {
          declareVariables(map, node);
        }

        break;
      case 'FunctionDeclaration':
      case 'TSDeclareFunction':
        if (node.id) {
          add(map, { name: node.id.name, kind: 'function', space: 'value', idNode: node.id, node, init: null });
        }

        break;
      case 'ClassDeclaration':
        if (node.id) {
          add(map, { name: node.id.name, kind: 'class', space: 'both', idNode: node.id, node, init: null });
        }

        break;
      case 'TSEnumDeclaration':
        add(map, { name: node.id.name, kind: 'enum', space: 'both', idNode: node.id, node, init: null });
        break;
      case 'TSModuleDeclaration':
        if (node.id?.type === 'Identifier') {
          add(map, { name: node.id.name, kind: 'namespace', space: 'both', idNode: node.id, node, init: null });
        }

        break;
      case 'TSTypeAliasDeclaration':
      case 'TSInterfaceDeclaration':
        add(map, { name: node.id.name, kind: 'type', space: 'type', idNode: node.id, node, init: null });
        break;
      default:
        break;
    }
  });
}

/**
 * Declare every `var` in a statement, without entering nested functions.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {object|null|undefined} statement A statement node.
 */
function hoistVars(map, statement) {
  if (!statement) {
    return;
  }

  switch (statement.type) {
    case 'VariableDeclaration':
      if (statement.kind === 'var') {
        declareVariables(map, statement);
      }

      break;
    case 'BlockStatement':
    case 'StaticBlock':
      statement.body.forEach(child => hoistVars(map, child));
      break;
    case 'IfStatement':
      hoistVars(map, statement.consequent);
      hoistVars(map, statement.alternate);
      break;
    case 'ForStatement':
      hoistVars(map, statement.init);
      hoistVars(map, statement.body);
      break;
    case 'ForInStatement':
    case 'ForOfStatement':
      hoistVars(map, statement.left);
      hoistVars(map, statement.body);
      break;
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'LabeledStatement':
    case 'WithStatement':
      hoistVars(map, statement.body);
      break;
    case 'TryStatement':
      hoistVars(map, statement.block);
      hoistVars(map, statement.handler?.body);
      hoistVars(map, statement.finalizer);
      break;
    case 'SwitchStatement':
      statement.cases.forEach(item => item.consequent.forEach(child => hoistVars(map, child)));
      break;
    case 'ExportNamedDeclaration':
      hoistVars(map, statement.declaration);
      break;
    default:
      break;
  }
}

/**
 * Declare the names of `infer X` clauses inside a type.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {object|null|undefined} typeNode A type node.
 */
function declareInfers(map, typeNode) {
  if (!typeNode || typeof typeNode.type !== 'string') {
    return;
  }

  if (typeNode.type === 'TSInferType') {
    const parameter = typeNode.typeParameter;
    const name = typeof parameter.name === 'string' ? parameter.name : parameter.name?.name;

    if (name) {
      add(map, { name, kind: 'typeParam', space: 'type', idNode: parameter, node: typeNode, init: null });
    }
  }

  Object.keys(typeNode).forEach((key) => {
    const value = typeNode[key];

    if (key !== 'loc' && value && typeof value === 'object') {
      (Array.isArray(value) ? value : [value]).forEach(item => declareInfers(map, item));
    }
  });
}

/**
 * Declare the type parameters a node introduces.
 *
 * @param {Map<string, Binding[]>} map Target map.
 * @param {object} node The node.
 */
function declareTypeParameters(map, node) {
  const params = node.typeParameters?.type === 'TSTypeParameterDeclaration' ? node.typeParameters.params : [];
  const mapped = node.type === 'TSMappedType' && node.typeParameter ? [node.typeParameter] : [];

  [...params, ...mapped].forEach((parameter) => {
    const name = typeof parameter.name === 'string' ? parameter.name : parameter.name?.name;

    if (name) {
      add(map, { name, kind: 'typeParam', space: 'type', idNode: parameter, node, init: null });
    }
  });
}

/**
 * Compute what one node declares for the code inside it.
 *
 * @param {object} node Any node.
 * @returns {Map<string, Binding[]>} The bindings, empty for a node that is not a scope.
 */
function buildDeclarations(node) {
  const map = new Map();

  if (ROOT_SCOPE_TYPES.has(node.type)) {
    declareLexical(map, node.body);

    if (node.type === 'Program') {
      node.body.forEach(statement => hoistVars(map, statement));
    }
  } else if (LEXICAL_BLOCK_TYPES.has(node.type)) {
    declareLexical(map, node.body);
  } else if (node.type === 'SwitchStatement') {
    declareLexical(map, node.cases.flatMap(item => item.consequent));
  } else if (node.type === 'CatchClause') {
    declarePattern(map, node.param, 'catch', 'value', node);
  } else if (node.type === 'ForStatement' && node.init?.type === 'VariableDeclaration'
    && node.init.kind !== 'var') {
    declareVariables(map, node.init);
  } else if (FOR_IN_OF_TYPES.has(node.type) && node.left.type === 'VariableDeclaration'
    && node.left.kind !== 'var') {
    declareVariables(map, node.left);
  } else if (node.type === 'ClassExpression' && node.id) {
    add(map, { name: node.id.name, kind: 'class', space: 'both', idNode: node.id, node, init: null });
  } else if (isFunctionNode(node)) {
    node.params.forEach(param => declarePattern(map, param, 'param', 'value', node));

    if (node.type === 'FunctionExpression' && node.id) {
      add(map, { name: node.id.name, kind: 'function', space: 'value', idNode: node.id, node, init: null });
    }

    if (node.body?.type === 'BlockStatement') {
      node.body.body.forEach(statement => hoistVars(map, statement));
    }
  } else if (node.type === 'TSConditionalType') {
    declareInfers(map, node.extendsType);
  } else if (node.type === 'TSEnumDeclaration') {
    node.members.forEach((member) => {
      const name = member.id.type === 'Identifier' ? member.id.name : member.id.value;

      add(map, { name, kind: 'enumMember', space: 'value', idNode: member.id, node: member, init: null });
    });
  }

  declareTypeParameters(map, node);

  return map.size === 0 ? NO_BINDINGS : map;
}

/**
 * What a node declares for the code inside it, cached per node.
 *
 * @param {object} node Any node.
 * @returns {Map<string, Binding[]>} The bindings.
 */
export function declarationsOf(node) {
  let map = declarationCache.get(node);

  if (!map) {
    map = buildDeclarations(node);
    declarationCache.set(node, map);
  }

  return map;
}

/**
 * Resolve a name from the place of `path` to the nearest enclosing declaration.
 *
 * @param {object} path A NodePath. The search starts at its parent.
 * @param {string} name The name to resolve.
 * @param {'value'|'type'} [space] Namespace of the reference. A value reference ignores type-only
 * declarations and a type reference ignores value-only declarations.
 * @returns {Binding|null} The binding, or `null` when the name is not declared in this file (a global).
 */
export function lookup(path, name, space = 'value') {
  let child = path;

  for (let current = path.parent; current; child = current, current = current.parent) {
    // `infer X` is in scope only in the true branch of its conditional type.
    const skip = current.node.type === 'TSConditionalType' && edgeKey(child) !== 'trueType';
    const found = skip ? null : declarationsOf(current.node).get(name)?.find(binding => binding.space === 'both'
      || binding.space === space);

    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Bindings declared at the top level of the module (imports, top-level declarations, hoisted `var`).
 *
 * @param {object} programNode The `Program` node.
 * @returns {Map<string, Binding[]>} The bindings by name.
 */
export function moduleBindings(programNode) {
  return declarationsOf(programNode);
}

const BINDING_CONTAINER_PARENTS = new Set(['ObjectPattern', 'ArrayPattern', 'RestElement', 'TSParameterProperty']);

/**
 * Whether an identifier path sits in a declaring pattern: a variable id, a parameter, or a catch parameter,
 * at any depth of destructuring. A destructuring assignment target is not a declaration.
 *
 * @param {object} path An `Identifier` NodePath.
 * @returns {boolean} `true` when the identifier declares a name.
 */
function isDeclaringPattern(path) {
  let current = path;

  while (current.parent) {
    const parent = current.parent;
    const type = parent.node.type;
    const key = edgeKey(current);

    if (BINDING_CONTAINER_PARENTS.has(type)) {
      current = parent;
    } else if (type === 'AssignmentPattern' && key === 'left') {
      current = parent;
    } else if ((type === 'ObjectProperty' || type === 'Property') && key === 'value'
      && parent.parent?.node.type === 'ObjectPattern') {
      current = parent;
    } else {
      return (type === 'VariableDeclarator' && key === 'id')
        || (isFunctionNode(parent.node) && key === 'params')
        || (type === 'CatchClause' && key === 'param');
    }
  }

  return false;
}

const KEY_PARENTS = new Set([
  'ObjectMethod',
  'ClassMethod',
  'ClassPrivateMethod',
  'ClassProperty',
  'ClassPrivateProperty',
  'ClassAccessorProperty',
  'TSPropertySignature',
  'TSMethodSignature',
  'TSAbstractMethodDefinition',
  'TSAbstractPropertyDefinition',
  'TSDeclareMethod',
]);

const DECLARING_ID_PARENTS = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ClassDeclaration',
  'ClassExpression',
  'TSTypeAliasDeclaration',
  'TSInterfaceDeclaration',
  'TSEnumDeclaration',
  'TSModuleDeclaration',
  'TSImportEqualsDeclaration',
  'TSDeclareFunction',
  'TSNamespaceExportDeclaration',
]);

const SIGNATURE_PARAMETER_PARENTS = new Set([
  'TSIndexSignature',
  'TSFunctionType',
  'TSConstructorType',
  'TSCallSignatureDeclaration',
  'TSConstructSignatureDeclaration',
  'TSMethodSignature',
  'TSDeclareFunction',
  'TSDeclareMethod',
]);

/**
 * Namespace of a qualified name chain such as `A.B.C`, decided by what the chain's top node is.
 *
 * @param {object} path A NodePath of a `TSQualifiedName`.
 * @returns {'value'|'type'} `value` inside `typeof A.B`, otherwise `type`.
 */
function qualifiedNameSpace(path) {
  let top = path;

  while (top.parent?.node.type === 'TSQualifiedName' && edgeKey(top) === 'left') {
    top = top.parent;
  }

  const parent = top.parent?.node.type;

  return parent === 'TSTypeQuery' || parent === 'TSImportEqualsDeclaration' ? 'value' : 'type';
}

/**
 * Decide whether an identifier path is a reference to a declared (or global) name, and in which namespace.
 * Property names, object keys, labels, declaring identifiers, and the names inside import and export
 * specifiers that are not references to a local binding are not references. A write target such as `x = 1`
 * is a reference.
 *
 * @param {object} path An `Identifier` or `JSXIdentifier` NodePath.
 * @returns {'value'|'type'|null} The namespace of the reference, or `null` when the identifier is not one.
 */
export function referenceSpace(path) {
  const node = path.node;
  const parent = path.parent?.node;

  if (!parent) {
    return null;
  }

  const key = edgeKey(path);
  const parentType = parent.type;

  if (node.type === 'JSXIdentifier') {
    if (parentType === 'JSXMemberExpression') {
      return key === 'object' ? 'value' : null;
    }

    if (parentType === 'JSXOpeningElement' || parentType === 'JSXClosingElement') {
      return /^[A-Z_$]/.test(node.name) ? 'value' : null;
    }

    return null;
  }

  if (parentType === 'MemberExpression' || parentType === 'OptionalMemberExpression') {
    return key === 'property' && !parent.computed ? null : 'value';
  }

  if (parentType === 'ObjectProperty' || parentType === 'Property') {
    if (key === 'key') {
      return parent.computed ? 'value' : null;
    }

    return path.parent.parent?.node.type === 'ObjectPattern' && isDeclaringPattern(path) ? null : 'value';
  }

  if (KEY_PARENTS.has(parentType) && key === 'key') {
    return parent.computed ? 'value' : null;
  }

  if (parentType === 'TSEnumMember' && key === 'id') {
    return null;
  }

  if ((parentType === 'LabeledStatement' || parentType === 'BreakStatement' || parentType === 'ContinueStatement')
    && key === 'label') {
    return null;
  }

  if (parentType === 'ImportSpecifier' || parentType === 'ImportDefaultSpecifier'
    || parentType === 'ImportNamespaceSpecifier' || parentType === 'ExportNamespaceSpecifier'
    || parentType === 'ExportDefaultSpecifier') {
    return null;
  }

  if (parentType === 'ExportSpecifier') {
    return key === 'local' && !path.parent.parent?.node.source ? 'value' : null;
  }

  if (DECLARING_ID_PARENTS.has(parentType) && key === 'id') {
    return null;
  }

  if (parentType === 'MetaProperty' || parentType === 'TSNamedTupleMember' || parentType === 'TSTypePredicate'
    || parentType === 'TSTypeParameter') {
    return null;
  }

  if (SIGNATURE_PARAMETER_PARENTS.has(parentType) && (key === 'parameters' || key === 'params')) {
    return null;
  }

  if (parentType === 'TSQualifiedName') {
    return key === 'left' ? qualifiedNameSpace(path.parent) : null;
  }

  if (parentType === 'TSTypeReference' && key === 'typeName') {
    return 'type';
  }

  if (parentType === 'TSTypeQuery' && key === 'exprName') {
    return 'value';
  }

  if ((parentType === 'TSExpressionWithTypeArguments' || parentType === 'TSInterfaceHeritage'
    || parentType === 'TSClassImplements') && key === 'expression') {
    return 'type';
  }

  if (isDeclaringPattern(path)) {
    return null;
  }

  return 'value';
}

/**
 * Collect the reference paths in a tree that resolve to one binding.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root A Collection or NodePath to search in.
 * @param {Binding} binding The binding.
 * @returns {object[]} NodePaths of the `Identifier` and `JSXIdentifier` nodes that refer to the binding.
 */
export function findReferences(j, root, binding) {
  const collection = typeof root.find === 'function' ? root : j(root);
  const found = [];
  const visit = (path) => {
    // ast-types lets `find(j.Identifier)` match a `TSTypeParameter` too, which is a declaration.
    if (path.node === binding.idNode || path.node.name !== binding.name
      || (path.node.type !== 'Identifier' && path.node.type !== 'JSXIdentifier')) {
      return;
    }

    const space = referenceSpace(path);

    if (space && lookup(path, binding.name, space)?.idNode === binding.idNode) {
      found.push(path);
    }
  };

  collection.find(j.Identifier).forEach(visit);
  collection.find(j.JSXIdentifier).forEach(visit);

  return found;
}
