import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../..');

/**
 * Resolves a relative import specifier to a source file, or `null` when it is not one of ours.
 *
 * @param {string} from The importing file.
 * @param {string} specifier The import specifier.
 * @returns {string | null}
 */
function resolveImport(from, specifier) {
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [`${base}.ts`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.js')];

  return candidates.find(candidate => fs.existsSync(candidate)) ?? null;
}

/**
 * Lists every file a runtime import of `entry` reaches. Type-only imports and re-exports are erased at
 * build time, so they are not followed.
 *
 * @param {string} entry The entry file.
 * @returns {Set<string>}
 */
function collectRuntimeGraph(entry) {
  const seen = new Set();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop();

    if (!seen.has(file)) {
      seen.add(file);

      fs.readFileSync(file, 'utf8')
        .split('\n')
        .filter(line => /^(import|export)\b/.test(line) || /^\} from /.test(line))
        .filter(line => !/^(import|export) type\b/.test(line))
        .forEach((line) => {
          const match = line.match(/from '(\.[^']+)'/) ?? line.match(/^import '(\.[^']+)'/);
          const resolved = match ? resolveImport(file, match[1]) : null;

          if (resolved) {
            queue.push(resolved);
          }
        });
    }
  }

  return seen;
}

describe('the handsontable/base entry', () => {
  it('does not reach the view-state engine or plugin', () => {
    const graph = collectRuntimeGraph(path.join(SRC, 'base.ts'));
    const reached = Array.from(graph)
      .map(file => path.relative(SRC, file))
      .filter(file => file.includes('viewState'));

    // A runtime import of either puts about 19 KB (6 KB gzip) in every base build.
    expect(reached).toEqual([]);
    // The walk reaches the core, so an empty result is not a walk that found nothing.
    expect(graph.size).toBeGreaterThan(100);
  });
});
