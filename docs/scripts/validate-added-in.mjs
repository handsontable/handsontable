import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import matter from 'gray-matter';
import { addedInError, allowedVersions } from '../src/lib/added-in.mjs';

/**
 * Validates the `addedIn` frontmatter field on every content page (DEV-2877).
 *
 * The Starlight content loader falls back to the raw frontmatter when the
 * schema rejects a page, so a malformed or never-released version would build
 * silently and render nothing (or, in the Markdown routes, nonsense). This
 * script is the gate: it runs in `npm run build` before `astro build`.
 */

/**
 * Collects every page that declares `addedIn`, with its raw value.
 *
 * @param {string} contentDir Absolute path to `docs/content`.
 * @returns {Array<{ file: string, value: unknown }>} `file` is relative to
 *   `contentDir`.
 */
export function collectAddedInEntries(contentDir) {
  const entries = [];

  function scan(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(full);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const { data } = matter(readFileSync(full, 'utf8'));

      if (Object.hasOwn(data, 'addedIn')) {
        entries.push({ file: relative(contentDir, full), value: data.addedIn });
      }
    }
  }

  scan(contentDir);

  return entries;
}

/**
 * @param {Array<{ file: string, value: unknown }>} entries
 * @param {Set<string>} allowed From `allowedVersions()`.
 * @returns {string[]} One message per invalid entry; empty when all pass.
 */
export function validateAddedInEntries(entries, allowed) {
  const errors = [];

  for (const { file, value } of entries) {
    const error = addedInError(value, allowed);

    if (error) {
      errors.push(`${file}: ${error}`);
    }
  }

  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { parseAllChangelogs } = await import('../src/plugins/changelog-parser.mjs');
  const released = new Set(parseAllChangelogs().map((entry) => entry.version));
  const contentDir = resolve(process.cwd(), 'content');
  const entries = collectAddedInEntries(contentDir);
  const errors = validateAddedInEntries(entries, allowedVersions(released));

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log(`All addedIn values are valid (${entries.length} page${entries.length === 1 ? '' : 's'}).`);
}
