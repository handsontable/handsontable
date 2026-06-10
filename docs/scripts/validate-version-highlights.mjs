import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function validateHighlightFile(filename, data, knownPrNumbers) {
  const errors = [];
  const filenameVersion = filename.replace(/\.json$/, '');

  if (typeof data !== 'object' || data === null) {
    errors.push(`${filename}: file must be a JSON object`);
    return errors;
  }
  if (typeof data.version !== 'string') {
    errors.push(`${filename}: version must be a string`);
  }
  if (data.version !== filenameVersion) {
    errors.push(`${filename}: filename ${filenameVersion} does not match version ${data.version}`);
  }
  if (!Array.isArray(data.highlighted)) {
    errors.push(`${filename}: highlighted must be an array`);
    return errors;
  }
  if (data.highlighted.length > 5) {
    errors.push(`${filename}: at most 5 highlighted entries (found ${data.highlighted.length})`);
  }

  data.highlighted.forEach((entry, idx) => {
    const where = `${filename} highlighted[${idx}]`;
    if (typeof entry.prNumber !== 'number') {
      errors.push(`${where}: prNumber must be a number`);
    } else if (!knownPrNumbers.has(entry.prNumber)) {
      errors.push(`${where}: PR ${entry.prNumber} not found in changelog entries`);
    }
    if (typeof entry.tagline !== 'string' || entry.tagline.length === 0) {
      errors.push(`${where}: tagline is required`);
    }
    if (typeof entry.whyItMatters !== 'string' || entry.whyItMatters.length === 0) {
      errors.push(`${where}: whyItMatters is required`);
    }
    const hasBefore = typeof entry.codeBefore === 'string';
    const hasAfter = typeof entry.codeAfter === 'string';
    if (hasBefore !== hasAfter) {
      errors.push(`${where}: codeBefore and codeAfter must both be present or both omitted`);
    }
    if (entry.migrationAnchor !== undefined) {
      if (typeof entry.migrationAnchor !== 'string' || !entry.migrationAnchor.startsWith('/migration-from-')) {
        errors.push(`${where}: migrationAnchor must start with /migration-from-`);
      }
    }
  });

  return errors;
}

export function validateAllHighlightFiles(directory, knownPrNumbers) {
  const errors = [];
  let files;
  try {
    files = readdirSync(directory).filter((name) => name.endsWith('.json'));
  } catch (e) {
    if (e.code === 'ENOENT') return errors;
    throw e;
  }

  for (const filename of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(resolve(directory, filename), 'utf8'));
    } catch (e) {
      errors.push(`${filename}: invalid JSON (${e.message})`);
      continue;
    }
    errors.push(...validateHighlightFile(filename, data, knownPrNumbers));
  }

  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { parseAllChangelogs } = await import('../src/plugins/changelog-parser.mjs');
  const knownPrs = new Set(
    parseAllChangelogs().map((e) => e.prNumber).filter((n) => n !== null),
  );
  const dir = resolve(process.cwd(), 'content/data/version-highlights');
  const errors = validateAllHighlightFiles(dir, knownPrs);
  if (errors.length > 0) {
    for (const err of errors) console.error(err);
    process.exit(1);
  }
  console.log('All highlight files are valid.');
}
