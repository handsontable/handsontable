import { constants } from 'node:fs';
import { access, lstat, open, realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, parse, posix, relative, resolve, sep } from 'node:path';
import { adapterFor, isCandidate } from './adapters/index.mjs';
import { unifiedDiff } from './diff.mjs';
import { UsageError } from './errors.mjs';
import { discover, firstLinkOn, resolvesInside } from './discover.mjs';
import { insideRelative, leavesDirectory, realpathNative, toPosix } from './lib/paths.mjs';
import { StaleFileError, writeFileSafely } from './lib/safe-write.mjs';
import { redact } from './lib/redact.mjs';
import { GitError, GitNotFoundError, dirtyPaths, hiddenPaths, isGitRepo, isTracked } from './git.mjs';
import { packageFilesAbove, registerPackageDir } from './lib/facts.mjs';
import { findCatalog } from './lib/pnpm-catalog.mjs';
import { NotUtf8Error, readUtf8, stripBom } from './lib/text-file.mjs';
import { unreachedPackageNotes } from './lib/unreached-package.mjs';
import { modeOf, rewrites } from './lib/safety.mjs';
import { MarkerCarriers } from './lib/carrier.mjs';
import { anchorsAbove, arrayOfTarget, createMarkerIndex, cssTargetAt } from './lib/marker.mjs';
import {
  addCssTodo, addJsTodo, collectComments, formatTodo, hasEarlierRuleTodo, hasEarlierTodo, hasJsTodo, hasTwinTodo,
  lineOf, restateTodo,
} from './lib/todo.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests, matchesOnly } from './manifest.mjs';
import { REPORT_TITLE, Report, SKIPPED_RULE_ID, plural } from './report.mjs';
import { registry as defaultRegistry } from './transforms/index.mjs';
import {
  compareVersions,
  defaultTo,
  detectProjectVersion,
  minimumOfRange,
  oldestCovered,
  parseVersion,
  resolveFrom,
  resolveTo,
  selectManifests,
  uncoveredSteps,
} from './versions.mjs';

const SEVERITIES = new Set(['changed', 'manual', 'warning']);

/**
 * Largest file, in bytes, the run reads. A bigger file is skipped with a warning in the report. `--max-file-size`
 * changes it.
 */
export const MAX_FILE_BYTES = 1024 * 1024;

/**
 * Longest line, in characters, of a file the run analyzes. A minified bundle or a data blob that names Handsontable
 * costs a full parse and a walk of the whole tree although it is no source to migrate, and the size cap alone does not
 * stop it (a single line of 800 KB is under it). A file with a longer line is skipped and reported, as a file above
 * `MAX_FILE_BYTES` is. The longest line of any example in the documentation is about 1,500 characters, and of any
 * fixture about 600. A `package.json` is exempt: it is edited by offset and never parsed into a tree.
 */
export const MAX_LINE_LENGTH = 20000;

/**
 * Tell whether a text has a line longer than `MAX_LINE_LENGTH`. One pass, no copy.
 *
 * @param {string} text The file text.
 * @returns {boolean} `true` when `MAX_LINE_LENGTH + 1` characters in a row hold no line break.
 */
function hasVeryLongLine(text) {
  let start = 0;

  for (let index = 0; index <= text.length; index += 1) {
    const code = index === text.length ? 10 : text.charCodeAt(index);

    if (code === 10 || code === 13) {
      if (index - start > MAX_LINE_LENGTH) {
        return true;
      }

      start = index + 1;
    }
  }

  return false;
}

/**
 * Milliseconds between progress reports while a run visits files.
 */
export const PROGRESS_INTERVAL_MS = 2000;

/**
 * A size for a message: bytes below 1 KB, kilobytes with one decimal above.
 *
 * @param {number} bytes The size in bytes.
 * @returns {string} For example `300 bytes`, `1 byte`, or `1.5 KB`.
 */
export function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}` : `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * The report entry that says a file, or a block of it, was not analyzed.
 *
 * @param {string} file Project-relative path.
 * @param {number|null} line One-based line of the block, or `null` for the whole file.
 * @param {string} message Why, and what to do.
 * @returns {import('./types.mjs').ReportEntry} A `skipped-file` warning.
 */
function skippedEntry(file, line, message) {
  return { ruleId: SKIPPED_RULE_ID, severity: 'warning', file, line, message, guideUrl: null };
}

/**
 * The entries for what an adapter could not read: blocks of a Vue file (`<style lang="less">`, `src=`), the
 * inline scripts of an HTML page, or a whole file of a kind the tool has no parser for.
 *
 * @param {import('./types.mjs').Adapter} adapter The adapter of the file.
 * @param {import('./types.mjs').ParseHandle|null} handle The parse result, `null` before parsing.
 * @param {string} source File text.
 * @param {string} filePath Project-relative path.
 * @param {Set<string>} [files] The project files the run reads. A `src` block that points at one of them is not skipped.
 * @param {string[]} [checks] What to check by hand in an inline script, from the selected manifests.
 * @returns {import('./types.mjs').ReportEntry[]} The entries, possibly none.
 */
function skippedEntries(adapter, handle, source, filePath, files, checks) {
  const entries = [];

  for (const block of handle?.skippedBlocks ?? []) {
    // A relative `src` path names a file; an alias (`@/x.css`, `~x`) cannot be resolved here.
    const target = /^\.{1,2}\//.test(block.srcPath ?? '')
      ? posix.normalize(posix.join(posix.dirname(filePath), block.srcPath)) : null;

    // A `src` block whose file the run reads as a project file of its own is not skipped: the run analyzes it there.
    if (block.relevant && !(target !== null && files?.has(target))) {
      const tag = `<${block.type}${block.lang ? ` lang="${block.lang}"` : ''}${block.src ? ' src' : ''}>`;
      const reads = target === null ? '' : ` It reads ${target}, which is not part of this run.`;

      entries.push(skippedEntry(filePath, block.line, `A ${tag} block was not analyzed.${reads} Check it by hand.`));
    }
  }

  const notes = adapter.skipNotes?.(source, checks) ?? [];

  entries.push(...notes.map(note => skippedEntry(filePath, note.line, note.message)));

  return entries;
}

/**
 * First line of a message, so a multi-line parser error stays one report line.
 *
 * @param {unknown} message Error text.
 * @returns {string} The first line.
 */
function firstLine(message) {
  return String(message).split('\n')[0];
}

/**
 * What the report says about something discovery left out. A symbolic link whose target is inside the project says
 * where it points, and whether the run migrates the target as its own file. A link to a place outside the project, or
 * to nothing, keeps the general advice: a link can point outside, and that project is migrated on its own. A
 * submodule or an embedded repository says to run the tool inside it, a directory the walk skipped says how to
 * include it, and a directory it could not read names the error.
 *
 * @param {string} cwd Project directory.
 * @param {import('./discover.mjs').SkippedLink} item What was left out.
 * @param {string[]} files The files the run migrates.
 * @returns {Promise<string>} The text of the entry.
 */
async function skippedMessage(cwd, item, files) {
  const file = item.file;

  if (item.kind === 'repository') {
    return 'This is a submodule or an embedded git repository, so the tool did not read it. Run the tool inside it.';
  }

  if (item.kind === 'unreadable') {
    return `The tool could not read this directory (${item.reason ?? 'error'}), so it skipped it and everything below `
      + 'it. Fix the permissions and run the tool again.';
  }

  if (item.kind === 'directory') {
    return 'This directory holds files the tool reads, but outside a git repository it cannot tell build output from '
      + `source, so it skipped it. To include it, name it: migrate ${file}`;
  }

  const general = 'This is a symbolic link, so it was not followed. A link can point outside the project. Migrate '
    + 'the file it points to in its own project.';

  try {
    const [root, real] = await Promise.all([realpath(cwd), realpath(join(cwd, file))]);
    const target = insideRelative(root, real);

    if (target === null || target === '') {
      return general;
    }

    const inRun = files.includes(target) || files.some(candidate => candidate.startsWith(`${target}/`));

    return `This is a symbolic link to ${target}, not followed. ${inRun
      ? 'The target is migrated as its own file.' : 'The target is not part of this run.'}`;
  } catch {
    return general;
  }
}

