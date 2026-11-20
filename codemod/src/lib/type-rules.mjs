/**
 * Helpers shared by the import and type transforms: list normalization, module and dotted-path patterns with a
 * `*` wildcard, option key and advice templates for the plugin family, and the choice of the module a moved
 * name is imported from.
 *
 * @module lib/type-rules
 */

import { isFunctionNode, memberName, stringValue } from './ast.mjs';
import { collectHotBindings } from './hot-bindings.mjs';
import {
  findDynamicImports,
  findImportEquals,
  findImports,
  findReExports,
  findRequires,
  getImportedBindings,
} from './imports.mjs';
import { lookup } from './scope.mjs';
import { collectComments } from './todo.mjs';

/**
 * Turn a rule field that holds one string or a list of strings into a list.
 *
 * @param {string|string[]|undefined} value The field value.
 * @returns {string[]} The list, empty for `undefined`.
 */
export function toList(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/**
 * Lower the first character of a name.
 *
 * @param {string} name The name.
 * @returns {string} For example `ColumnSorting` gives `columnSorting`.
 */
export function lowerFirst(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Upper the first character of a name.
 *
 * @param {string} name The name.
 * @returns {string} For example `columnSorting` gives `ColumnSorting`.
 */
export function upperFirst(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Compile a pattern whose `*` stands for exactly one segment (no separator inside it).
 *
 * @param {string} pattern The pattern, for example `handsontable/plugins/*` or `plugins.*.Settings`.
 * @param {string} separator Segment separator, `/` or `.`.
 * @returns {RegExp} The anchored expression. Each `*` is a capture group.
 */
function compilePattern(pattern, separator) {
  const escaped = pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\/]/g, '\\$&'));
  const wildcard = `([^${separator === '.' ? '.' : '/'}]+)`;

  return new RegExp(`^${escaped.join(wildcard)}$`);
}

/**
 * Build a module name test from a pattern or a list of patterns, minus an exclusion list. A pattern is an exact
 * module name or contains `*` for one path segment.
 *
 * @param {string|string[]} patterns Module name patterns.
 * @param {string|string[]} [except] Exact module names that never match.
 * @returns {(moduleName: string) => boolean} The test.
 */
export function moduleMatcher(patterns, except) {
  const expressions = toList(patterns).map(pattern => compilePattern(pattern, '/'));
  const excluded = new Set(toList(except));

  return moduleName => !excluded.has(moduleName) && expressions.some(expression => expression.test(moduleName));
}

/**
 * Match a dotted member path against a pattern with `*` segments.
 *
 * @param {string} pattern For example `plugins.*.Settings`.
 * @param {string} path For example `plugins.ColumnSorting.Settings`.
 * @returns {string[]|null} The text each `*` matched, or `null` when the path does not match.
 */
export function matchDotted(pattern, path) {
  const match = compilePattern(pattern, '.').exec(path);

  return match ? match.slice(1) : null;
}

/**
 * Name of the plugin an entry point belongs to.
 *
 * @param {string} moduleName Module name such as `handsontable/plugins/columnSorting`.
 * @returns {string|null} The folder after `plugins/`, or `null` for any other module.
 */
export function pluginOfModule(moduleName) {
  const match = /^handsontable\/plugins\/([^/]+)/.exec(moduleName);

  return match ? match[1] : null;
}

/**
 * Look up the option key of a plugin. A rule's `optionKeys` map overrides the default, which is the plugin name
 * with a lower-case first letter. The map accepts the name with either case of the first letter. A `null` value
 * means the plugin has no option.
 *
 * @param {string} plugin Plugin name, `Autofill` or `autofill`.
 * @param {Record<string, string|null>} [optionKeys] The rule's overrides.
 * @returns {string|null} The option key, or `null` when the plugin has none.
 */
export function optionKeyOf(plugin, optionKeys = {}) {
  for (const candidate of [plugin, upperFirst(plugin), lowerFirst(plugin)]) {
    if (Object.hasOwn(optionKeys, candidate)) {
      return optionKeys[candidate];
    }
  }

  return lowerFirst(plugin);
}

