import { getImportedBindings, moveNamedImport } from '../lib/imports.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import {
  chooseSource,
  describeMoves,
  lazyModular,
  reportOpaqueReferences,
  toList,
} from '../lib/type-rules.mjs';

/**
 * Check the shape of a rule. The manifest validator cannot express the nested `exports` map.
 *
 * @param {import('../types.mjs').Rule} rule An `importSource` rule.
 */
function assertRule(rule) {
  if (!rule.exports || typeof rule.exports !== 'object') {
    throw new Error(`Rule ${rule.id} needs an "exports" object.`);
  }

  for (const [name, entry] of Object.entries({ ...rule.exports, ...(rule.fallback ? { '*': rule.fallback } : {}) })) {
    if (entry.removed !== true && toList(entry.to).length === 0) {
      throw new Error(`Rule ${rule.id}: "${name}" needs "to" or "removed": true.`);
    }
  }
}

/**
 * Leave one TODO per declaration that still names removed exports.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context.
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {Map<object, Array<{name: string, advice: string}>>} residual Removed names by declaration node.
 */
function todoResidual(ctx, rule, residual) {
  for (const [declaration, items] of residual) {
    const text = items.map(item => `${item.name}: ${item.advice}`).join(' ');
    const names = items.map(item => item.name).join(', ');

    ctx.todo(declaration, rule.id, items.length === 1 ? text : `${rule.from} no longer exports these names. ${text}`,
      items.length === 1 ? text : `${names} are no longer exported from "${rule.from}".`);
  }
}

/**
 * Apply one `importSource` rule to a file.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `js` part.
 * @param {import('../types.mjs').Rule} rule The rule.
 */
function applyRule(ctx, rule) {
  const { j, root } = ctx;

  if (!ctx.source.includes(rule.from)) {
    return;
  }

  assertRule(rule);

  const moves = describeMoves(rule.exports);

  reportOpaqueReferences(ctx, {
    ruleId: rule.id,
    sources: [rule.from],
    names: Object.keys(rule.exports),
    all: rule.moduleRemoved === true,
    hint: moves ? `The names moved: ${moves}.` : (rule.advice ?? ''),
  });

  const bindings = getImportedBindings(j, root, rule.from).filter(binding => binding.form === 'named');
  const isModular = lazyModular(j, root);
  const residual = new Map();
  const noted = new Set();

  for (const binding of bindings) {
    const entry = rule.exports[binding.imported] ?? rule.fallback;
    const line = binding.specifier.node.loc?.start?.line;

    if (!entry) {
      continue;
    }

    if (entry.removed === true) {
      const items = residual.get(binding.declaration.node) ?? [];

      items.push({ name: binding.imported, advice: entry.advice ?? rule.advice ?? 'It was removed.' });
      residual.set(binding.declaration.node, items);

      continue;
    }

    const target = chooseSource(j, root, toList(entry.to), { name: binding.imported, isModular });

    if (!rewrites(rule)) {
      reportInstead(ctx, rule, line, [`Import ${binding.imported} from "${target}" instead of "${rule.from}".`,
        entry.note].filter(Boolean).join(' '), binding.declaration.node);

      continue;
    }

    const result = moveNamedImport(j, root, binding.declaration, binding.specifier, target);

    if (result.moved) {
      ctx.markChanged();
      ctx.report({
        ruleId: rule.id,
        severity: 'changed',
        line,
        message: `Moved the ${binding.imported} import from "${rule.from}" to "${target}".`,
      });

      if (entry.note && !noted.has(binding.imported)) {
        noted.add(binding.imported);
        ctx.report({ ruleId: rule.id, severity: 'manual', line, message: entry.note });
      }
    } else if (result.reason === 'collision') {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line,
        message: `Could not move ${binding.imported}: the name is already declared in this file. Import it from `
          + `"${target}" by hand.`,
      });
    }
  }

  todoResidual(ctx, rule, residual);
}

/**
 * Moves named imports away from a module that no longer exists or no longer exports them (`handsontable/common`
 * to `handsontable`, `handsontable/base`, or `handsontable/settings`).
 *
 * A rule has `from` (the old module), `exports` (a map from name to `{ to, note }` or `{ removed, advice }`),
 * and an optional `fallback` entry for names the map does not list. `to` is a module name or a list of
 * candidates; the file's own imports pick one (see `chooseSource`). The kind of the import (`import type` or
 * value), per-specifier `type` modifiers, and local aliases survive the move. A name that is removed or unknown
 * stays in a residual import from the old module with a TODO that carries the advice, so the compiler fails on
 * exactly that line. Namespace imports, default imports, `export ... from`, dynamic `import()`, and `require()`
 * of the old module are reported as `manual` and left alone. A local-name collision in the target skips that
 * name and reports `manual`.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const importSource = {
  kinds: ['importSource'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `importSource` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    rules.forEach(rule => applyRule(ctx, rule));
  },
};

export default importSource;