/**
 * The entries of a file whose edits were not applied (the write failed, or the file sits outside the project). A
 * `changed` entry says what the tool did, so it goes, and so does a note for the whole run (`scope: 'run'`), which
 * says what a rewrite changed: it would list a file the tool did not touch. A `manual` entry keeps its place, but its
 * marker never reached the file, so it is no longer "marked in the code".
 *
 * @param {import('./types.mjs').ReportEntry[]} entries The entries of the file.
 * @returns {import('./types.mjs').ReportEntry[]} The entries that are still true.
 */
function withoutApplied(entries) {
  return entries.filter(entry => entry.severity !== 'changed' && entry.scope !== 'run')
    .map(entry => (entry.marked ? { ...entry, marked: false } : entry));
}

/**
 * Say where and why a parser gave up. An error at the end of the text (a missing bracket or quote) is reported on the
 * last line of the file, as `unexpected end of file`: the parser's own position is the line after it. Any other error
 * keeps the parser's message and shows the text of the line, cut to 80 characters.
 *
 * @param {object} error The error the parser threw: `loc`, `pos`, `reason`, and `message` are read when present.
 * @param {string} source The file text.
 * @returns {{line: number|null, text: string, quoted: string[]}} The one-based line, the sentence that follows
 * `skipped:`, and the part of the sentence that is a line of the user's file (`quoted`, for the Markdown report).
 */
function describeParseError(error, source) {
  const lines = source.replace(/\r?\n$/, '').split(/\r?\n/);
  const at = Number.isInteger(error.loc?.line) ? error.loc.line : (error.line ?? null);
  const position = error.pos ?? error.loc?.index;
  const pastEnd = Number.isInteger(position) && position >= source.trimEnd().length;
  const atEnd = at !== null && (at > lines.length || pastEnd);

  if (atEnd) {
    return { line: lines.length, text: 'unexpected end of file.', quoted: [] };
  }

  const reason = firstLine(error.reason ?? error.message).replace(/ \(\d+:\d+\)$/, '').replace(/[.]$/, '');
  const shown = at === null ? '' : lines[at - 1]?.trim().slice(0, 80);

  return { line: at, text: shown ? `${reason}, at: ${shown}` : `${reason}.`, quoted: shown ? [shown] : [] };
}

/**
 * Order the transform steps that apply to one file in one phase: versions ascending, and inside a version
 * the transform modules in the registry's fixed kind order. A module that serves several kinds appears once,
 * at the position of its earliest kind, with all its rules in manifest order.
 *
 * @param {import('./types.mjs').Plan} plan The selected rules.
 * @param {import('./transforms/index.mjs').Registry} registry The transform registry.
 * @param {1|2} phase Phase number. Phase 2 runs only the registry's phase 2 kinds. Phase 1 also returns the
 * phase 2 rules of a module that declares `scan`, flagged `scan: true`, so it can collect facts.
 * @returns {Array<{transform: import('./types.mjs').Transform, rules: import('./types.mjs').Rule[],
 * scan: boolean}>} Steps.
 */
function orderSteps(plan, registry, phase) {
  const steps = [];

  for (const { rules } of plan.versions) {
    const used = new Set();

    for (const kind of registry.order) {
      const transform = registry.byKind.get(kind);
      const scan = phase === 1 && Boolean(transform?.scan) && registry.phaseTwo.has(kind);

      if (!transform || used.has(transform) || (registry.phaseTwo.has(kind) !== (phase === 2) && !scan)) {
        continue;
      }

      used.add(transform);

      const own = rules.filter(rule => transform.kinds.includes(rule.kind)
        && (registry.phaseTwo.has(rule.kind) === (phase === 2) || scan));

      if (own.length > 0) {
        steps.push({ transform, rules: own, scan });
      }
    }
  }

  return steps;
}

/**
 * File kinds a step may visit. A scan step (a phase 2 module run in phase 1 to collect facts) visits the kinds
 * its `scan.fileKinds` lists, every other step the module's `fileKinds`.
 *
 * @param {{transform: import('./types.mjs').Transform, scan: boolean}} step The step.
 * @returns {import('./types.mjs').FileKind[]} The kinds.
 */
function stepFileKinds(step) {
  return step.scan ? step.transform.scan.fileKinds : step.transform.fileKinds;
}

const scans = new WeakMap();

/**
 * The comments of a js part as the parser attached them, for the TODO dedupe. The list is built on the first
 * call and kept for the part, because only the original comments matter: a comment this run inserts sits on a
 * node the writer already knows.
 *
 * @param {import('./types.mjs').Part} part A `js` part.
 * @returns {import('./lib/todo.mjs').CommentScan} The scan.
 */
function commentScan(part) {
  if (!scans.has(part)) {
    let list = null;

    scans.set(part, {
      source: part.source,
      comments() {
        list = list ?? collectComments(part.root.get().node);

        return list;
      },
    });
  }

  return scans.get(part);
}

/**
 * The carriers of a `js` part: the comments and removals that are made as text after printing (see `MarkerCarriers`).
 * Made on the first call and kept on the part, where `printJsPart()` reads them.
 *
 * @param {import('./types.mjs').Part} part A `js` part.
 * @returns {MarkerCarriers} The carriers.
 */
function carriersOf(part) {
  part.carriers = part.carriers ?? new MarkerCarriers(part.j, part.source, part.root);

  return part.carriers;
}

/**
 * Which kind of Vue style block a css part comes from.
 *
 * @param {import('./types.mjs').Part} part The part.
 * @returns {'scoped'|'module'|null} `scoped` for `<style scoped>`, `module` for `<style module>`, else `null`.
 */
function cssScopeOf(part) {
  if (part.scoped) {
    return 'scoped';
  }

  return part.module ? 'module' : null;
}

/**
 * Whether a `manual` entry gets a TODO marker in the code. The default is yes, in a part that holds comments (js and
 * css). A run-wide note, an entry that says `todo: false`, and a rule that says `todo: false` have none, and neither
 * has an entry the tool cannot place on a line.
 *
 * @param {import('./types.mjs').ReportInput} entry The entry as the transform reported it.
 * @param {import('./types.mjs').Rule|undefined} owner The rule that reported it.
 * @returns {boolean} `true` when a marker belongs with the entry.
 */
function wantsMarker(entry, owner) {
  return entry.severity === 'manual' && entry.scope !== 'run' && entry.todo !== false && Boolean(owner)
    && owner.todo !== false && (Number.isInteger(entry.line) || (entry.lines ?? []).some(Number.isInteger));
}

/**
 * Build the context for one part of a file. See the `Ctx` typedef in `types.mjs` for the contract.
 *
 * @param {object} args Arguments.
 * @param {string} args.filePath Project-relative path.
 * @param {import('./types.mjs').Part} args.part The part.
 * @param {import('./types.mjs').Plan} args.plan The selected rules, for guide links.
 * @param {import('./types.mjs').ReportEntry[]} args.entries Where report entries are collected.
 * @param {Set<string>} args.facts Shared facts.
 * @param {{aggressive: boolean, dryRun: boolean, todo: boolean}} args.options Run options.
 * @param {import('./types.mjs').CatalogInfo|null} args.catalog The pnpm catalogs of a `package.json`, or `null`.
 * @param {import('./types.mjs').AncestorManifest[]} args.ancestors The `package.json` files above this one.
 * @returns {{ctx: import('./types.mjs').Ctx, marks: Mark[]}} The context, and the markers its `manual` entries ask
 * for. `applyMarkers()` places them once every transform has run.
 */