/**
 * Fill the placeholders of an advice text. `{plugin}` is the plugin name, `{optionKey}` its option key,
 * `{name}` the removed name, and `{source}` the module it came from. A plugin with no option key uses the rule's
 * `noKeyAdvice` text when it has one.
 *
 * @param {object} rule The rule: `advice`, and optionally `optionKeys` and `noKeyAdvice`.
 * @param {object} values The values to fill in.
 * @param {string|null} [values.plugin] Plugin name.
 * @param {string} [values.name] Removed name.
 * @param {string} [values.source] Module name.
 * @returns {string} The advice text.
 */
export function expandAdvice(rule, { plugin = null, name = '', source = '' }) {
  const optionKey = plugin === null ? null : optionKeyOf(plugin, rule.optionKeys);
  let template = rule.advice ?? rule.message ?? `${name} was removed.`;

  if (plugin !== null && optionKey === null && rule.noKeyAdvice) {
    template = rule.noKeyAdvice;
  }

  return template
    .replaceAll('{plugin}', plugin ?? '')
    .replaceAll('{optionKey}', optionKey ?? '')
    .replaceAll('{name}', name)
    .replaceAll('{source}', source);
}

/**
 * Choose the module a moved name is imported from when the rule offers several. The order of preference:
 * a candidate the file already imports the name from; a candidate the file already imports anything from;
 * `handsontable/base` in a file that imports `handsontable/base` and has no bare `handsontable` value import;
 * the first candidate.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {string[]} candidates Modules that export the name, in order of preference.
 * @param {object} options Options.
 * @param {string} options.name Exported name.
 * @param {() => boolean} options.isModular Lazy test for a modular file, called at most once per choice.
 * @returns {string} One of the candidates.
 */
export function chooseSource(j, root, candidates, { name, isModular }) {
  if (candidates.length === 1) {
    return candidates[0];
  }

  const byName = candidates.find(candidate => getImportedBindings(j, root, candidate)
    .some(binding => binding.form === 'named' && binding.imported === name));

  if (byName) {
    return byName;
  }

  const byImport = candidates.find(candidate => findImports(j, root, candidate).length > 0);

  if (byImport) {
    return byImport;
  }

  return candidates.includes('handsontable/base') && isModular() ? 'handsontable/base' : candidates[0];
}

/**
 * Lazy `isModular` test for `chooseSource`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {() => boolean} A function that collects the bindings on first use and answers from then on.
 */
export function lazyModular(j, root) {
  let value = null;

  return () => {
    if (value === null) {
      value = collectHotBindings(j, root).isModular;
    }

    return value;
  };
}

/**
 * Describe where the names of a rule went, for messages about code the codemod does not rewrite.
 *
 * @param {Record<string, {to?: string|string[], removed?: boolean}>} exports The rule's `exports` map.
 * @param {string[]} [names] Names to describe. Defaults to every name that has a target.
 * @returns {string} For example `CellValue, RowObject: handsontable; Getter: handsontable/settings`.
 */
export function describeMoves(exports, names) {
  const groups = new Map();

  for (const [name, entry] of Object.entries(exports)) {
    const [target] = toList(entry.to);

    if (!target || entry.neverExported === true || (names && !names.includes(name))) {
      continue;
    }

    groups.set(target, [...(groups.get(target) ?? []), name]);
  }

  return [...groups].map(([target, list]) => `${list.join(', ')}: ${target}`).join('; ');
}

/**
 * Describe what to do about the names a module exported and that have no new home, for messages about code the
 * codemod does not rewrite. An entry marked `neverExported` is left out: the module never exported that name.
 *
 * @param {Record<string, {removed?: boolean, advice?: string, neverExported?: boolean}>} exports The rule's
 * `exports` map.
 * @returns {string} The advice of each removed name after its name, for example `Thing: Use X instead of Thing.`.
 */
