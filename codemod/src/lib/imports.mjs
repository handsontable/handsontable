/**
 * Import helpers for transforms: find imports of a module, add, remove, move, and rename named imports, and
 * detect the module references a rewrite cannot follow (re-exports, dynamic imports, `require`).
 *
 * Every helper takes the jscodeshift API `j` and the parsed Collection `root`. Helpers that take a declaration
 * or a specifier accept the NodePath a finder returned, or the bare node. None of them calls
 * `ctx.markChanged()`: the caller does.
 *
 * @module lib/imports
 */

import { stringValue } from './ast.mjs';
import { findReferences, invalidateScope, lookup, moduleBindings, referenceSpace } from './scope.mjs';

/**
 * A module specifier test: an exact module name, or a predicate on the name.
 *
 * @typedef {string|((moduleName: string) => boolean)} SourceMatcher
 */

/**
 * One name an import declaration brings into the file.
 *
 * @typedef {object} ImportBinding
 * @property {string} imported Exported name, `default` for a default import, `*` for a namespace import.
 * @property {string} local Local name.
 * @property {'value'|'type'} kind `type` for `import type` and for a `type` modifier on the specifier.
 * @property {'named'|'default'|'namespace'} form Shape of the specifier.
 * @property {object} declaration NodePath of the `ImportDeclaration`.
 * @property {object} specifier NodePath of the specifier.
 */

/**
 * Result of `addNamedImport`.
 *
 * @typedef {object} AddImportResult
 * @property {boolean} added `true` when the file changed.
 * @property {string|null} local The local name to use in code, or `null` after a collision.
 * @property {object|null} declaration NodePath of the declaration that holds the specifier.
 * @property {object|null} specifier NodePath of the specifier.
 * @property {'exists'|'collision'} [reason] Why nothing was added: `exists` when the file already imports the
 * name (`local` is then the existing local name), `collision` when the wanted local name is taken by another
 * declaration.
 */

/**
 * Turn a source matcher into a predicate.
 *
 * @param {SourceMatcher} source Exact name or predicate.
 * @returns {(moduleName: string) => boolean} The predicate.
 */
export function matchSource(source) {
  return typeof source === 'function' ? source : value => value === source;
}

/**
 * Whether a declaration path is a direct child of the program.
 *
 * @param {object} path NodePath of an `ImportDeclaration`.
 * @returns {boolean} `true` at the top level.
 */
function isTopLevel(path) {
  return path.parent?.node.type === 'Program';
}

/**
 * Value of the specifier kind: `type` when the declaration or the specifier carries `type`.
 *
 * @param {object} declarationNode An `ImportDeclaration` node.
 * @param {object} specifierNode A specifier node.
 * @returns {'value'|'type'} The kind.
 */
function bindingKind(declarationNode, specifierNode) {
  return declarationNode.importKind === 'type' || specifierNode.importKind === 'type' ? 'type' : 'value';
}

/**
 * Find the import declarations of a module. Covers `import`, `import type`, and declarations that only hold
 * `type` specifiers. Imports nested in `declare module` blocks are not top-level imports and are skipped.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {SourceMatcher} source Module name or predicate on it.
 * @returns {object[]} NodePaths of `ImportDeclaration`s in source order.
 */
export function findImports(j, root, source) {
  const matches = matchSource(source);

  return root.find(j.ImportDeclaration)
    .filter(path => isTopLevel(path) && matches(String(path.node.source.value)))
    .paths();
}

/**
 * List every name imported from a module, including default and namespace imports.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {SourceMatcher} source Module name or predicate on it.
 * @returns {ImportBinding[]} The bindings in source order.
 */
export function getImportedBindings(j, root, source) {
  const bindings = [];

  findImports(j, root, source).forEach((declaration) => {
    declaration.node.specifiers.forEach((specifierNode, index) => {
      const specifier = declaration.get('specifiers', index);
      let imported = 'default';
      let form = 'default';

      if (specifierNode.type === 'ImportNamespaceSpecifier') {
        imported = '*';
        form = 'namespace';
      } else if (specifierNode.type === 'ImportSpecifier') {
        imported = specifierNode.imported.name ?? stringValue(specifierNode.imported);
        form = 'named';
      }

      bindings.push({
        imported,
        local: specifierNode.local.name,
        kind: bindingKind(declaration.node, specifierNode),
        form,
        declaration,
        specifier,
      });
    });
  });

  return bindings;
}