function createContext({ filePath, part, plan, entries, facts, options, catalog, ancestors }) {
  const merged = new Map();
  const marks = [];
  const twinTargets = new Set([...plan.rulesById.values()].flatMap(rule => rule.twins ?? []));
  // Rules of different migrations that report one spot share a key: the earliest owns the entry and the marker.
  const twinKeyOf = (rule, line) => {
    const root = rule?.twins?.[0] ?? (twinTargets.has(rule?.id) ? rule.id : null);

    return root && Number.isInteger(line) ? `twin:${root}:${line}` : undefined;
  };
  const annotatable = part.fileKind === 'js' || part.fileKind === 'css';
  // The comments `todo()` wrote into the tree, by report entry, so a later twin can restate them.
  const written = new Map();
  // A rule of a chain keeps its id, its link, and its marker, and says what the latest twin of the plan says: the entry
  // gets the message of the later twin, and so does the marker, as long as it is not placed yet or is a comment this
  // run wrote. A comment of an earlier run stays as it was.
  const adopt = (existing, ruleId, commentText, message) => {
    if (existing.severity !== 'manual' || existing.ruleId === ruleId) {
      return;
    }

    existing.message = message;
    marks.filter(mark => mark.stored === existing).forEach((mark) => {
      mark.text = message;
    });

    const own = written.get(existing);

    own?.comments.forEach(item => restateTodo(item, formatTodo(own.ruleId, commentText, own.guideUrl)));
  };
  const store = (entry, { mark }) => {
    if (typeof entry?.ruleId !== 'string' || !SEVERITIES.has(entry.severity) || typeof entry.message !== 'string') {
      throw new Error(`Invalid report entry: ${JSON.stringify(entry)}`);
    }

    const owner = plan.rulesById.get(entry.ruleId);
    const key = entry.mergeKey ?? twinKeyOf(owner, entry.line);
    const policy = entry.mergeKey === undefined && key ? 'earliest' : entry.merge;

    if (entry.severity === 'changed' && owner && !rewrites(owner)) {
      throw new Error(`Rule ${entry.ruleId} is not safe, so it must not edit code: ${entry.message}`);
    }

    const stored = {
      ruleId: entry.ruleId,
      severity: entry.severity,
      file: filePath,
      line: Number.isInteger(entry.line) ? entry.line + part.lineOffset : null,
      message: entry.message,
      guideUrl: plan.rulesById.get(entry.ruleId)?.guideUrl ?? null,
      ...(entry.scope === 'run' ? { scope: 'run' } : {}),
      ...(Array.isArray(entry.lines) ? { lines: entry.lines.map(line => line + part.lineOffset) } : {}),
    };

    if (typeof key === 'string' && merged.has(key)) {
      if (policy === 'earliest' && entry.mergeKey === undefined) {
        adopt(merged.get(key), entry.ruleId, entry.message, entry.message);
      }

      // A later step of the run says the same thing about the same spot. By default the net result replaces the
      // first entry (a range bump from the range the user wrote to the latest target). An entry that says
      // `merge: 'earliest'` keeps the first one, so the rule of the earliest migration owns the id, the message, and
      // the guide link, and its marker.
      if (policy !== 'earliest') {
        Object.assign(merged.get(key), stored);
      }

      return merged.get(key);
    }

    entries.push(stored);

    if (typeof key === 'string') {
      merged.set(key, stored);
    }

    const markersOn = options.todo !== false && options.markers !== false;

    if (mark && annotatable && markersOn && wantsMarker(entry, owner)) {
      const found = [{ line: entry.markLine ?? entry.line, column: entry.markColumn },
        ...(entry.lines ?? []).map((line, index) => ({ line, column: entry.markColumns?.[index] }))];
      const sites = [];

      for (const site of found.filter(item => Number.isInteger(item.line))) {
        if (!sites.some(item => item.line === site.line && item.column === site.column)) {
          sites.push(site);
        }
      }

      marks.push({ stored, ruleId: entry.ruleId, text: entry.message, sites });
    }

    return stored;
  };

  const report = (entry) => {
    store(entry, { mark: true });
  };

  const markChanged = () => {
    part.changed = true;
    part.revision = (part.revision ?? 0) + 1;
  };

  // What a transform derives from the tree of a part, kept for the next transform and the next version while no edit
  // was recorded. `markChanged()` is the one place that records an edit, so the revision it counts is the key: a value
  // of an older revision is dropped on the next call.
  const derived = (key, compute) => {
    const revision = part.revision ?? 0;

    if (part.derived?.revision !== revision) {
      part.derived = { revision, values: new Map() };
    }

    if (!part.derived.values.has(key)) {
      part.derived.values.set(key, compute());
    }

    return part.derived.values.get(key);
  };

  // The paths of the nodes of a js part, built when a transform names a node and not a path: the TODO writer climbs
  // the ancestors of a target, which a node alone does not give.
  let pathIndex = null;
  const pathOf = (target) => {
    if (target.node) {
      return target;
    }

    if (pathIndex === null) {
      pathIndex = new Map();
      part.root.find(part.j.Node).forEach(path => pathIndex.set(path.node, path));
    }

    return pathIndex.get(target) ?? null;
  };

  const commentInto = (target, ruleId, text, sink) => {
    if (options.todo === false) {
      return false;
    }

    const owner = plan.rulesById.get(ruleId);
    const guideUrl = owner?.guide ? owner.guideUrl : null;
    let inserted = false;

    if (part.fileKind === 'js') {
      // A transform picks the node by the layout it sees. A run that wrote the comment can have changed that layout
      // (a comment on a one-line object spreads it over lines, so a property that had no line of its own has one),
      // and the next run then picks a node inside the one that holds the comment. The comment of an earlier run in
      // front of any anchor above the target is the same comment. So is one of the same rule worded another way: the run
      // that spread the object can also change which wording a rule picks for the spot (a rule that deleted a key of
      // the object this site sits in makes the next run see another kind of object), and a rule marks a site once.
      const scan = commentScan(part);
      const path = pathOf(target);
      const twins = owner?.twins ?? [];
      const earlier = path !== null && anchorsAbove(path)
        .some(node => hasEarlierTodo(node, ruleId, text, guideUrl, scan)
          || (twins.length > 0 && hasTwinTodo(node, twins, scan))
          || hasEarlierRuleTodo(node, ruleId, scan));

      // The comment goes into the tree, so every later rule sees it and can move it with a node. `commit()` of the
      // carriers takes it out again, after the last rule, when its statement is still as it was parsed.
      inserted = !earlier && addJsTodo(part.j, target, ruleId, text, guideUrl, scan, sink);
    } else if (part.fileKind === 'css') {
      inserted = addCssTodo(target, ruleId, text, guideUrl, part.document, owner?.twins ?? []);
    }

    if (inserted) {
      markChanged();
    }

    return inserted;
  };

  const comment = (target, ruleId, text) => commentInto(target, ruleId, text, null);

  const todo = (target, ruleId, text, shortText) => {
    const twinKey = twinKeyOf(plan.rulesById.get(ruleId), lineOf(target) ?? undefined);

    // A rule of an earlier migration already reports this spot in this run, and it owns the marker. It says what this
    // later rule says.
    if (twinKey && merged.has(twinKey)) {
      adopt(merged.get(twinKey), ruleId, shortText ?? text, text);

      return false;
    }

    const sink = [];
    const inserted = commentInto(target, ruleId, shortText ?? text, sink);
    const stored = store({ ruleId, severity: 'manual', line: lineOf(target) ?? undefined, message: text },
      { mark: false });

    if (sink.length > 0) {
      const owner = plan.rulesById.get(ruleId);

      written.set(stored, { ruleId, guideUrl: owner?.guide ? owner.guideUrl : null, comments: sink });
    }

    // The comment is in the code, put there now or by an earlier run, unless markers are off or the part holds none.
    if (annotatable && options.todo !== false) {
      stored.marked = true;
    }

    return inserted;
  };

  const removeStatement = (path, removal) => {
    const removed = part.fileKind === 'js' && carriersOf(part).removeStatement(path, removal);

    if (removed) {
      part.revision = (part.revision ?? 0) + 1;
    }

    return removed;
  };

  const ctx = {
    filePath,
    fileKind: part.fileKind,
    source: part.source,
    parser: part.parser ?? null,
    j: part.j,
    root: part.root,
    json: part.json ?? null,
    css: part.document ?? null,
    report,
    todo,
    comment,
    removeStatement,
    derived,
    cssScope: cssScopeOf(part),
    lineOffset: part.lineOffset,
    fromText: plan.fromText ?? '',
    facts,
    options,
    catalog,
    ancestors,
    markChanged,
  };

  return { ctx, marks };
}

/**
 * A marker that a `manual` entry asks for.
 *
 * @typedef {object} Mark
 * @property {import('./types.mjs').ReportEntry} stored The entry in the report. It gets `marked: true` when its
 * marker is in the code.
 * @property {string} ruleId Id of the rule.
 * @property {string} text The message of the entry. The comment keeps its first sentence.
 * @property {Array<{line: number, column?: number}>} sites Places of the entry inside the part, `line` first, then every
 * line of a collapsed group. A column picks one of several JSX elements that share the line.
 */