export function describeRemovals(exports) {
  return Object.entries(exports)
    .filter(([, entry]) => entry.removed === true && entry.neverExported !== true)
    .map(([name, entry]) => `${name}: ${firstSentence(entry.advice ?? 'It was removed.')}`)
    .join(' ');
}

/**
 * The first sentence of a text, with its full stop.
 *
 * @param {string} text The text.
 * @returns {string} Up to and including the first full stop that ends a sentence, or the whole text.
 */
function firstSentence(text) {
  return /^.*?[.!?](?=\s|$)/s.exec(text)?.[0] ?? text;
}

/**
 * The hint that follows a message about a reference to a module that is gone and was not rewritten: where each
 * exported name went, then what to do about the names that have no new home.
 *
 * @param {object} rule An `importSource` rule.
 * @returns {string} The hint, or the rule's `advice` when it lists no names.
 */
export function describeNames(rule) {
  const moves = describeMoves(rule.exports);
  const removals = describeRemovals(rule.exports);

  return [moves ? `The names moved: ${moves}.` : '', removals ? `Removed names: ${removals}` : '']
    .filter(Boolean).join(' ') || (rule.advice ?? '');
}

const TRANSPARENT_WRAPPERS = new Set(['AwaitExpression', 'ParenthesizedExpression', 'TSNonNullExpression',
  'TSAsExpression', 'TSSatisfiesExpression', 'TypeCastExpression']);

/**
 * Whether an object pattern names one of the wanted keys. A computed key is a name only when it is a string literal
 * (`{ ['Name']: x }`): `{ [Name]: x }` reads the property that the variable `Name` holds.
 *
 * @param {object|null|undefined} pattern A pattern node.
 * @param {Set<string>} wanted The names.
 * @returns {boolean} `true` for an object pattern that destructures a wanted name.
 */
function destructuresWanted(pattern, wanted) {
  return pattern?.type === 'ObjectPattern' && pattern.properties.some((property) => {
    const key = property.computed ? stringValue(property.key) : (property.key?.name ?? property.key?.value);

    return typeof key === 'string' && wanted.has(key);
  });
}

/**
 * Whether code reads a wanted name from a binding: a member read `local.Name` of the binding that `idNode` declares.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} scope A NodePath that holds the reads (the file, or a callback body).
 * @param {object} idNode The declaring identifier node of the binding.
 * @param {Set<string>} wanted The names.
 * @returns {boolean} `true` when some member read of the binding names a wanted name.
 */
function readsMemberOfBinding(j, scope, idNode, wanted) {
  return scope.find(j.MemberExpression).some((path) => {
    const { object } = path.node;

    return object.type === 'Identifier' && object.name === idNode.name && wanted.has(memberName(path.node))
      && lookup(path.get('object'), object.name, 'value')?.idNode === idNode;
  });
}

/**
 * Whether the result of a runtime dynamic import is read for one of the wanted names. The import may be wrapped in
 * `await`, parentheses, or a type assertion. The reads that count: a member read of the result, a destructuring
 * of it, a name that holds it and is read with a member, and a `.then()` callback that does one of those with its
 * parameter. A bare `import('module')`, and a destructuring of other names, do not count.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} importPath NodePath of the `import()` expression.
 * @param {Set<string>} wanted The names.
 * @returns {boolean} `true` when the import is read for a wanted name.
 */
function readsWantedName(j, root, importPath, wanted) {
  let current = importPath;

  while (current.parent && TRANSPARENT_WRAPPERS.has(current.parent.node.type)) {
    current = current.parent;
  }

  const { parent } = current;

  if (!parent) {
    return false;
  }

  const { node } = parent;

  if ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') && node.object === current.node) {
    if (memberName(node) !== 'then') {
      return wanted.has(memberName(node));
    }

    const call = parent.parent;
    const callback = call?.node.type === 'CallExpression' && call.node.callee === node
      ? call.get('arguments', 0) : null;

    if (!callback || !isFunctionNode(callback.node)) {
      return false;
    }

    const [param] = callback.node.params;

    return destructuresWanted(param, wanted)
      || (param?.type === 'Identifier' && readsMemberOfBinding(j, j(callback), param, wanted));
  }

  if (node.type === 'VariableDeclarator' && node.init === current.node) {
    return destructuresWanted(node.id, wanted)
      || (node.id.type === 'Identifier' && readsMemberOfBinding(j, root, node.id, wanted));
  }

  return false;
}

