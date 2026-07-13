import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../content/data/version-highlights');

/**
 * Extracts "<major>.<minor>" from a full version string (e.g. "18.1.0" or
 * "18.1.0-rc1"). Returns null when the version doesn't match that shape.
 */
export function parseMajorMinor(version) {
  const match = String(version ?? '').match(/^(\d+)\.(\d+)\.\d+(-rc\d+)?$/);

  return match ? `${match[1]}.${match[2]}` : null;
}

/**
 * Builds the minimal scaffold content for a version-highlights file.
 */
export function buildScaffold(majorMinor) {
  return `${JSON.stringify({ version: majorMinor, highlighted: [] }, null, 2)}\n`;
}

/**
 * Creates a minimal version-highlights scaffold for the given release version,
 * unless a file for that major.minor already exists (idempotent - never
 * overwrites highlights an author has already filled in).
 */
export async function generateHighlightsScaffold(version, directory = DEFAULT_DIR) {
  const majorMinor = parseMajorMinor(version);

  if (majorMinor === null) {
    throw new Error(`Invalid version "${version}" — expected X.Y.Z or X.Y.Z-rcN`);
  }

  const filePath = join(directory, `${majorMinor}.json`);
  const exists = await access(filePath).then(() => true, () => false);

  if (exists) {
    return { status: 'exists', filePath };
  }

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, buildScaffold(majorMinor), 'utf8');

  return { status: 'created', filePath };
}

// process.argv[1] is not resolved to an absolute path when the script is
// invoked with a relative one (e.g. `node docs/scripts/generate-version-highlights.mjs`,
// as publish.yml does), so comparing it to import.meta.url as a plain string
// would never match. pathToFileURL() resolves it the same way Node resolves
// import.meta.url, so the comparison works regardless of how the script is invoked.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const [version] = process.argv.slice(2);

  if (!version) {
    process.stderr.write('Usage: node generate-version-highlights.mjs <version>\n');
    process.exitCode = 1;
  } else {
    try {
      const { status, filePath } = await generateHighlightsScaffold(version);

      process.stdout.write(status === 'exists'
        ? `Version highlights file already exists, skipping: ${filePath}\n`
        : `Created version highlights scaffold: ${filePath}\n`);
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exitCode = 1;
    }
  }
}
