// Reads the `importers:` section of a pnpm v9 lockfile. Shared by the pin tests that keep a dependency
// on one version across the workspace packages that load it.

/**
 * Reads what each workspace importer of a pnpm v9 lockfile resolves one dependency to.
 *
 * @param {string} lockfile The `pnpm-lock.yaml` text.
 * @param {string} dependency The package name.
 * @returns {Map<string, {specifier: string, version: string}>} The specifier and the resolved version,
 * peer suffix dropped, per importer that depends on it.
 */
export function importerResolutions(lockfile, dependency) {
  const resolutions = new Map();
  const dependencyKey = new RegExp(`^ {6}'?${dependency.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}'?:$`);
  let inImporters = false;
  let importer = null;
  let current = null;

  for (const line of lockfile.split('\n')) {
    if (/^\S/.test(line)) {
      inImporters = line === 'importers:';
      current = null;
      continue;
    }

    if (!inImporters) {
      continue;
    }

    const importerMatch = line.match(/^ {2}'?([^\s']+)'?:$/);

    if (importerMatch) {
      importer = importerMatch[1];
      current = null;

    } else if (dependencyKey.test(line)) {
      current = { specifier: '', version: '' };
      resolutions.set(importer, current);

    } else if (current) {
      const field = line.match(/^ {8}(specifier|version): '?([^'\s]+)'?$/);

      if (field) {
        current[field[1]] = field[1] === 'version' ? field[2].replace(/\(.*$/, '') : field[2];
      } else if (!/^ {8}/.test(line)) {
        current = null;
      }
    }
  }

  return resolutions;
}