/**
 * Leave the markers the `manual` entries of a part asked for, once all transforms have run, so every line number
 * still names the node it was taken from. A marker goes before the statement, property, or JSX element on its line
 * (see `markerTarget()`), and a collapsed entry gets one at each of its lines. A comment that is already there, from an
 * earlier run, is found and not added again. A line that has no node to hang a comment on leaves its entry
 * report-only.
 *
 * @param {import('./types.mjs').Part} part The part.
 * @param {Mark[]} marks The markers its context collected.
 * @param {import('./types.mjs').Plan} plan The selected rules, for guide links.
 * @returns {void}
 */
function applyMarkers(part, marks, plan) {
  if (marks.length === 0) {
    return;
  }

  const isJs = part.fileKind === 'js';
  const find = isJs ? createMarkerIndex(part.j, part.root) : line => cssTargetAt(part.root, line);
  const carriers = isJs ? carriersOf(part) : null;

  for (const mark of marks) {
    const owner = plan.rulesById.get(mark.ruleId);
    const guideUrl = owner?.guide ? owner.guideUrl : null;
    let placed = false;

    for (const { line, column } of mark.sites) {
      const { targets, above } = isJs ? find(line, column)
        : { targets: [find(line)].flat().filter(Boolean), above: [] };

      if (targets.length === 0) {
        continue;
      }

      let inserted = false;

      if (isJs) {
        // The same comment further up the chain counts: an earlier run may have put it on the element of a one-line
        // object that the printer then spread over several lines. So does one in front of any node above, from a
        // run before this one, because that run saw the code on the same line as the node that took the comment.
        const scan = commentScan(part);
        const body = formatTodo(mark.ruleId, mark.text, guideUrl);
        const twins = owner?.twins ?? [];
        const there = targets.some(target => hasJsTodo(target, mark.ruleId, mark.text, guideUrl, scan))
          || above.some(node => hasEarlierTodo(node, mark.ruleId, mark.text, guideUrl, scan))
          || (twins.length > 0 && [...targets, ...above].some(item => hasTwinTodo(item.node ?? item, twins, scan)))
          || [...targets, ...above].some(item => hasEarlierRuleTodo(item.node ?? item, mark.ruleId, scan))
          || carriers.has(targets[0], body);

        // An untouched array element takes its comment as text, so the printer leaves its layout alone. A statement
        // gets it in the tree, and `commit()` of the carriers takes it out again when it can.
        inserted = !there && (carriers.add(arrayOfTarget(targets[0]), targets[0], body)
          || addJsTodo(part.j, targets[0], mark.ruleId, mark.text, guideUrl, scan));
      } else {
        inserted = addCssTodo(targets[0], mark.ruleId, mark.text, guideUrl, part.document, owner?.twins ?? []);
      }

      part.changed = part.changed || inserted;
      placed = true;
    }

    if (placed) {
      mark.stored.marked = true;
    }
  }
}

/**
 * Transform the text of one file. This is a pure function: it reads and writes nothing, so the run loop, the
 * fixture tests, and the idempotency checks all call it directly.
 *
 * It picks the adapter by extension, skips the file when no selected rule can apply or the adapter's cheap
 * precheck does not match, parses once, and applies the steps in order to every part. A parse failure or a
 * throwing transform yields a warning entry and leaves the file untouched.
 *
 * @param {object} args Arguments.
 * @param {string} args.filePath Project-relative path with forward slashes. Only its name and extension are used.
 * @param {string} args.source File text.
 * @param {import('./types.mjs').Plan} args.plan The selected rules.
 * @param {Partial<{aggressive: boolean, dryRun: boolean, todo: boolean}>} [args.options] Run options.
 * @param {Set<string>} [args.facts] Facts shared across the run.
 * @param {import('./transforms/index.mjs').Registry} [args.registry] Transform registry.
 * @param {1|2} [args.phase] Phase number. Defaults to 1.
 * @param {Set<string>} [args.projectFiles] The project files the run reads, for a `src` block that points at one.
 * @param {import('./types.mjs').CatalogInfo|null} [args.catalog] The pnpm catalogs that apply to a `package.json`.
 * @param {import('./types.mjs').AncestorManifest[]} [args.ancestors] The `package.json` files above this one, nearest
 * first, parsed. A fixture has none.
 * @param {object} [args.hooks] Injection point for tests. `afterCommit(part)` runs for each part once its carriers
 * committed and before it is printed, so a test can break a sentinel and watch the file stay as it was. It exists for
 * nothing else.
 * @returns {Promise<{output: string, changed: boolean, entries: import('./types.mjs').ReportEntry[],
 * skipped: string|null}>} The new text, whether it differs, the report entries, and why the file was skipped.
 */
export async function transformFile({
  filePath,
  source,
  plan,
  options = {},
  facts = new Set(),
  registry = defaultRegistry,
  phase = 1,
  projectFiles,
  catalog = null,
  ancestors = [],
  hooks = {},
}) {
  const unchanged = skipped => ({ output: source, changed: false, entries: [], skipped });
  const adapter = adapterFor(filePath);

  if (!adapter || !adapter.implemented) {
    return unchanged('no-adapter');
  }

  if (adapter.skipReason) {
    return phase === 1 && adapter.precheck.test(source)
      ? { ...unchanged(null), entries: [skippedEntry(filePath, null, adapter.skipReason)] }
      : unchanged('precheck');
  }

  const candidates = orderSteps(plan, registry, phase)
    .filter(step => stepFileKinds(step).some(kind => adapter.fileKinds.includes(kind)));

  if (candidates.length === 0) {
    return unchanged('no-transform');
  }

  const precheckOf = step => (step.scan && step.transform.scan.precheck) || adapter.precheck;
  const steps = candidates.flatMap((step) => {
    if (precheckOf(step).test(source)) {
      return [step];
    }

    // A module may keep a few rules alive on a file the precheck rejects, and only those rules then run.
    const rescued = step.transform.rescue?.(step.rules, source) ?? [];

    return rescued.length > 0 ? [{ ...step, rules: rescued }] : [];
  });

  if (steps.length === 0) {
    return unchanged('precheck');
  }

  const entries = [];
  let handle;

  try {
    handle = adapter.parse(source, filePath);
  } catch (error) {
    const where = describeParseError(error, source);

    return {
      ...unchanged(null),
      entries: [{
        ruleId: 'parse-error',
        severity: 'warning',
        file: filePath,
        line: where.line,
        message: `The file could not be parsed and was skipped: ${where.text}`,
        quoted: where.quoted,
        guideUrl: null,
      }],
    };
  }

  if (phase === 1) {
    entries.push(...skippedEntries(adapter, handle, source, filePath, projectFiles, plan.inlineScriptChecks));
  }

  const fullOptions = { aggressive: false, dryRun: false, todo: true, ...options };

  try {
    for (const part of handle.parts) {
      const { ctx, marks } = createContext({
        filePath, part, plan, entries, facts, options: fullOptions, catalog, ancestors,
      });

      for (const step of steps) {
        if (stepFileKinds(step).includes(part.fileKind)) {
          await step.transform.apply(ctx, step.rules);
        }
      }

      applyMarkers(part, marks, plan);

      // After the last mark: the comments and removals that are made as text become sentinels in the tree.
      if (part.fileKind === 'js' && part.changed) {
        carriersOf(part).commit();
        hooks.afterCommit?.(part);
      }
    }
  } catch (error) {
    return {
      ...unchanged(null),
      entries: [{
        ruleId: 'transform-error',
        severity: 'warning',
        file: filePath,
        line: null,
        message: `The tool failed on this file and left it unchanged: ${error.message}`,
        guideUrl: null,
      }],
    };
  }

  let output = source;

  try {
    output = handle.parts.some(part => part.changed) ? adapter.print(handle, source) : source;
  } catch (error) {
    return {
      ...unchanged(null),
      entries: [{
        ruleId: 'transform-error',
        severity: 'warning',
        file: filePath,
        line: null,
        message: `The tool failed on this file and left it unchanged: ${error.message}`,
        guideUrl: null,
      }],
    };
  }

  return { output, changed: output !== source, entries, skipped: null };
}