/**
 * Text that can hold a wildcard re-export: `export * from`, `export type * from`, `export * as ns from`. A file that has
 * one passes on names that its own text never shows, so a rule that looks for a name in the text still has to read it.
 */
export const WILDCARD_EXPORT = /export\s*(?:type\s+)?\*/;

/**
 * Whether a re-export passes on every name of its module: `export * from 'm'` and `export * as ns from 'm'`.
 *
 * @param {object} node An `ExportAllDeclaration` or `ExportNamedDeclaration` node with a source.
 * @returns {boolean} `true` for a wildcard.
 */
export function isWildcardReExport(node) {
  return node.type === 'ExportAllDeclaration'
    || (node.specifiers ?? []).some(specifier => specifier.type === 'ExportNamespaceSpecifier');
}

/**
 * Report, as `manual`, the JSDoc types of a file that read a name through the module: `@typedef {import('m').Name} T`,
 * `@param {Array<import('m').Name>} x`. They are comments, so the tool never edits them. One entry for each such
 * type, on the line of the comment that holds it.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `js` part.
 * @param {object} options Options.
 * @param {string} options.ruleId Id of the rule that reports.
 * @param {(moduleName: string) => boolean} options.matches Whether a module is one the rule is about.
 * @param {string[]} options.names Exported names the rule is about.
 * @param {(name: string, source: string) => string} options.text What to say about a name read from a module.
 */
