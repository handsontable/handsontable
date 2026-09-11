/**
 * Generates the bundled top-level domain (TLD) dictionary `autoLink.strict: false` validates a bare
 * domain candidate against, from IANA's list.
 *
 * Reads `https://data.iana.org/TLD/tlds-alpha-by-domain.txt` (or a local copy of that file, see
 * Usage below - this repository is air-gapped-friendly and never fetches at runtime, only here, at
 * generation time), drops the comment header line, drops punycode entries (`XN--*` - nobody types
 * `xn--` into a cell), lowercases every entry, sorts and dedupes, and writes:
 *   src/utils/cellLinks/tlds.ts
 *
 * The FULL IANA list is used, punycode aside - no generic-TLD exclusion list. That means a bare
 * domain whose top-level domain is also a common file extension (`report.zip`, `favicon.ico`) links
 * too under `autoLink.strict: false`; `strict: true` (the default) or `autoLink: false` is the way to
 * keep a filename column plain text. See the `strict` option's docs in `metaSchema.ts` for the
 * reasoning.
 *
 * Usage (from `handsontable/`):
 *   node scripts/generate-tlds.mjs              # fetches the IANA list over HTTPS
 *   node scripts/generate-tlds.mjs <path>        # reads a local copy instead (no network)
 *
 * Also reachable through the task runner: `npm run generate:tlds --prefix handsontable`.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(currentDir, '..', 'src', 'utils', 'cellLinks', 'tlds.ts');
const SOURCE_URL = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';

const PUNYCODE_PREFIX = 'XN--';

/**
 * Fetches the IANA TLD list from a URL.
 *
 * @param {string} url The list's URL.
 * @returns {Promise<string>} The raw response body.
 */
async function fetchTldList(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Parses the raw IANA TLD list into its header line and the sorted, deduped, lowercased,
 * punycode-filtered TLD list.
 *
 * @param {string} raw The raw file content, IANA's own format: a `#`-prefixed header line, then one
 * uppercase TLD per line.
 * @returns {{ header: string, tlds: string[] }} The version/date header line (verbatim, without the
 * leading `# `) and the filtered TLD list.
 */
function parseTldList(raw) {
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  const headerLine = lines.find(line => line.startsWith('#'));

  if (headerLine === undefined) {
    throw new Error('IANA TLD list is missing its "# Version ..." header line.');
  }

  const tlds = [...new Set(
    lines
      .filter(line => !line.startsWith('#'))
      .filter(line => !line.toUpperCase().startsWith(PUNYCODE_PREFIX))
      .map(line => line.toLowerCase())
  )].sort();

  return { header: headerLine.replace(/^#\s*/, ''), tlds };
}

/**
 * Renders `src/utils/cellLinks/tlds.ts` from the parsed header and TLD list.
 *
 * @param {string} header The IANA version/date header line, verbatim.
 * @param {string[]} tlds The filtered, sorted, deduped, lowercase TLD list.
 * @returns {string} The file content.
 */
function renderModule(header, tlds) {
  return `// GENERATED FILE. Do not edit by hand. Regenerate with \`npm run generate:tlds --prefix handsontable\`.
// Source: ${SOURCE_URL}
// ${header}
// The full IANA list is used, punycode aside - no generic-TLD exclusion. A bare domain whose
// top-level domain is also a common file extension (\`report.zip\`, \`favicon.ico\`) links too.

/**
 * Lowercase ASCII top-level domains a bare domain may end with, space-separated. Punycode TLDs are
 * left out: nobody types \`xn--\` into a cell. Built into a \`Set\` on first use by \`isKnownTld\`.
 */
// eslint-disable-next-line max-len -- one generated, space-separated dictionary line, not prose.
export const TLD_LIST = '${tlds.join(' ')}';

let tldSet: Set<string> | null = null;

/**
 * Whether a lowercase label is a known top-level domain.
 *
 * @param {string} tld The candidate, already lowercased.
 * @returns {boolean} \`true\` for a known TLD.
 */
export function isKnownTld(tld: string): boolean {
  if (tldSet === null) {
    tldSet = new Set(TLD_LIST.split(' '));
  }

  return tldSet.has(tld);
}
`;
}

const sourcePath = process.argv[2];
const raw = sourcePath === undefined
  ? await fetchTldList(SOURCE_URL)
  : readFileSync(resolve(sourcePath), 'utf8');

const { header, tlds } = parseTldList(raw);

writeFileSync(OUT_FILE, renderModule(header, tlds), 'utf8');

console.error(`Wrote ${OUT_FILE} (${tlds.length} TLDs, source: ${sourcePath ?? SOURCE_URL})`);
console.error(`Header: ${header}`);
