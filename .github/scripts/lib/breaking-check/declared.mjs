/**
 * Deterministic detectors over a commit's per-file diff (`chunk.mjs`'s
 * `splitDiffByFile()` output, unfiltered by scope -- these look at files the
 * changelog gate would exclude, such as `.changelogs/*.json`).
 *
 * These detectors answer whether a change was *declared* the way
 * `.ai/BREAKING-CHANGES.md` requires -- a changelog entry marked
 * `breaking: true`, an entry added to `REMOVED_OPTIONS`/`REMOVED_HOOKS`, a
 * deprecation warning, or a default-value edit in the schema. Each is a text
 * heuristic over the diff, not a semantic check, and each documents its own
 * blind spots below.
 *
 * `detect.mjs` acts on three: `breakingEntry` suppresses the advisory comment,
 * and `defaultsTouched` and `removedRegistryAdded` flag a pull request.
 * `removedRegistryTouched` and `deprecationWarnAdded` are informational only: they are reported in the
 * result but change no decision.
 */

const CHANGELOG_ENTRY_RE = /^\.changelogs\/\d+\.json$/;
const HUNK_HEADER_RE = /^@@ .*@@/;
const WARN_CALL_RE = /warn\(|deprecatedWarn|console\.warn|removedWarnOnce/;
const DEPRECATE_RE = /deprecat/i;

/**
 * A file's added (`+`) or removed (`-`) content lines, excluding the
 * `+++`/`---` header lines.
 *
 * @param {string} text
 * @param {'+' | '-'} marker
 * @returns {string[]}
 */
function changedLines(text, marker) {
  const headerMarker = marker === '+' ? '+++' : '---';

  return text.split('\n').filter((line) => line.startsWith(marker) && !line.startsWith(headerMarker));
}

/**
 * A file's diff text split into its hunks (each including its `@@ ... @@`
 * header line and every line up to the next one), keeping context lines too --
 * used where the heuristic deliberately looks at a hunk as a whole, not just
 * its changed lines.
 *
 * @param {string} text
 * @returns {string[]}
 */
function hunkTexts(text) {
  const hunks = [];
  let current = null;

  for (const line of text.split('\n')) {
    if (HUNK_HEADER_RE.test(line)) {
      current = [line];
      hunks.push(current);
    } else if (current) {
      current.push(line);
    }
  }

  return hunks.map((lines) => lines.join('\n'));
}

/**
 * An added `.changelogs/<issueOrPR>.json` file whose added lines include
 * `"breaking": true`.
 *
 * Blind spot: reads the raw text, not parsed JSON, so it also fires on
 * `"breaking": true` inside a string value (never seen in practice -- the
 * field is always a JSON boolean) and misses a value spread across lines by
 * unusual formatting (the generator always writes it on one line).
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ breakingEntry: boolean, evidence: string | null }}
 */
export function detectBreakingEntry(files) {
  for (const file of files) {
    if (!CHANGELOG_ENTRY_RE.test(file.path)) {
      continue;
    }

    const hit = changedLines(file.text, '+').find((line) => /"breaking"\s*:\s*true/.test(line));

    if (hit) {
      return { breakingEntry: true, evidence: `${file.path}: ${hit.trim()}` };
    }
  }

  return { breakingEntry: false, evidence: null };
}

/**
 * `handsontable/src/core.ts` or `handsontable/src/core/hooks/constants.ts`
 * touched in a hunk that mentions `REMOVED_OPTIONS`/`REMOVED_HOOKS`.
 *
 * Heuristic, by design: it checks whether the identifier appears anywhere in
 * the hunk's text (context lines included), not only on a changed line, so
 * that adding an entry *inside* the array (a changed line above or below the
 * declaration, with the identifier only in context) still counts. The price
 * is that an unrelated edit sharing a hunk with the declaration (e.g. a
 * reformat two lines above `REMOVED_OPTIONS`) also counts.
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ removedRegistryTouched: boolean, evidence: string | null }}
 */
export function detectRemovedRegistryTouched(files) {
  const targets = [
    { path: 'handsontable/src/core.ts', identifier: 'REMOVED_OPTIONS' },
    { path: 'handsontable/src/core/hooks/constants.ts', identifier: 'REMOVED_HOOKS' },
  ];

  for (const { path: targetPath, identifier } of targets) {
    const file = files.find((f) => f.path === targetPath);

    if (!file) {
      continue;
    }

    const hit = hunkTexts(file.text).find((hunk) => hunk.includes(identifier));

    if (hit) {
      return { removedRegistryTouched: true, evidence: `${targetPath}: a hunk mentions ${identifier}` };
    }
  }

  return { removedRegistryTouched: false, evidence: null };
}

/**
 * An added line in `handsontable/src/**` or `wrappers/**` matching
 * `/deprecat/i`, together with an added warn call
 * (`warn(`, `deprecatedWarn`, `console.warn`, `removedWarnOnce`) somewhere in
 * the same file's added lines.
 *
 * Blind spot: the two need not be on the same line, so a coincidental
 * `deprecat` in an unrelated comment plus an unrelated `warn(` call added
 * elsewhere in the same file would also fire; in practice a deprecation
 * change adds both together.
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ deprecationWarnAdded: boolean, evidence: string | null }}
 */
export function detectDeprecationWarnAdded(files) {
  for (const file of files) {
    if (!/^handsontable\/src\//.test(file.path) && !/^wrappers\//.test(file.path)) {
      continue;
    }

    const added = changedLines(file.text, '+');
    const deprecateLine = added.find((line) => DEPRECATE_RE.test(line));
    const warnLine = added.find((line) => WARN_CALL_RE.test(line));

    if (deprecateLine && warnLine) {
      return { deprecationWarnAdded: true, evidence: `${file.path}: "${deprecateLine.trim()}" + "${warnLine.trim()}"` };
    }
  }

  return { deprecationWarnAdded: false, evidence: null };
}

/**
 * Any removed (`-`) line in `handsontable/src/dataMap/metaManager/metaSchema.{js,ts}`
 * that is not a comment. Only removals count: changing an existing default
 * always removes its old line, while adding a new option only adds lines, and a
 * new option is not a breaking change. A comment line is one whose content (after the +/- marker,
 * trimmed) starts with `*`, `/*`, or `//` -- the deliberately simple rule used here,
 * not a real comment-aware lexer (unlike
 * `presence-gate.mjs`'s `isCommentOnlyChange`), so a line like
 * `+  someCode(); // trailing comment` still counts as code, and a block
 * comment's opening `/**` line is skipped while a line inside it that happens
 * not to start with `*` (rare, malformed JSDoc) would not be.
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ defaultsTouched: boolean, evidence: string | null }}
 */
export function detectDefaultsTouched(files) {
  // `.js` before the TypeScript migration; history-based calibration still sees it.
  const file = files.find((f) => /^handsontable\/src\/dataMap\/metaManager\/metaSchema\.(js|ts)$/.test(f.path));

  if (!file) {
    return { defaultsTouched: false, evidence: null };
  }

  for (const line of file.text.split('\n')) {
    if (line.startsWith('+++') || line.startsWith('---')) {
      continue;
    }
    if (!line.startsWith('-')) {
      continue;
    }

    const content = line.slice(1).trimStart();

    if (content === '' || content.startsWith('*') || content.startsWith('/*') || content.startsWith('//')) {
      continue;
    }

    return { defaultsTouched: true, evidence: line.trim() };
  }

  return { defaultsTouched: false, evidence: null };
}

/**
 * Entries the diff ADDS to `REMOVED_OPTIONS` (`handsontable/src/core.ts`) or
 * `REMOVED_HOOKS` (`handsontable/src/core/hooks/constants.ts`): the policy's
 * way of removing an option or hook once its deprecation ends. The name stays
 * in the file, so the removed-name search never sees it; this is the signal
 * that does.
 *
 * A hook entry is an added `['name', 'X.Y.Z']` line. An option entry is an
 * added `name: 'x'` line in a hunk that also adds a `version:` line, because
 * an entry is added whole. Deprecated-hook entries carry a message, not a
 * version, so they do not match.
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ removedRegistryAdded: { name: string, registry: string }[], evidence: string | null }}
 */
export function detectRemovedRegistryAdded(files) {
  const added = [];
  const hooks = files.find((f) => f.path === 'handsontable/src/core/hooks/constants.ts');
  const core = files.find((f) => f.path === 'handsontable/src/core.ts');

  for (const line of hooks ? changedLines(hooks.text, '+') : []) {
    const m = line.match(/^\+\s*\['([A-Za-z]\w*)',\s*'\d+\.\d+\.\d+'\]/);

    if (m) {
      added.push({ name: m[1], registry: 'REMOVED_HOOKS' });
    }
  }

  for (const hunk of core ? hunkTexts(core.text) : []) {
    const lines = changedLines(hunk, '+');

    if (lines.some((line) => /^\+\s*version:/.test(line))) {
      for (const line of lines) {
        const m = line.match(/^\+\s*name:\s*'([A-Za-z]\w*)'/);

        if (m) {
          added.push({ name: m[1], registry: 'REMOVED_OPTIONS' });
        }
      }
    }
  }

  return {
    removedRegistryAdded: added,
    evidence: added.length > 0 ? added.map((a) => `${a.name} -> ${a.registry}`).join(', ') : null,
  };
}

/**
 * Run every declared-signal detector over one commit's per-file diff.
 *
 * @param {{ path: string, text: string }[]} files `splitDiffByFile()` output,
 *   unfiltered by changelog scope.
 * @returns {{
 *   breakingEntry: boolean, removedRegistryTouched: boolean,
 *   deprecationWarnAdded: boolean, defaultsTouched: boolean,
 *   removedRegistryAdded: { name: string, registry: string }[],
 *   evidence: Record<string, string | null>
 * }}
 */
export function declaredSignals(files) {
  const breakingEntry = detectBreakingEntry(files);
  const removedRegistryTouched = detectRemovedRegistryTouched(files);
  const deprecationWarnAdded = detectDeprecationWarnAdded(files);
  const defaultsTouched = detectDefaultsTouched(files);
  const removedRegistryAdded = detectRemovedRegistryAdded(files);

  return {
    removedRegistryAdded: removedRegistryAdded.removedRegistryAdded,
    breakingEntry: breakingEntry.breakingEntry,
    removedRegistryTouched: removedRegistryTouched.removedRegistryTouched,
    deprecationWarnAdded: deprecationWarnAdded.deprecationWarnAdded,
    defaultsTouched: defaultsTouched.defaultsTouched,
    evidence: {
      breakingEntry: breakingEntry.evidence,
      removedRegistryTouched: removedRegistryTouched.evidence,
      deprecationWarnAdded: deprecationWarnAdded.evidence,
      defaultsTouched: defaultsTouched.evidence,
      removedRegistryAdded: removedRegistryAdded.evidence,
    },
  };
}