/**
 * The symbolic link that makes a report target unsafe, or `null`. The target is unsafe when:
 *
 * - it sits in the project directory (or below it) and a component below the project directory is a link, the target
 *   itself included, because `writeFile` would follow it out of the project or into another file of it;
 * - it is a link itself, wherever it is; or
 * - it is spelled outside the project, but a link on the way makes its directory land inside the project, so the
 *   report would be written there although the path looks like it is not.
 *
 * A link on the part of the path that lies outside the project is the operating system's business and harmless
 * otherwise (`/tmp` is a link to `/private/tmp` on macOS, and so is `/var`).
 *
 * @param {string} cwd Project directory.
 * @param {string} target Absolute path of the report.
 * @returns {Promise<string|null>} The absolute path of the link, as spelled in `target`, or `null`.
 */
async function linkOnReportPath(cwd, target) {
  const rel = relative(cwd, target);

  if (!leavesDirectory(rel)) {
    const link = await firstLinkOn(cwd, rel);

    return link === null ? null : join(cwd, link);
  }

  if ((await lstat(target).catch(() => null))?.isSymbolicLink()) {
    return target;
  }

  const { root } = parse(target);
  const segments = relative(root, dirname(target)).split(sep).filter(Boolean);
  const [project, directory] = await Promise.all([realpathNative(cwd), realpathNative(dirname(target))])
    .catch(() => [null, null]);

  if (project === null || insideRelative(project, directory) === null) {
    return null;
  }

  // The directory lands inside the project: name the first link on the way that leads there.
  for (let count = 1; count <= segments.length; count += 1) {
    const prefix = join(root, ...segments.slice(0, count));

    if ((await lstat(prefix).catch(() => null))?.isSymbolicLink()) {
      const real = await realpathNative(prefix).catch(() => null);

      if (real !== null && insideRelative(project, real) !== null) {
        return prefix;
      }
    }
  }

  return null;
}

/**
 * Tell whether two paths name one file. A file system that ignores letter case (macOS, Windows) gives `src/A.JS` and
 * `src/a.js` different strings, and a hard link gives two names to one inode, so the answer comes from the file
 * system: the same real path as it stores it, or the same device and inode.
 *
 * @param {string} left Absolute path of an existing file.
 * @param {string} right Absolute path of a file that may not exist.
 * @returns {Promise<boolean>} `true` when both paths are one file.
 */
async function isSameFile(left, right) {
  const [leftPath, rightPath, leftInfo, rightInfo] = await Promise.all([
    realpathNative(left).catch(() => null),
    realpathNative(right).catch(() => null),
    stat(left, { bigint: true }).catch(() => null),
    stat(right, { bigint: true }).catch(() => null),
  ]);

  if (leftPath !== null && leftPath === rightPath) {
    return true;
  }

  // An inode of 0 means the file system gave none (some network and FAT volumes on Windows).
  return Boolean(leftInfo && rightInfo) && leftInfo.ino !== 0n && leftInfo.ino === rightInfo.ino
    && leftInfo.dev === rightInfo.dev;
}

const REPORT_HEADER = `# ${REPORT_TITLE}`;

/**
 * Tell whether an existing file is a previous report of the tool, or empty. Only the start of the file is read.
 *
 * @param {string} target Absolute path of an existing file.
 * @returns {Promise<boolean>} `true` for an empty file and for a file whose first line is the report header.
 */
async function isPreviousReport(target) {
  const handle = await open(target, 'r');

  try {
    const buffer = Buffer.alloc(REPORT_HEADER.length + 8);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);

    return bytesRead === 0 || stripBom(buffer.toString('utf8', 0, bytesRead)).startsWith(REPORT_HEADER);
  } finally {
    await handle.close();
  }
}

/**
 * Tell whether a path has a `.git` component, in the folder of the project or below it, or anywhere in an absolute path
 * outside it.
 *
 * @param {string} cwd Project directory.
 * @param {string} target Absolute path.
 * @returns {boolean} `true` when the path names something inside a `.git` directory (or a `.git` file).
 */
function insideGitDirectory(cwd, target) {
  const rel = relative(cwd, target);
  const parts = (leavesDirectory(rel) ? relative(parse(target).root, target) : rel).split(sep);

  return parts.some(part => part.toLowerCase() === '.git');
}

/**
 * Refuse a report path that would overwrite something that is not a previous report: a file git tracks, a file the
 * run is about to migrate, a file with an extension the tool handles (it may be a source file the run did not list,
 * and a report has no business there), a symbolic link on the way, which `writeFile` would follow, or a file the user
 * cannot write, a path inside a `.git` directory, or an existing file that is not a previous report (its first line is
 * not the report header, `isPreviousReport()`; an empty file passes). A file that does not exist, or the report of the
 * previous run, is fine, inside the project directory or outside it.
 *
 * Files are compared as the file system sees them (`isSameFile()`), so a different letter case or a hard link does not
 * get past the check.
 *
 * @param {string} cwd Project directory.
 * @param {string} reportPath The `--report` value.
 * @param {string[]} files The discovered project files.
 * @param {boolean} repo Whether `cwd` is inside a git work tree.
 * @returns {Promise<void>}
 * @throws {UsageError} When the report would overwrite a project file.
 */
async function assertReportTarget(cwd, reportPath, files, repo) {
  const target = resolve(cwd, reportPath);
  const info = await lstat(target).catch(() => null);
  const folder = dirname(target);
  const folderInfo = await stat(folder).catch(() => null);

  // The report is written after the files are migrated, so a target that cannot be written is refused first.
  if (!folderInfo?.isDirectory()) {
    throw new UsageError(`--report ${reportPath}: the directory ${relative(cwd, folder) || '.'} does not exist. `
      + 'Create it, or choose a file in an existing directory.');
  }

  if (insideGitDirectory(cwd, target)) {
    throw new UsageError(`--report ${reportPath} is inside the .git directory, and the report would damage the `
      + 'repository. Choose another file, for example migration-report.md.');
  }

  const link = await linkOnReportPath(cwd, target);

  if (link !== null) {
    // The link is named by the path the user typed: absolute when they typed an absolute path, else relative to the
    // project directory, as they wrote it.
    const named = isAbsolute(reportPath) ? link : relative(cwd, link);

    throw new UsageError(`--report ${reportPath} is a symbolic link, or sits below one (${named}), and `
      + 'the report would be written through it. Choose another file.');
  }

  if (info?.isDirectory()) {
    throw new UsageError(`--report ${reportPath} is a directory. Choose a file name, for example `
      + `${posix.join(reportPath.split(sep).join('/').replace(/\/+$/, ''), 'migration-report.md')}.`);
  }

  if (!info) {
    await access(folder, constants.W_OK).catch(() => {
      throw new UsageError(`--report ${reportPath}: the directory ${relative(cwd, folder) || '.'} is not writable. `
        + 'Choose another file.');
    });

    return;
  }

  const sameAsProject = (await Promise.all(files.map(file => isSameFile(join(cwd, file), target)))).some(Boolean);
  const stored = await realpathNative(target).catch(() => target);
  const projectFile = sameAsProject || (repo && (await isTracked(cwd, target) || await isTracked(cwd, stored)));

  if (projectFile) {
    throw new UsageError(`--report ${reportPath} would overwrite a project file. Choose another file, for example `
      + 'migration-report.md.');
  }

  if (isCandidate(toPosix(relative(cwd, target)))) {
    throw new UsageError(`--report ${reportPath} is an existing file of a type the tool migrates, so the report `
      + 'would overwrite source. Choose another file, for example migration-report.md.');
  }

  // An existing report that the user cannot write would fail after every file was migrated.
  await access(target, constants.W_OK).catch(() => {
    throw new UsageError(`--report ${reportPath} exists and is not writable. Choose another file.`);
  });

  if (!(await isPreviousReport(target).catch(() => false))) {
    throw new UsageError(`--report ${reportPath} exists and is not a report of this tool (its first line is not `
      + `"${REPORT_HEADER}"), so it would be overwritten. Choose another file, for example migration-report.md.`);
  }
}

/**
 * Read the Handsontable range of every `package.json` under the path arguments, for a run that gave no `--from` where
 * the nearest `package.json` (a monorepo root) names none.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} paths Path arguments relative to `cwd`.
 * @returns {Promise<{found: Array<{file: string, version: string}>, unversioned: {file: string, range: string}|null}>}
 * `found` has one item per `package.json` that declares a `handsontable` range with a version, in path order. A
 * `package.json` whose spec names no version (`catalog:`, `file:`, `link:`, a URL) is skipped, and `unversioned` is
 * the first one.
 */
