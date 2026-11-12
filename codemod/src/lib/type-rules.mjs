/**
 * Helpers shared by the import and type transforms: list normalization, module and dotted-path patterns with a
 * `*` wildcard, option key and advice templates for the plugin family, and the choice of the module a moved
 * name is imported from.
 *
 * @module lib/type-rules
 */

import { memberName } from './ast.mjs';
import { collectHotBindings } from './hot-bindings.mjs';
import {
  findDynamicImports,
  findImports,
  findReExports,
  findRequires,
  getImportedBindings,
} from './imports.mjs';

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
    .replaceAll('{optionKey}', optionKey ?? (plugin === null ? '' : lowerFirst(plugin)))
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

    if (!target || (names && !names.includes(name))) {
      continue;
    }

    groups.set(target, [...(groups.get(target) ?? []), name]);
  }

  return [...groups].map(([target, list]) => `${list.join(', ')}: ${target}`).join('; ');
}

/**
 * Report, as `manual`, the references to a module that a rewrite cannot follow. Nothing is edited.
 *
 * With `all` (the module is gone) every such reference counts: `import * as ns` and default imports, `export ...
 * from` and `export *`, dynamic `import()`, and `require()`. Without it (the module still exists and only some
 * names left) a reference counts only when it names one of `names`: a member read of a namespace import
 * (`ns.Name`, `ns.Name` in a type), an `export { Name } from`, a `require` destructured to `Name`, and
 * `import('module').Name`. A bare `export *`, `require('handsontable')`, or `import('handsontable')` stays quiet.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `js` part.
 * @param {object} options Options.
 * @param {string} options.ruleId Id of the rule that reports.
 * @param {string[]} options.sources Module names to look for.
 * @param {string} options.hint What the user should do, appended to every message.
 * @param {string[]} options.names Exported names the rule is about.
 * @param {boolean} [options.all] `true` when the module no longer exists, so every reference counts.
 */
export function reportOpaqueReferences(ctx, { ruleId, sources, hint, names, all = false }) {
  const { j, root } = ctx;
  const wanted = new Set(names);
  const matches = module => sources.includes(module);
  const report = (node, what, source) => ctx.report({
    ruleId,
    severity: 'manual',
    line: node.loc?.start?.line,
    message: `${what} "${source}". The codemod does not rewrite this. ${hint}`,
  });

  getImportedBindings(j, root, matches).filter(binding => binding.form !== 'named').forEach((binding) => {
    const source = String(binding.declaration.node.source.value);

    if (all) {
      report(binding.declaration.node, 'This file imports as a whole', source);

      return;
    }

    if (binding.form !== 'namespace') {
      return;
    }

    root.find(j.TSQualifiedName).forEach((path) => {
      if (path.node.left.type === 'Identifier' && path.node.left.name === binding.local
        && wanted.has(path.node.right.name)) {
        report(path.node, 'This code reads a name through a namespace import of', source);
      }
    });
    root.find(j.MemberExpression).forEach((path) => {
      if (path.node.object.type === 'Identifier' && path.node.object.name === binding.local
        && wanted.has(memberName(path.node))) {
        report(path.node, 'This code reads a name through a namespace import of', source);
      }
    });
  });

  findReExports(j, root, matches).forEach((path) => {
    const { node } = path;
    const named = (node.specifiers ?? []).filter(specifier => wanted.has(specifier.local?.name));

    if ((all && node.type === 'ExportAllDeclaration') || named.length > 0) {
      report(node, 'This re-export reads from', String(node.source.value));
    }
  });

  findDynamicImports(j, root, matches).forEach((path) => {
    const { node } = path;
    const value = node.arguments?.[0]?.value ?? node.source?.value ?? node.argument?.literal?.value
      ?? node.argument?.value;

    if (all || (node.type === 'TSImportType' && wanted.has(node.qualifier?.name))) {
      report(node, 'This code loads', String(value));
    }
  });

  findRequires(j, root, matches).forEach((path) => {
    const pattern = path.parent.node.type === 'VariableDeclarator' ? path.parent.node.id : null;
    const destructured = pattern?.type === 'ObjectPattern'
      && pattern.properties.some(property => wanted.has(property.key?.name));

    if (all || destructured) {
      report(path.node, 'This code loads', String(path.node.arguments[0].value));
    }
  });
}
