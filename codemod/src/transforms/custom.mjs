import { pathToFileURL } from 'node:url';

const moduleCache = new Map();

/**
 * Import a custom rule module once.
 *
 * @param {import('../types.mjs').Rule} rule A `custom` rule with `modulePath`.
 * @returns {Promise<{fileKinds: string[], apply: Function}>} The module's default export.
 */
async function loadCustomModule(rule) {
  if (!moduleCache.has(rule.modulePath)) {
    const imported = await import(pathToFileURL(rule.modulePath).href);
    const custom = imported.default;

    if (!custom || !Array.isArray(custom.fileKinds) || typeof custom.apply !== 'function') {
      throw new Error(`${rule.id}: ${rule.module} must default-export { fileKinds: string[], apply(ctx, rule) }.`);
    }

    moduleCache.set(rule.modulePath, custom);
  }

  return moduleCache.get(rule.modulePath);
}

/**
 * Runs the modules named by `custom` rules. A custom module default-exports `{ fileKinds, apply(ctx, rule) }`
 * and receives the same `ctx` as a generic transform, with its own single rule. The module is skipped for
 * parts whose kind is not in its `fileKinds`.
 *
 * @type {import('../types.mjs').Transform}
 */
const custom = {
  kinds: ['custom'],
  fileKinds: ['js', 'css', 'vue', 'json', 'template'],

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of any part.
   * @param {import('../types.mjs').Rule[]} rules `custom` rules.
   * @returns {Promise<void>}
   */
  async apply(ctx, rules) {
    for (const rule of rules) {
      const loaded = await loadCustomModule(rule);

      if (loaded.fileKinds.includes(ctx.fileKind)) {
        await loaded.apply(ctx, rule);
      }
    }
  },
};

export default custom;