async function scanPackageVersions(cwd, paths) {
  const found = [];
  let unversioned = null;

  for (const file of (await discover({ cwd, paths })).filter(candidate => basename(candidate) === 'package.json')) {
    let manifest = null;

    try {
      manifest = JSON.parse(stripBom(await readUtf8(join(cwd, file))));
    } catch {
      // A package.json that does not parse names no version.
    }

    for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const range = manifest?.[field]?.handsontable;
      const version = typeof range === 'string' ? minimumOfRange(range) : null;

      if (version) {
        found.push({ file, version });
        break;
      }

      if (typeof range === 'string' && !unversioned) {
        unversioned = { file, range };
      }
    }
  }

  return { found, unversioned };
}

/**
 * Resolve the version range and the selected rules for a run. Shared by `run()` and the CLI's `--list`.
 *
 * @param {object} args Arguments.
 * @param {string} args.cwd Project directory, used to detect the installed version.
 * @param {string[]} [args.paths] Path arguments. With no `from`, the version is detected from the nearest
 * `node_modules/handsontable` or `package.json` of each path, up to `cwd`.
 * @param {string} [args.from] The `--from` text. Detected from the project when absent.
 * @param {string} [args.to] The `--to` text. Defaults to the latest released manifest.
 * @param {string[]} [args.only] Rule ids to keep.
 * @param {boolean} [args.includeDraft] Whether draft manifests may run.
 * @param {boolean} [args.allowUncovered] When `true`, a `--from` below the oldest covered version runs anyway, with
 * a note instead of a refusal.
 * @param {string} [args.versionsDir] Directory with the manifests.
 * @param {boolean} [args.lenientFrom] When `true`, a missing `--from` that cannot be detected means "from the
 * beginning" instead of an error.
 * @returns {Promise<{plan: import('./types.mjs').Plan, selected: import('./types.mjs').Manifest[],
 * notes: string[], reportNotes: string[], fromText: string, toText: string}>} The plan and the facts about the
 * range. `reportNotes` are the notes that also go at the top of the report.
 * @throws {UsageError} For an unusable range, an unknown rule id, or an undetectable `--from`.
 */
export async function resolvePlan({
  cwd,
  paths = [],
  from,
  to,
  only = [],
  includeDraft = false,
  versionsDir = VERSIONS_DIR,
  lenientFrom = false,
  allowUncovered = false,
}) {
  const manifests = await loadManifests(versionsDir);
  const notes = [];
  const reportNotes = [];
  const toText = to ?? defaultTo(manifests, includeDraft);

  if (!toText) {
    throw new UsageError('No released migration is available. Pass --to, or --include-draft to use a draft one.');
  }

  let fromText = from;
  let detected = null;

  if (!fromText) {
    detected = await detectProjectVersion(cwd, paths);

    if (detected?.version) {
      fromText = detected.version;
      notes.push(`Detected --from ${fromText} (${detected.source}).`);
    } else if (detected && !lenientFrom) {
      throw new UsageError(`${detected.source.replace(/ \w+Dependencies$| dependencies$/, '')} names handsontable `
        + `as "${redact(detected.range)}", which is not a version. Pass --from.`);
    } else if (!lenientFrom) {
      const { found: scanned, unversioned } = await scanPackageVersions(cwd, paths);

      if (new Set(scanned.map(item => item.version)).size > 1) {
        throw new UsageError(`The packages use different Handsontable versions (${scanned
          .map(item => `${posix.dirname(item.file)}: ${item.version}`).join(', ')}). Pass --from, or run the tool on `
          + 'each package.');
      }

      if (scanned.length === 0 && unversioned) {
        throw new UsageError(`${unversioned.file} names handsontable as "${redact(unversioned.range)}", `
          + 'which is not a version. Pass --from.');
      }

      if (scanned.length === 0) {
        throw new UsageError('Cannot tell which Handsontable version this project uses: there is no installed '
        + 'handsontable package and no handsontable range in package.json. Pass --from, for example --from 17.1.');
      }

      fromText = scanned[0].version;
      notes.push(`Detected --from ${fromText} (${[...new Set(scanned.map(item => item.file))].join(', ')}).`);
    }
  }

  const fromBound = fromText ? resolveFrom(fromText) : null;
  const oldest = oldestCovered(manifests);

  if (fromBound && oldest && compareVersions(fromBound, oldest) < 0) {
    const guideBase = manifests[0].guide.url.slice(0, manifests[0].guide.url.lastIndexOf('/') + 1);
    const steps = uncoveredSteps(fromBound, oldest, guideBase);
    const list = steps.map(step => `  ${step.from} to ${step.to}: ${step.url}`).join('\n');
    const note = `Handsontable ${fromText} is older than the oldest version this tool migrates from `
      + `(${oldest.text}). It does not cover:\n${list}`;

    if (!allowUncovered) {
      throw new UsageError(`${note}\nFollow those guides first and upgrade to ${oldest.text}, then run the tool `
        + 'again. To run the migrations it has anyway, pass --allow-uncovered.');
    }

    notes.push(note);
    reportNotes.push(note);
  }

  const { selected, skippedDrafts } = selectManifests(manifests, {
    from: fromBound,
    to: resolveTo(toText, manifests.map(manifest => manifest.version)),
    includeDraft,
  });

  if (skippedDrafts.length > 0) {
    notes.push(`Skipped draft migrations: ${skippedDrafts.map(manifest => manifest.version).join(', ')}. `
      + 'Use --include-draft to run them.');
  }

  if (selected.length === 0) {
    throw new UsageError(nothingToMigrate({ manifests, fromText, toText, detected, skippedDrafts }));
  }

  const newest = selected[selected.length - 1];

  if (isNewerLine(parseVersion(toText), parseVersion(newest.version))) {
    const draft = skippedDrafts.find(manifest => !isNewerLine(parseVersion(toText), parseVersion(manifest.version)));
    const note = draft
      ? `${toText} is a draft migration${toText === draft.version ? '' : ` (${draft.version})`} and was skipped. `
        + `The run stops at ${newest.version}. `
        + 'Add --include-draft to run it.'
      : `No migration for ${toText} is known. Migrated up to ${newest.version}.`;

    notes.push(note);
    reportNotes.push(note);
  }

  const ids = selected.flatMap(manifest => manifest.rules.map(rule => rule.id));
  const unknown = only.filter(pattern => !ids.some(id => matchesOnly(pattern, id)));

  if (unknown.length > 0) {
    const drafts = includeDraft ? [] : manifests.filter(manifest => manifest.status === 'draft'
      && manifest.rules.some(rule => unknown.some(pattern => matchesOnly(pattern, rule.id))));

    if (drafts.length > 0) {
      throw new UsageError(`Unknown rule id: ${unknown.join(', ')}. That rule belongs to the draft migration `
        + `${drafts.map(manifest => manifest.version).join(', ')}, which a run leaves out. Add --include-draft to `
        + 'run it.');
    }

    throw new UsageError(`Unknown rule id: ${unknown.join(', ')}. Run with --list to see the ids in range. `
      + 'A trailing * names every id with that prefix, for example --only "18.0.0/type-*".');
  }

  return {
    plan: { ...buildPlan(selected, only), fromText: fromText ?? '' },
    selected,
    notes,
    reportNotes,
    fromText: fromText ?? '',
    toText,
  };
}

/**
 * Whether a requested `--to` is on a later minor line than a version: `19` and `18.2` are above `18.1.0`, while
 * `18` and `18.1.5` are not.
 *
 * @param {import('./versions.mjs').ParsedVersion} wanted The parsed `--to`.
 * @param {import('./versions.mjs').ParsedVersion} known The parsed version of the newest migration in range.
 * @returns {boolean} `true` when `wanted` names a later line.
 */
function isNewerLine(wanted, known) {
  const wantedMinor = wanted.parts >= 2 ? wanted.minor : 0;

  return wanted.major > known.major || (wanted.major === known.major && wantedMinor > known.minor);
}

/**
 * The text of the usage error for a range that selects no migration. It lists the known migrations, and it
 * says what to do when the version came from the project itself (a `package.json` the tool already raised, say)
 * or was a partial `--from` that stands for the end of its line.
 *
 * @param {object} args Arguments.
 * @param {import('./types.mjs').Manifest[]} args.manifests All loaded migrations.
 * @param {string|undefined} args.fromText The `--from` text, given or detected.
 * @param {string} args.toText The `--to` text.
 * @param {{version: string|null, source: string}|null} args.detected What the project told, when `--from` was not
 * given.
 * @param {import('./types.mjs').Manifest[]} args.skippedDrafts Draft migrations in range that were left out.
 * @returns {string} The message.
 */