/**
 * Find the paths of the re-exports of a module: `export { X } from 'src'`, `export * from 'src'`,
 * `export * as ns from 'src'`, and `export type { X } from 'src'`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {SourceMatcher} source Module name or predicate on it.
 * @returns {object[]} NodePaths of the export declarations.
 */
export function findReExports(j, root, source) {
  const matches = matchSource(source);
  const isMatch = path => path.node.source && matches(String(path.node.source.value));

  return [
    ...root.find(j.ExportNamedDeclaration).filter(isMatch).paths(),
    ...root.find(j.ExportAllDeclaration).filter(isMatch).paths(),
  ].sort((a, b) => (a.node.start ?? 0) - (b.node.start ?? 0));
}

/**
 * Find dynamic imports of a module with a literal specifier: `import('src')`, and the type form
 * `typeof import('src')` / `import('src').Foo`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {SourceMatcher} source Module name or predicate on it.
 * @returns {object[]} NodePaths of the `CallExpression`, `ImportExpression`, or `TSImportType` nodes.
 */
export function findDynamicImports(j, root, source) {
  const matches = matchSource(source);
  const found = [];

  root.find(j.CallExpression, { callee: { type: 'Import' } }).forEach((path) => {
    const value = stringValue(path.node.arguments[0]);

    if (value !== null && matches(value)) {
      found.push(path);
    }
  });

  root.find(j.Node).filter(path => path.node.type === 'ImportExpression'
    || path.node.type === 'TSImportType').forEach((path) => {
    const argument = path.node.type === 'ImportExpression' ? path.node.source : path.node.argument;
    const value = stringValue(argument?.type === 'TSLiteralType' ? argument.literal : argument);

    if (value !== null && matches(value)) {
      found.push(path);
    }
  });

  return found;
}

/**
 * Find `require('src')` calls with a literal specifier. A `require` that a local declaration shadows is
 * ignored.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {SourceMatcher} source Module name or predicate on it.
 * @returns {object[]} NodePaths of the `CallExpression` nodes.
 */
export function findRequires(j, root, source) {
  const matches = matchSource(source);

  return root.find(j.CallExpression, { callee: { type: 'Identifier', name: 'require' } })
    .filter((path) => {
      const value = stringValue(path.node.arguments[0]);

      return value !== null && matches(value) && lookup(path.get('callee'), 'require') === null;
    })
    .paths();
}

/**
 * Resolve a declaration given as a path or a node to its NodePath.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} declaration NodePath or node of an `ImportDeclaration`.
 * @returns {object|null} The NodePath, or `null` when the node is not in the tree.
 */
function declarationPath(j, root, declaration) {
  if (declaration.node) {
    return declaration;
  }

  return root.find(j.ImportDeclaration).filter(path => path.node === declaration).paths()[0] ?? null;
}

/**
 * Resolve a specifier given as a path or a node to its NodePath inside a declaration path.
 *
 * @param {object} declaration NodePath of the declaration.
 * @param {object} specifier NodePath or node of the specifier.
 * @returns {object|null} The NodePath, or `null` when the declaration does not hold it.
 */
function specifierPath(declaration, specifier) {
  const target = specifier.node ?? specifier;
  const index = declaration.node.specifiers.indexOf(target);

  return index === -1 ? null : declaration.get('specifiers', index);
}

/**
 * Whether a name is declared at the top level of the module.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {string} name The name.
 * @param {object|null} ignoreNode A declaring identifier node to leave out of the check.
 * @returns {boolean} `true` when another declaration owns the name.
 */
