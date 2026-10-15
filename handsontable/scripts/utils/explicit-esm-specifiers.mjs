import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Make the relative specifiers of a declaration valid under ESM resolution, where `./x` does not
 * resolve and `./dir` does not fall back to `./dir/index`. Covers `from '...'` (import, export,
 * `import type`, `export type { } from`, multiline lists) and `import('...')` types.
 *
 * Only built-ins are imported here: this module runs on CI paths where the root install did not.
 *
 * @param {string} dtsContent The `.d.ts` source.
 * @param {string} dtsPath The absolute path of the `.d.ts` file the content comes from.
 * @returns {string} The source with `.js` specifiers.
 * @throws {Error} When a relative specifier points at neither `<spec>.d.ts` nor `<spec>/index.d.ts`.
 */
export function toExplicitEsmSpecifiers(dtsContent, dtsPath) {
  return dtsContent.replace(/(\bfrom\s+|\bimport\s*\()(['"])(\.{1,2}\/[^'"]*)\2/g, (match, lead, quote, spec) => {
    if (/\.m?js$/.test(spec)) {
      return match;
    }

    const target = path.resolve(path.dirname(dtsPath), spec);
    let explicit;

    if (existsSync(`${target}.d.ts`)) {
      explicit = `${spec}.js`;
    } else if (existsSync(path.join(target, 'index.d.ts'))) {
      explicit = `${spec.replace(/\/$/, '')}/index.js`;
    } else {
      throw new Error(
        `Cannot make "${spec}" explicit in ${dtsPath}: neither ${spec}.d.ts nor ${spec}/index.d.ts exists.`
      );
    }

    return `${lead}${quote}${explicit}${quote}`;
  });
}
