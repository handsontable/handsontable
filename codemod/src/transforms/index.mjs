import callUnwrap from './call-unwrap.mjs';
import cssVariables from './css-variables.mjs';
import custom from './custom.mjs';
import dependencies from './dependencies.mjs';
import detect from './detect.mjs';
import exportRemoved from './export-removed.mjs';
import exportRename from './export-rename.mjs';
import importSource from './import-source.mjs';
import methods from './methods.mjs';
import namespaceType from './namespace-type.mjs';
import options from './options.mjs';
import themeTokens from './theme-tokens.mjs';

/**
 * The fixed order in which rule kinds run inside one version. Import and export rewrites come first so
 * later transforms see the final names, option and method rewrites follow, then CSS, and the report-only
 * `detect` and the `custom` escape hatch run last so they look at the rewritten code. `dependency` is last
 * and belongs to phase 2.
 *
 * A module that serves several kinds runs once per version, at the position of its earliest kind, with all
 * its rules in manifest order.
 */
export const KIND_ORDER = [
  'importSource',
  'exportRename',
  'namespaceType',
  'exportRemoved',
  'optionRename',
  'optionMove',
  'optionRemove',
  'methodRemove',
  'methodMove',
  'callUnwrap',
  'cssVariable',
  'themeToken',
  'detect',
  'custom',
  'dependency',
];

/**
 * Kinds that run in phase 2, after phase 1 has visited every file. They read the facts phase 1 collected.
 * Phase 2 visits only `package.json` files.
 */
export const PHASE_TWO_KINDS = new Set(['dependency']);

/**
 * Every transform module that exists. To add one, import it above and list it here; its `kinds` decide which
 * rules it receives. Kinds with no module here are listed as "not implemented" by `--list` and skipped
 * silently in a normal run.
 *
 * @type {import('../types.mjs').Transform[]}
 */
const TRANSFORMS = [
  callUnwrap,
  cssVariables,
  custom,
  dependencies,
  detect,
  exportRemoved,
  exportRename,
  importSource,
  methods,
  namespaceType,
  options,
  themeTokens,
];

/**
 * The registry the runner uses by default: a map from rule kind to the module that handles it.
 *
 * @typedef {object} Registry
 * @property {Map<string, import('../types.mjs').Transform>} byKind Module per rule kind.
 * @property {string[]} order The fixed kind order.
 * @property {Set<string>} phaseTwo Kinds that run in phase 2.
 */

/**
 * Build a registry from a list of transform modules.
 *
 * @param {import('../types.mjs').Transform[]} transforms Modules to register.
 * @param {string[]} [order] Kind order.
 * @param {Set<string>} [phaseTwo] Phase 2 kinds.
 * @returns {Registry} The registry.
 */
export function createRegistry(transforms, order = KIND_ORDER, phaseTwo = PHASE_TWO_KINDS) {
  const byKind = new Map();

  for (const transform of transforms) {
    for (const kind of transform.kinds) {
      if (byKind.has(kind)) {
        throw new Error(`Rule kind "${kind}" is handled by two transform modules.`);
      }

      if (!order.includes(kind)) {
        throw new Error(`Rule kind "${kind}" is missing from KIND_ORDER.`);
      }

      byKind.set(kind, transform);
    }
  }

  return { byKind, order, phaseTwo };
}

/**
 * The default registry.
 */
export const registry = createRegistry(TRANSFORMS);