function isNameTaken(j, root, name, ignoreNode) {
  invalidateScope();

  const program = root.find(j.Program).paths()[0].node;

  if ((moduleBindings(program).get(name) ?? []).some(binding => binding.idNode !== ignoreNode)) {
    return true;
  }

  const isGlobalUse = (path) => {
    const space = path.node.type === 'Identifier' || path.node.type === 'JSXIdentifier' ? referenceSpace(path) : null;

    return Boolean(space) && lookup(path, name, space) === null;
  };

  return root.find(j.Identifier, { name }).filter(isGlobalUse).length > 0
    || root.find(j.JSXIdentifier, { name }).filter(isGlobalUse).length > 0;
}

/**
 * Whether a blank line (or a comment) separates a statement from the next one.
 *
 * @param {object} path NodePath of a statement.
 * @returns {boolean} `true` when the next statement does not follow on the next line.
 */
function hasGapAfter(path) {
  const siblings = path.parent.node.body;
  const next = siblings[siblings.indexOf(path.node) + 1];

  return Boolean(next?.loc && path.node.loc && next.loc.start.line - path.node.loc.end.line > 1);
}

/**
 * Insert a new import declaration after an anchor, after the last import, or at the top of the file. The
 * printer repeats the blank line that follows the anchor on both sides of an inserted statement, so when a
 * blank line follows the anchor the declaration goes before it instead. The leading comments of the file's
 * first statement stay at the top of the file.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} declaration The new `ImportDeclaration` node.
 * @param {object|null} anchor NodePath of the declaration to insert next to.
 */
function insertDeclaration(j, root, declaration, anchor) {
  const program = root.find(j.Program).paths()[0];
  let target = anchor;

  if (!target) {
    const imports = root.find(j.ImportDeclaration).filter(isTopLevel).paths();

    target = imports[imports.length - 1] ?? null;
  }

  if (target && !hasGapAfter(target)) {
    target.insertAfter(declaration);

    return;
  }

  const before = target ?? program.get('body', 0);
  const first = program.node.body[0];

  if (first && first === before.node && first.comments?.length) {
    declaration.comments = first.comments;
    first.comments = null;
  }

  if (before.node) {
    before.insertBefore(declaration);
  } else {
    program.get('body').unshift(declaration);
  }
}

/**
 * Find a declaration of a module that can take one more named specifier of a kind: same module, same
 * `import` / `import type` kind, at least one specifier, no namespace specifier, and no default specifier for a
 * type import (`import type D, { N }` is not valid).
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {string} source Module name.
 * @param {'value'|'type'} kind Wanted kind.
 * @returns {object|undefined} NodePath of the declaration.
 */
function findMergeTarget(j, root, source, kind) {
  return findImports(j, root, source).find(path => (path.node.importKind ?? 'value') === kind
    && path.node.specifiers.length > 0
    && !path.node.specifiers.some(item => item.type === 'ImportNamespaceSpecifier'
      || (kind === 'type' && item.type === 'ImportDefaultSpecifier')));
}

/**
 * Add a named import. It merges into an existing declaration of the same module and the same `import` /
 * `import type` kind when there is one, never duplicates an existing specifier, and refuses to take a local
 * name another declaration owns.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} options Options.
 * @param {string} options.source Module name.
 * @param {string} options.imported Exported name.
 * @param {string} [options.local] Local alias. Defaults to `imported`.
 * @param {boolean} [options.typeOnly] `true` to add a type import. A value import already in the file satisfies
 * a type request.
 * @param {object} [options.anchor] NodePath or node of the declaration to insert a new declaration after.
 * @param {object} [options.replacing] NodePath or node of a specifier that the caller removes right after. Its
 * local name does not count as taken.
 * @returns {AddImportResult} What happened.
 */