function nothingToMigrate({ manifests, fromText, toText, detected, skippedDrafts }) {
  const known = manifests.map(manifest => `${manifest.version}${manifest.status === 'draft' ? ' (draft)' : ''}`);
  const parts = [];

  if (detected?.version) {
    const wheres = [...new Set((detected.sources ?? [detected.source])
      .map(source => source.replace(/ \w*[dD]ependencies$/, '')))];
    const where = wheres.length > 1 ? `${wheres.slice(0, -1).join(', ')} and ${wheres.at(-1)}` : wheres[0];
    const subject = where === 'node_modules/handsontable' ? 'The installed handsontable package is'
      : `${where} already name${wheres.length > 1 ? '' : 's'}`;
    const guide = /migration-from-(\d+\.\d+)-to-/.exec(manifests[0]?.guide.url ?? '');

    parts.push(`${subject} ${fromText}, so there is nothing to migrate to ${toText}. To run the migration again, `
      + `pass --from <your previous version>, for example --from ${guide ? guide[1] : manifests[0]?.from}.`);
  } else {
    parts.push(`Nothing to migrate from ${fromText ?? 'the beginning'} to ${toText}.`);
  }

  const partial = fromText && /^\d+$/.test(fromText)
    ? manifests.find(manifest => /^\d+\.\d+$/.test(manifest.from) && manifest.from.startsWith(`${fromText}.`))
    : null;

  if (partial) {
    parts.push(`--from ${fromText} means any ${fromText}.x release, which is above every ${fromText}.x migration. `
      + `To run the migration to ${partial.version}, pass --from ${partial.from}.`);
  }

  parts.push('A migration runs when its version is above --from and not above --to. '
    + `Known migrations: ${known.join(', ')}.`);

  if (skippedDrafts.length > 0) {
    parts.push('Only draft migrations are in range, add --include-draft to run them.');
  }

  return parts.join(' ');
}

/**
 * Describe each rule of a plan and whether a transform exists for its kind.
 *
 * @param {import('./types.mjs').Plan} plan The plan.
 * @param {import('./transforms/index.mjs').Registry} [registry] Transform registry.
 * @returns {Array<{id: string, kind: string, version: string, safe: boolean, mode: 'rewrite'|'report',
 * implemented: boolean}>} Rows in run order. `mode` is what the rule does when it runs (see `lib/safety.mjs`).
 */
export function describeRules(plan, registry = defaultRegistry) {
  return plan.versions.flatMap(({ rules }) => [...rules]
    .sort((a, b) => registry.order.indexOf(a.kind) - registry.order.indexOf(b.kind))
    .map(rule => ({
      id: rule.id,
      kind: rule.kind,
      version: rule.version,
      safe: rewrites(rule),
      mode: modeOf(rule),
      implemented: registry.byKind.has(rule.kind),
    })));
}

/**
 * Run a migration: resolve the range, guard the git tree, discover files, transform them in two phases, and
 * write the result. Nothing is written when `write` is `false`.
 *
 * Phase 1 visits every discovered file and applies all kinds except `dependency`, plus a scan of the `dependency`
 * module for facts (see `scan` in the `Transform` typedef). Phase 2 visits only `package.json` files and applies
 * the `dependency` rules, reading the facts phase 1 collected.
 *
 * @param {object} [options] Options. They mirror the CLI flags.
 * @param {string} [options.cwd] Project directory.
 * @param {string[]} [options.paths] Files or directories to migrate, relative to `cwd`.
 * @param {string} [options.from] Version the project is on.
 * @param {string} [options.to] Version to migrate to.
 * @param {boolean} [options.dryRun] Collect diffs and write nothing. `diffs` of the result is empty without it.
 * @param {string[]} [options.only] Rule ids to run.
 * @param {boolean} [options.aggressive] Lower the option-object confidence bar.
 * @param {boolean} [options.todo] Leave TODO comments in the code. Defaults to `true`. `false` (the CLI's `--no-todo`)
 * switches every marker off, so the report is the only record of the manual steps.
 * @param {boolean} [options.includeDraft] Run draft manifests.
 * @param {boolean} [options.allowUncovered] Run although the project is older than the oldest covered version.
 * @param {boolean} [options.allowDirty] Do not refuse a dirty git tree.
 * @param {boolean} [options.write] Write changed files. Defaults to `!dryRun`.
 * @param {string} [options.versionsDir] Directory with the manifests.
 * @param {import('./transforms/index.mjs').Registry} [options.registry] Transform registry.
 * @param {string} [options.reportPath] Path of the report file the caller writes, relative to `cwd`. An untracked
 * file at that path does not make the git tree dirty.
 * @param {number} [options.maxFileSize] Largest file in bytes. A bigger file is skipped with a warning.
 * Defaults to `MAX_FILE_BYTES`.
 * @param {(progress: {done: number, total: number}) => void} [options.onProgress] Called at most once per
 * `progressIntervalMs` while files are visited.
 * @param {number} [options.progressIntervalMs] Milliseconds between progress reports. Defaults to
 * `PROGRESS_INTERVAL_MS`.
 * @param {(text: string) => void} [options.onWarning] Called with a one-line warning before anything is written.
 * @param {AbortSignal} [options.signal] Asks the run to stop. It is checked before each file, so a file in progress is
 * finished (the write is one rename) and the next one is not started, and the `package.json` pass is skipped.
 * `interrupted` of the result is then `true`.
 * @param {object} [options.hooks] Injection points for tests. `discover` replaces the file search, and
 * `beforeRename(file)` runs after the temporary file of a write is complete, before it replaces the original.
 * @returns {Promise<{changedFiles: string[], report: Report, diffs: Array<{file: string, diff: string}>,
 * exitCode: number, notes: string[], error: string|null, from: string, to: string, usedDraft: boolean,
 * interrupted: boolean, inGit: boolean}>} The outcome.
 * `exitCode` is 0 on success, 1 when a file could not be parsed, read, or transformed, and 2 for a usage error or a
 * refused dirty tree. `usedDraft` is `true` when a draft migration was in the run. `interrupted` is `true` when
 * `signal` stopped the run before every file was visited, and `inGit` says whether the project is in a git repository,
 * which decides how the caller tells the user to undo what an interrupted run wrote.
 */
