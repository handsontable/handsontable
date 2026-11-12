import { getImportedBindings, moveNamedImport, renameBinding } from '../lib/imports.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { chooseSource, lazyModular, reportOpaqueReferences, toList } from '../lib/type-rules.mjs';
import { problemsOf } from '../lib/validate.mjs';

/**
 * Check the shape of a rule. The manifest validator cannot say that `source` may not be an empty list.
 *
 * @param {import('../types.mjs').Rule} rule An `exportRename` rule.
 * @returns {void}
 * @throws {Error} When the rule names no source module.
 */
function assertRule(rule) {
  if (toList(rule.source).length === 0) {
    throw new Error(`Rule ${rule.id} needs a "source".`);
  }
}

/**
 * Message for a rename that did not happen.
 *
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {string} reason Reason code of `renameBinding`.
 * @returns {string} The message.
 */
function failureMessage(rule, reason) {
  if (reason === 'collision') {
    return `Could not rename ${rule.from} to ${rule.to}: the new name is already declared in this file or in a `
      + 'scope that uses it. Rename it by hand.';
  }

  return `Could not rename ${rule.from} to ${rule.to} (${reason}). Rename it by hand.`;
}

/**
 * Apply one `exportRename` rule to the imports of one module.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `js` part.
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {string} source The module the name was exported from.
 * @param {() => boolean} isModular Lazy modular-file test.
 * @param {Set<string>} noted Rules whose note was reported already.
 */
function renameInModule(ctx, rule, source, isModular, noted) {
  const { j, root } = ctx;
  const bindings = getImportedBindings(j, root, source)
    .filter(binding => binding.form === 'named' && binding.imported === rule.from);

  for (const binding of bindings) {
    const line = binding.specifier.node.loc?.start?.line;
    let aliased = binding.local !== binding.imported;
    let keptLocal = false;
    const renames = rule.to !== rule.from;
    const candidates = toList(rule.toSource);

    if (!rewrites(rule)) {
      reportInstead(ctx, rule, line, `Replace ${rule.from} with ${rule.to}`
        + `${candidates.length > 0 ? ` from "${candidates[0]}"` : ''}.`, binding.declaration.node);

      continue;
    }

    const target = candidates.length > 0 ? chooseSource(j, root, candidates, { name: rule.to, isModular }) : source;
    const moves = target !== source;
    let changed = false;

    if (renames && (!moves || !aliased)) {
      const renamed = renameBinding(j, root, binding.specifier, rule.to);

      if (!renamed.renamed && renamed.reason === 'collision' && !aliased) {
        // The new name is taken, so keep the local name and change only the imported one. Every reference still
        // resolves, and the file keeps compiling.
        // A new specifier node makes recast print `to as local`. Patching `imported` alone would print `to` only,
        // because without an alias the imported and local identifiers share one source range.
        binding.specifier.replace(j.importSpecifier(j.identifier(rule.to), j.identifier(binding.local)));
        aliased = true;
        keptLocal = true;
      } else if (!renamed.renamed) {
        ctx.report({ ruleId: rule.id, severity: 'manual', line, message: failureMessage(rule, renamed.reason) });

        continue;
      }

      changed = true;
    }

    if (moves) {
      const moved = moveNamedImport(j, root, binding.declaration, binding.specifier, target,
        renames && aliased ? { imported: rule.to } : {});

      if (!moved.moved) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line,
          message: `Could not move ${rule.to} to "${target}" (${moved.reason}). Import it from there by hand.`,
        });

        if (changed) {
          ctx.markChanged();
        }

        continue;
      }

      changed = true;
    }

    if (!changed) {
      continue;
    }

    ctx.markChanged();
    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      line,
      message: (moves
        ? `Replaced ${rule.from} from "${source}" with ${rule.to} from "${target}".`
        : `Renamed the ${rule.from} import from "${source}" to ${rule.to}.`)
        + (keptLocal ? ` The local name ${binding.local} stays: ${rule.to} is already declared in this file.` : '')
        + (rule.reason ? ` ${rule.reason}` : ''),
    });

    if (rule.note && !noted.has(rule.id)) {
      noted.add(rule.id);
      ctx.report({ ruleId: rule.id, severity: 'manual', line, message: rule.note, scope: 'run' });
    }
  }
}

/**
 * Renames an export of a module, optionally moving it to another module (`Config` of
 * `handsontable/plugins/columnSorting` is now `ColumnSortingConfig`).
 *
 * A rule has `source` (a module or a list of modules the name was exported from), `from`, `to`, an optional
 * `toSource` (a module or candidates; the file's imports pick one), and an optional `note` that is reported as
 * `manual` once per file after a rewrite. An alias stays: `import { Config as C }` keeps `C`. Without an alias
 * every reference follows the rename. A collision with a name the file declares skips the rename and reports
 * `manual`. Re-exports, namespace reads, dynamic `import()`, and `require()` of the name are reported and left
 * alone.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const exportRename = {
  kinds: ['exportRename'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Rule} rule An `exportRename` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertRule(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `exportRename` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const isModular = lazyModular(ctx.j, ctx.root);
    const noted = new Set();

    for (const rule of rules) {
      if (!ctx.source.includes(rule.from)) {
        continue;
      }

      assertRule(rule);

      for (const source of toList(rule.source)) {
        renameInModule(ctx, rule, source, isModular, noted);
      }

      reportOpaqueReferences(ctx, {
        ruleId: rule.id,
        sources: toList(rule.source),
        names: [rule.from],
        hint: `${rule.from} is now ${rule.to}${rule.toSource ? ` in ${toList(rule.toSource)[0]}` : ''}.`,
      });
    }
  },
};

export default exportRename;