export function addNamedImport(j, root, { source, imported, local, typeOnly = false, anchor, replacing }) {
  const wantedLocal = local ?? imported;
  const existing = getImportedBindings(j, root, source).find(binding => binding.form === 'named'
    && binding.imported === imported
    && (binding.kind === 'value' || typeOnly)
    && (local === undefined || binding.local === local));

  if (existing) {
    return {
      added: false,
      local: existing.local,
      declaration: existing.declaration,
      specifier: existing.specifier,
      reason: 'exists',
    };
  }

  const ignoreNode = replacing ? (replacing.node ?? replacing).local ?? null : null;

  if (isNameTaken(j, root, wantedLocal, ignoreNode)) {
    return { added: false, local: null, declaration: null, specifier: null, reason: 'collision' };
  }

  const kind = typeOnly ? 'type' : 'value';
  const specifier = j.importSpecifier(j.identifier(imported), j.identifier(wantedLocal));
  const target = findMergeTarget(j, root, source, kind);

  if (target) {
    target.node.specifiers.push(specifier);
    invalidateScope();

    return {
      added: true,
      local: wantedLocal,
      declaration: target,
      specifier: target.get('specifiers', target.node.specifiers.length - 1),
    };
  }

  const declaration = j.importDeclaration([specifier], j.literal(source), kind);
  const anchorPath = anchor ? declarationPath(j, root, anchor) : null;

  insertDeclaration(j, root, declaration, anchorPath);
  invalidateScope();

  const declarationPathResult = root.find(j.ImportDeclaration).filter(path => path.node === declaration)
    .paths()[0];

  return {
    added: true,
    local: wantedLocal,
    declaration: declarationPathResult,
    specifier: declarationPathResult.get('specifiers', 0),
  };
}

/**
 * Remove a specifier from its declaration. The declaration goes with its last specifier. A side-effect import
 * (`import 'x'`) holds no specifier and is never touched. When the removed declaration is the first statement
 * of the file, its comments (a license header) move to the statement that follows.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} declaration NodePath or node of the `ImportDeclaration`.
 * @param {object} specifier NodePath or node of the specifier to remove.
 * @returns {{removed: boolean, declarationRemoved: boolean}} What was removed.
 */
export function removeNamedImport(j, root, declaration, specifier) {
  const declarationResolved = declarationPath(j, root, declaration);
  const specifierResolved = declarationResolved ? specifierPath(declarationResolved, specifier) : null;

  if (!specifierResolved) {
    return { removed: false, declarationRemoved: false };
  }

  specifierResolved.prune();
  invalidateScope();

  if (declarationResolved.node.specifiers.length > 0) {
    return { removed: true, declarationRemoved: false };
  }

  const siblings = declarationResolved.parent.node.body;
  const index = siblings.indexOf(declarationResolved.node);
  const comments = declarationResolved.node.comments;

  if (index === 0 && comments?.length && siblings[1]) {
    siblings[1].comments = [...comments, ...(siblings[1].comments ?? [])];
  }

  declarationResolved.prune();
  invalidateScope();

  return { removed: true, declarationRemoved: true };
}

/**
 * Move a named specifier to another module, keeping its local alias and its `type` kind. A declaration that
 * holds only that specifier is edited in place. Otherwise the new import is merged into an existing declaration
 * of the target, or written next to the old one, and the old specifier is removed.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} declaration NodePath or node of the declaration that holds the specifier.
 * @param {object} specifier NodePath or node of the specifier.
 * @param {string} targetSource Module name to import from.
 * @param {object} [options] Options.
 * @param {string} [options.imported] Exported name in the target module. Defaults to the current one.
 * @param {boolean} [options.typeOnly] Force the target kind. Defaults to the specifier's own kind.
 * @returns {{moved: boolean, reason?: 'not-named'|'collision'|'not-found'}} The outcome. Nothing
 * changes when `moved` is `false`.
 */