export function reportJsdocImportTypes(ctx, { ruleId, matches, names, text }) {
  const wanted = new Set(names);
  const type = /@\w+\s*\{[^\n]*/;
  const read = /import\(\s*(['"])([^'"\n]+)\1\s*\)\s*\.\s*([A-Za-z_$][\w$]*)/g;

  for (const comment of collectComments(ctx.root.get().node)) {
    if (!comment.loc || comment.type !== 'CommentBlock' || !comment.value.includes('import')) {
      continue;
    }

    comment.value.split('\n').forEach((lineText, index) => {
      const declared = type.exec(lineText);

      for (const [, , source, name] of declared ? declared[0].matchAll(read) : []) {
        if (wanted.has(name) && matches(source)) {
          ctx.report({
            ruleId,
            severity: 'manual',
            line: comment.loc.start.line + index,
            message: `Replace ${name} in the type of this comment by hand. ${text(name, source)} The codemod does `
              + 'not edit comments.',
          });
        }
      }
    });
  }
}

/**
 * Report, as `manual`, the references to a module that a rewrite cannot follow. Nothing is edited.
 *
 * With `all` (the module is gone) every such reference counts: `import * as ns` and default imports, `export ...
 * from` and `export *`, dynamic `import()`, and `require()`. Without it (the module still exists and only some
 * names left) a reference counts only when it names one of `names`: a member read of a namespace import
 * (`ns.Name`, `ns.Name` in a type), an `export { Name } from`, a `require` destructured to `Name`, and a dynamic
 * import that is read for `Name`: `import('module').Name`, `(await import('module')).Name`, `const { Name } = await
 * import('module')`, a name that holds the awaited module and is read as `ns.Name`, and a `.then()` callback that
 * destructures `Name` or reads it from its parameter. A wildcard re-export (`export * from 'm'`, `export * as ns from
 * 'm'`) of a module that has any of `names` counts too, because every file that imports from the barrel gets the new
 * names. A bare `require('handsontable')` or `import('handsontable')` stays quiet.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `js` part.
 * @param {object} options Options.
 * @param {string} options.ruleId Id of the rule that reports.
 * @param {string[]} options.sources Module names to look for.
 * @param {string} options.hint What the user should do, appended to every message.
 * @param {string[]} options.names Exported names the rule is about.
 * @param {boolean} [options.all] `true` when the module no longer exists, so every reference counts.
 * @param {string} [options.runtimeAdvice] What to say about a dynamic `import()` or `require()` of the module,
 * which loads it at runtime. Set it for a module that had no runtime code, where moving a name is not the advice.
 */
export function reportOpaqueReferences(ctx, { ruleId, sources, hint, names, all = false, runtimeAdvice }) {
  const { j, root } = ctx;
  const wanted = new Set(names);
  const matches = module => sources.includes(module);
  const report = (node, what, source) => ctx.report({
    ruleId,
    severity: 'manual',
    line: node.loc?.start?.line,
    message: `Replace "${source}" here by hand. ${what} "${source}", and the codemod does not rewrite it. ${hint}`,
  });

  // `import * as ns from 'm'` and `import ns = require('m')` bind the whole module, and the code reads it as `ns.Name`.
  const wholeModules = [
    ...getImportedBindings(j, root, matches).filter(binding => binding.form !== 'named').map(binding => ({
      local: binding.local,
      namespace: binding.form === 'namespace',
      source: String(binding.declaration.node.source.value),
      node: binding.declaration.node,
      idNode: binding.specifier.node.local,
    })),
    ...findImportEquals(j, root, matches).map(equals => ({ ...equals, namespace: true, idNode: equals.node.id })),
  ];

  wholeModules.forEach(({ local, namespace, source, node, idNode }) => {
    if (all) {
      report(node, 'This file imports as a whole', source);

      return;
    }

    if (!namespace) {
      return;
    }

    // A local that shadows the name (`const ns = ...`, a parameter, a namespace) is another object.
    const isTheImport = path => lookup(path, local, 'value')?.idNode === idNode;

    root.find(j.TSQualifiedName).forEach((path) => {
      if (path.node.left.type === 'Identifier' && path.node.left.name === local
        && wanted.has(path.node.right.name) && isTheImport(path.get('left'))) {
        report(path.node, 'This code reads a name through a namespace import of', source);
      }
    });
    root.find(j.MemberExpression).forEach((path) => {
      if (path.node.object.type === 'Identifier' && path.node.object.name === local
        && wanted.has(memberName(path.node)) && isTheImport(path.get('object'))) {
        report(path.node, 'This code reads a name through a namespace import of', source);
      }
    });
  });

  findReExports(j, root, matches).forEach((path) => {
    const { node } = path;
    const named = (node.specifiers ?? []).filter(specifier => wanted.has(specifier.local?.name));

    if (all || named.length > 0) {
      report(node, 'This re-export reads from', String(node.source.value));
    } else if (wanted.size > 0 && isWildcardReExport(node)) {
      // The names of the module reach every file that imports from this one, and nothing here spells them.
      report(node, 'This re-export passes on every name of', String(node.source.value));
    }
  });

  findDynamicImports(j, root, matches).forEach((path) => {
    const { node } = path;
    const argument = node.arguments?.[0] ?? node.source ?? node.argument;
    const value = stringValue(argument?.type === 'TSLiteralType' ? argument.literal : argument);

    if (runtimeAdvice && all && node.type !== 'TSImportType') {
      ctx.report({ ruleId, severity: 'manual', line: node.loc?.start?.line, message: runtimeAdvice });
    } else if (all || (node.type === 'TSImportType' && wanted.has(node.qualifier?.name))
      || (node.type !== 'TSImportType' && readsWantedName(j, root, path, wanted))) {
      report(node, 'This code loads', String(value));
    }
  });

  findRequires(j, root, matches).forEach((path) => {
    const pattern = path.parent.node.type === 'VariableDeclarator' ? path.parent.node.id : null;
    const destructured = destructuresWanted(pattern, wanted);

    if (runtimeAdvice && all) {
      ctx.report({ ruleId, severity: 'manual', line: path.node.loc?.start?.line, message: runtimeAdvice });
    } else if (all || destructured) {
      report(path.node, 'This code loads', stringValue(path.node.arguments[0]));
    }
  });
}