export async function run({
  cwd = process.cwd(),
  paths = [],
  from,
  to,
  dryRun = false,
  only = [],
  aggressive = false,
  todo = true,
  includeDraft = false,
  allowUncovered = false,
  allowDirty = false,
  write = !dryRun,
  versionsDir = VERSIONS_DIR,
  registry = defaultRegistry,
  reportPath,
  maxFileSize = MAX_FILE_BYTES,
  onProgress,
  progressIntervalMs = PROGRESS_INTERVAL_MS,
  onWarning,
  signal,
  hooks = {},
} = {}) {
  const report = new Report();
  const result = {
    changedFiles: [],
    report,
    diffs: [],
    exitCode: 0,
    notes: [],
    error: null,
    from: '',
    to: '',
    usedDraft: false,
    interrupted: false,
    inGit: false,
  };
  let files;
  let resolved;

  try {
    resolved = await resolvePlan({ cwd, paths, from, to, only, includeDraft, versionsDir, allowUncovered });
    result.notes = resolved.notes;
    result.from = resolved.fromText;
    result.to = resolved.selected[resolved.selected.length - 1].version;
    result.usedDraft = resolved.selected.some(manifest => manifest.status === 'draft');
    report.notes.push(...resolved.reportNotes);

    let repo;

    try {
      repo = await isGitRepo(cwd);
    } catch (error) {
      if (!(error instanceof GitError)) {
        throw error;
      }

      // git ran and failed, or is not there although a repository is, so there may be uncommitted edits that the tool
      // cannot see.
      const missing = error instanceof GitNotFoundError;

      if (write && !allowDirty) {
        throw new UsageError(missing
          ? `${error.message} The tool cannot check for uncommitted changes without git. Install git or fix PATH, `
            + 'or pass --allow-dirty to run without the check.'
          : 'git failed in this directory, so the tool cannot check for uncommitted changes: '
            + `${error.message} Fix that, or pass --allow-dirty to run without the check.`);
      }

      const note = missing ? `${error.message} The tool read the files without it.`
        : `git failed in this directory (${error.message}), so the tool read the files without it.`;

      repo = false;
      report.notes.push(note);
      result.notes.push(note);
    }

    result.inGit = repo;

    if (write && !repo) {
      onWarning?.('Not a git repository: you cannot review the changes with git diff. Stop now and use --dry-run '
        + 'if you want a preview.');
    }

    if (write && !allowDirty && repo) {
      const dirty = await dirtyPaths(cwd, { ignoreUntracked: reportPath ? [resolve(cwd, reportPath)] : [] });

      if (dirty.length > 0) {
        throw new UsageError(`The git tree has ${plural(dirty.length, 'uncommitted change')}. `
          + `Commit or stash ${dirty.length === 1 ? 'it' : 'them'} so the migration shows up as one clean diff, `
          + 'or pass --allow-dirty.');
      }

      const hidden = await hiddenPaths(cwd);

      if (hidden.length > 0) {
        const shown = hidden.slice(0, 5).map(({ path, flag }) => `${path} (${flag})`);
        const more = hidden.length > shown.length ? `, and ${hidden.length - shown.length} more` : '';

        const one = hidden.length === 1;

        throw new UsageError(`${plural(hidden.length, 'file')} under this directory ${one ? 'is' : 'are'} `
          + `flagged assume-unchanged or skip-worktree, so git status cannot show an edit to ${one ? 'it' : 'them'}: `
          + `${shown.join(', ')}${more}. Clear the flag (git update-index --no-assume-unchanged <file> or `
          + '--no-skip-worktree <file>) so the migration shows up as one clean diff, or pass --allow-dirty.');
      }
    }

    const links = [];
    const searchNotes = [];
    const reasons = [];

    files = await (hooks.discover ?? discover)({ cwd, paths, skipped: links, notes: searchNotes, reasons });

    if (reportPath) {
      await assertReportTarget(cwd, reportPath, files, repo);
    }

    for (const link of links) {
      report.add(skippedEntry(link.file, null, await skippedMessage(cwd, link, files)));
    }

    // A run that reads no file must not look like a run that read them all and found nothing to change.
    if (files.length === 0) {
      searchNotes.push(`No files to migrate. ${reasons.length > 0 ? reasons.join(' ')
        : 'No file with an extension the tool reads was found.'}`);
    }

    result.notes.push(...searchNotes);
    report.notes.push(...searchNotes);
  } catch (error) {
    if (error instanceof UsageError) {
      return { ...result, exitCode: 2, error: error.message };
    }

    throw error;
  }

  const facts = new Set();
  const projectFiles = new Set(files);
  const options = { aggressive, dryRun, todo };

  /**
   * Transform one file on disk and record the outcome.
   *
   * @param {string} file Project-relative path.
   * @param {1|2} phase Phase number.
   * @returns {Promise<void>}
   */
  const manifests = new Map();

  /**
   * The `package.json` files above one, parsed, nearest first. A leading byte order mark is read past, as npm does.
   * One that cannot be read or parsed stays in the list with `manifest: null`, so a rule that depends on what the
   * files above declare can tell that it does not know.
   *
   * @param {string} file Project-relative path of a `package.json`.
   * @returns {Promise<import('./types.mjs').AncestorManifest[]>} The manifests.
   */
  const ancestorsOf = async(file) => {
    const found = [];

    for (const above of packageFilesAbove(facts, file)) {
      if (!manifests.has(above)) {
        manifests.set(above, await readUtf8(join(cwd, above)).then(text => JSON.parse(stripBom(text)))
          .catch(() => null));
      }

      const manifest = manifests.get(above);

      found.push({
        file: above,
        manifest: manifest !== null && typeof manifest === 'object' && !Array.isArray(manifest) ? manifest : null,
      });
    }

    return found;
  };

  const visit = async(file, phase) => {
    let source;

    try {
      const { size } = await stat(join(cwd, file));

      if (size > maxFileSize) {
        if (phase === 1) {
          report.add(skippedEntry(file, null, `The file is ${formatSize(size)}, above the limit of `
            + `${formatSize(maxFileSize)}, so it was not analyzed. Raise the limit with --max-file-size.`));
        }

        return;
      }

      source = await readUtf8(join(cwd, file));
    } catch (error) {
      if (error instanceof NotUtf8Error) {
        if (phase === 1) {
          report.add(skippedEntry(file, null, 'The file is not valid UTF-8, so it was not analyzed. Convert it to '
            + 'UTF-8 to include it, or migrate it by hand.'));
        }

        return;
      }

      report.add({
        ruleId: 'read-error',
        severity: 'warning',
        file,
        message: `The file could not be read: ${error.message}`,
      });

      return;
    }

    if (basename(file) !== 'package.json' && hasVeryLongLine(source)) {
      if (phase === 1) {
        const limit = MAX_LINE_LENGTH.toLocaleString('en-US');

        report.add(skippedEntry(file, null, `The file has a line of more than ${limit} characters, so it looks `
          + 'minified or generated, and it was not analyzed. Migrate it by hand, or format it and run the tool '
          + 'again.'));
      }

      return;
    }

    const outcome = await transformFile({
      filePath: file,
      source,
      plan: resolved.plan,
      options,
      facts,
      registry,
      phase,
      projectFiles,
      catalog: phase === 2 && source.includes('catalog:') ? await findCatalog(cwd, file) : null,
      ancestors: phase === 2 ? await ancestorsOf(file) : [],
    });

    if (!outcome.changed) {
      report.addAll(outcome.entries);

      return;
    }

    if (!(await resolvesInside(cwd, file))) {
      report.addAll(withoutApplied(outcome.entries));
      report.add(skippedEntry(file, null, 'It resolves to a place outside the project directory, so it was not '
        + 'changed.'));

      return;
    }

    if (write) {
      try {
        await writeFileSafely(join(cwd, file), source, outcome.output, {
          beforeRename: () => hooks.beforeRename?.(file),
        });
      } catch (error) {
        // A file that could not be written is not a changed file: the summary must count what is on disk.
        report.addAll(withoutApplied(outcome.entries));
        report.add({
          ruleId: 'write-error',
          severity: 'warning',
          file,
          message: error instanceof StaleFileError ? error.message : `The file could not be written: ${error.message}`,
        });

        return;
      }
    }

    report.addAll(outcome.entries);
    result.changedFiles.push(file);

    // The diff is only for a preview, and it costs time in the size of the change, so a run that writes does not build it.
    if (dryRun) {
      result.diffs.push({ file, diff: unifiedDiff(file, source, outcome.output) });
    }
  };

  const packageFiles = files.filter(candidate => basename(candidate) === 'package.json');

  packageFiles.forEach(file => registerPackageDir(facts, file));

  if (paths.length > 0 && orderSteps(resolved.plan, registry, 2).length > 0) {
    // The `package.json` above a folder of the run is not in it, so phase 2 never reads it.
    const bumps = {};

    for (const { rules } of resolved.plan.versions) {
      rules.filter(rule => rule.kind === 'dependency' && rule.bump && typeof rule.bump === 'object')
        .forEach(rule => Object.assign(bumps, rule.bump));
    }

    const unreached = await unreachedPackageNotes({ cwd, paths, visited: new Set(packageFiles), bumps });

    result.notes.push(...unreached);
    report.notes.push(...unreached);
  }

  let lastProgress = Date.now();

  // The signal is read between files only, so the file in progress is written or left as it was, never half done.
  for (const [index, file] of files.entries()) {
    if (signal?.aborted) {
      result.interrupted = true;
      break;
    }

    await visit(file, 1);

    if (onProgress && Date.now() - lastProgress >= progressIntervalMs) {
      lastProgress = Date.now();
      onProgress({ done: index + 1, total: files.length });
    }
  }

  if (!result.interrupted && orderSteps(resolved.plan, registry, 2).length > 0) {
    for (const file of packageFiles) {
      if (signal?.aborted) {
        result.interrupted = true;
        break;
      }

      await visit(file, 2);
    }
  }

  result.changedFiles = [...new Set(result.changedFiles)].sort();

  if (['parse-error', 'transform-error', 'read-error', 'write-error'].some(ruleId => report.has(ruleId))) {
    result.exitCode = 1;
  }

  return result;
}