export function moveNamedImport(j, root, declaration, specifier, targetSource, options = {}) {
  const declarationResolved = declarationPath(j, root, declaration);
  const specifierResolved = declarationResolved ? specifierPath(declarationResolved, specifier) : null;

  if (!specifierResolved) {
    return { moved: false, reason: 'not-found' };
  }

  const specifierNode = specifierResolved.node;

  if (specifierNode.type !== 'ImportSpecifier') {
    return { moved: false, reason: 'not-named' };
  }

  const local = specifierNode.local.name;
  const importedTarget = options.imported ?? specifierNode.imported.name;
  const kind = bindingKind(declarationResolved.node, specifierNode);
  let targetKind = kind;

  if (options.typeOnly !== undefined) {
    targetKind = options.typeOnly ? 'type' : 'value';
  }

  const alreadyThere = getImportedBindings(j, root, targetSource).some(binding => binding.form === 'named'
    && binding.imported === importedTarget && binding.local === local);

  if (declarationResolved.node.specifiers.length === 1 && targetKind === kind && !alreadyThere
    && !findMergeTarget(j, root, targetSource, kind)) {
    declarationResolved.node.source = j.literal(targetSource);

    if (importedTarget !== specifierNode.imported.name) {
      specifierResolved.replace(j.importSpecifier(j.identifier(importedTarget), j.identifier(local)));
    }

    invalidateScope();

    return { moved: true };
  }

  const result = addNamedImport(j, root, {
    source: targetSource,
    imported: importedTarget,
    local,
    typeOnly: targetKind === 'type',
    anchor: declarationResolved,
    replacing: specifierResolved,
  });

  if (!result.added && result.reason === 'collision') {
    return { moved: false, reason: 'collision' };
  }

  removeNamedImport(j, root, declarationResolved, specifierResolved);

  return { moved: true };
}

/**
 * Rename the imported name of a specifier. A specifier without an alias also changes its local name, and
 * every reference to it follows: identifiers, JSX element names, TypeScript type references, the left side of
 * qualified type names, and `typeof X`. A shorthand property `{ X }` keeps its key and becomes `{ X: NewX }`;
 * `export { X }` keeps its public name and becomes `export { NewX as X }`. Shadowed names, property names,
 * and object keys are left alone. A specifier with an alias only changes the imported name.
 *
 * When the new local name is already declared in the file, or is declared in a scope that holds a reference,
 * nothing changes.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} target NodePath or node of an `ImportSpecifier`, or of an `ImportDeclaration` that holds
 * exactly one specifier.
 * @param {string} newImportedName The new exported name.
 * @returns {{renamed: boolean, references?: number, reason?: 'collision'|'same'|'not-named'|'ambiguous'}}
 * The outcome. Nothing changes when `renamed` is `false`.
 */
export function renameBinding(j, root, target, newImportedName) {
  const targetNode = target.node ?? target;
  let specifierNode = targetNode;

  if (targetNode.type === 'ImportDeclaration') {
    if (targetNode.specifiers.length !== 1) {
      return { renamed: false, reason: 'ambiguous' };
    }

    [specifierNode] = targetNode.specifiers;
  }

  if (specifierNode.type !== 'ImportSpecifier') {
    return { renamed: false, reason: 'not-named' };
  }

  const oldImported = specifierNode.imported.name;

  if (oldImported === newImportedName) {
    return { renamed: false, reason: 'same' };
  }

  const aliased = specifierNode.local.name !== oldImported;

  if (aliased) {
    specifierNode.imported = j.identifier(newImportedName);
    invalidateScope();

    return { renamed: true, references: 0 };
  }

  if (isNameTaken(j, root, newImportedName, null)) {
    return { renamed: false, reason: 'collision' };
  }

  const programNode = root.find(j.Program).paths()[0].node;
  const binding = (moduleBindings(programNode).get(oldImported) ?? [])
    .find(item => item.idNode === specifierNode.local);

  if (!binding) {
    return { renamed: false, reason: 'collision' };
  }

  const references = findReferences(j, root, binding);
  const crossesScope = references.some(path => lookup(path, newImportedName, 'value') !== null
    || lookup(path, newImportedName, 'type') !== null);

  if (crossesScope) {
    return { renamed: false, reason: 'collision' };
  }

  references.forEach((path) => {
    const parent = path.parent.node;

    if (parent.type === 'ObjectProperty' && parent.shorthand && parent.value === path.node) {
      parent.shorthand = false;
      parent.key = j.identifier(oldImported);
    }

    if (parent.type === 'ExportSpecifier') {
      path.parent.replace(j.exportSpecifier.from({
        local: j.identifier(newImportedName),
        exported: j.identifier(parent.exported.name),
      }));

      return;
    }

    path.node.name = newImportedName;
  });

  specifierNode.imported = j.identifier(newImportedName);
  specifierNode.local = j.identifier(newImportedName);
  invalidateScope();

  return { renamed: true, references: references.length };
}
