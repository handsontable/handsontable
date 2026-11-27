import { findImportEquals, findReExports, getImportedBindings } from '../lib/imports.mjs';
import { lookup } from '../lib/scope.mjs';
import {
  WILDCARD_EXPORT,
  expandAdvice,
  isWildcardReExport,
  moduleMatcher,
  pluginOfModule,
  reportJsdocImportTypes,
  toList,
} from '../lib/type-rules.mjs';
import { problemsOf } from '../lib/validate.mjs';

/**
 * Check the shape of a rule. The manifest validator cannot say that `advice` is required here.
 *
 * @param {import('../types.mjs').Rule} rule An `exportRemoved` rule.
 */
function assertRule(rule) {
  if (toList(rule.source).length === 0 || toList(rule.name).length === 0) {
    throw new Error(`Rule ${rule.id} needs "source" and "name".`);
  }

  if (typeof rule.advice !== 'string') {
    throw new Error(`Rule ${rule.id} needs "advice".`);
  }
}

/**
 * Text of the TODO for one removed name. The lead sentence says the name is no longer exported. A rule `message`
 * replaces it, with the same placeholders as the advice, for a name that is deprecated and still exported.
 *
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {string} name The removed name.
 * @param {string} source The module the file reads it from.
 * @returns {string} The text.
 */
function todoText(rule, name, source) {
  const context = { plugin: pluginOfModule(source), name, source };
  const advice = expandAdvice(rule, context);
  const lead = typeof rule.message === 'string'
    ? expandAdvice({ ...rule, advice: rule.message, noKeyAdvice: rule.message }, context)
    : `${name} is no longer exported from "${source}".`;

  return `${lead} ${advice}`;
}

/**
 * Short text of the TODO comment for one removed name: the name and the advice, whose first sentence says what to
 * use instead.
 *
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {string} name The removed name.
 * @param {string} source The module the file reads it from.
 * @returns {string} The text.
 */
function commentText(rule, name, source) {
  return `${name}: ${expandAdvice(rule, { plugin: pluginOfModule(source), name, source })}`;
}

/**
 * Apply one `exportRemoved` rule to a file.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `js` part.
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {Set<object>} handled Specifier nodes an earlier rule already flagged. The first matching rule wins.
 */
function applyRule(ctx, rule, handled) {
  const { j, root } = ctx;
  const names = new Set(toList(rule.name));

  if (![...names].some(name => ctx.source.includes(name)) && !WILDCARD_EXPORT.test(ctx.source)) {
    return;
  }

  assertRule(rule);

  const matches = moduleMatcher(rule.source, rule.except);

  getImportedBindings(j, root, matches)
    .filter(binding => binding.form === 'named' && names.has(binding.imported)
      && !handled.has(binding.specifier.node))
    .forEach((binding) => {
      handled.add(binding.specifier.node);

      const source = String(binding.declaration.node.source.value);

      ctx.todo(binding.declaration.node, rule.id, todoText(rule, binding.imported, source),
        commentText(rule, binding.imported, source));
    });

  findReExports(j, root, matches).forEach((path) => {
    const source = String(path.node.source.value);

    // A wildcard re-export passes the removed names on to every file that imports from it, once per rule. The rule
    // can name several modules or several names, and the typings of one module hold some of them, so the text says
    // "may" and gives the advice of the rule.
    if (isWildcardReExport(path.node)) {
      const [first] = names;
      const list = [...names].join(', ');
      const advice = expandAdvice(rule, { plugin: pluginOfModule(source), name: first, source });

      ctx.todo(path.node, rule.id,
        `Check ${list}, which this export * from "${source}" may pass on. ${advice}`,
        `Check ${list}, which this export * may pass on. ${advice}`);

      return;
    }

    (path.node.specifiers ?? [])
      .filter(specifier => specifier.local && names.has(specifier.local.name) && !handled.has(specifier))
      .forEach((specifier) => {
        handled.add(specifier);
        ctx.todo(path.node, rule.id, todoText(rule, specifier.local.name, source),
          commentText(rule, specifier.local.name, source));
      });
  });

  // `import * as NS from 'm'` and `import NS = require('m')` are read the same way: `NS.Name`.
  const namespaces = [
    ...getImportedBindings(j, root, matches).filter(binding => binding.form === 'namespace').map(binding => ({
      local: binding.local,
      source: String(binding.declaration.node.source.value),
      idNode: binding.specifier.node.local,
    })),
    ...findImportEquals(j, root, matches).map(equals => ({ ...equals, idNode: equals.node.id })),
  ];

  reportJsdocImportTypes(ctx, {
    ruleId: rule.id,
    matches,
    names: [...names],
    text: (name, source) => todoText(rule, name, source),
  });

  namespaces.forEach(({ local, source, idNode }) => {
    root.find(j.TSQualifiedName).forEach((path) => {
      const { left, right } = path.node;

      // A local that shadows the name is another object.
      if (left.type === 'Identifier' && left.name === local && names.has(right.name)
        && lookup(path.get('left'), local, 'value')?.idNode === idNode) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line: path.node.loc?.start?.line,
          message: todoText(rule, right.name, source),
        });
      }
    });
  });
}

/**
 * Flags imports of names that an entry point no longer exports and that have no replacement the codemod can
 * write (`Settings` of `handsontable/plugins/*`).
 *
 * A rule has `source` (a module, a list, or a pattern where `*` stands for one path segment), an optional
 * `except` list of modules that never match, `name` (a name or a list), and `advice`. The advice may use
 * `{plugin}`, `{optionKey}`, `{name}`, and `{source}`; `{plugin}` is the folder after `handsontable/plugins/`,
 * `{optionKey}` is looked up in the rule's `optionKeys` (default the plugin name, `null` for a plugin with no
 * option, which then uses `noKeyAdvice`). Each matching named import, and each `export { name } from`, gets a TODO
 * comment and a `manual` entry. The import is never removed: deleting it would turn one clear compile error into
 * many unclear ones.
 *
 * @type {import('../types.mjs').Transform}
 */
const exportRemoved = {
  kinds: ['exportRemoved'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Rule} rule An `exportRemoved` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertRule(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `exportRemoved` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const handled = new Set();

    rules.forEach(rule => applyRule(ctx, rule, handled));
  },
};

export default exportRemoved;
