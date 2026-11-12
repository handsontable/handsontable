import { lstat, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, join, posix, relative, resolve, sep } from 'node:path';
import { adapterFor } from './adapters/index.mjs';
import { unifiedDiff } from './diff.mjs';
import { UsageError } from './errors.mjs';
import { discover, leavesDirectory, resolvesInside } from './discover.mjs';
import { dirtyPaths, isGitRepo, isTracked } from './git.mjs';
import { registerPackageDir } from './lib/facts.mjs';
import { modeOf, rewrites } from './lib/safety.mjs';
import { createMarkerIndex, cssTargetAt } from './lib/marker.mjs';
import { addCssTodo, addJsTodo, collectComments, hasJsTodo, lineOf } from './lib/todo.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests, matchesOnly } from './manifest.mjs';
import { Report, SKIPPED_RULE_ID, plural } from './report.mjs';
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
 * What the report says about a symbolic link the run did not follow. A link whose target is inside the project says
 * where it points, and whether the run migrates the target as its own file. A link to a place outside the project, or
 * to nothing, keeps the general advice: a link can point outside, and that project is migrated on its own.
 *
 * @param {string} cwd Project directory.
 * @param {string} file Project-relative path of the link.
 * @param {string[]} files The files the run migrates.
 * @returns {Promise<string>} The text of the entry.
 */
async function linkMessage(cwd, file, files) {
  const general = 'This is a symbolic link, so it was not followed. A link can point outside the project. Migrate '
    + 'the file it points to in its own project.';

  try {
    const [root, real] = await Promise.all([realpath(cwd), realpath(join(cwd, file))]);
    const target = relative(root, real).split(sep).join('/');

    if (target === '' || leavesDirectory(target)) {
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
 * Say where and why a parser gave up. An error at the end of the text (a missing bracket or quote) is reported on the
 * last line of the file, as `unexpected end of file`: the parser's own position is the line after it. Any other error
 * keeps the parser's message and shows the text of the line, cut to 80 characters.
 *
 * @param {object} error The error the parser threw: `loc`, `pos`, `reason`, and `message` are read when present.
 * @param {string} source The file text.
 * @returns {{line: number|null, text: string}} The one-based line, and the sentence that follows `skipped:`.
 */
function describeParseError(error, source) {
  const lines = source.replace(/\r?\n$/, '').split(/\r?\n/);
  const at = Number.isInteger(error.loc?.line) ? error.loc.line : (error.line ?? null);
  const position = error.pos ?? error.loc?.index;
  const pastEnd = Number.isInteger(position) && position >= source.trimEnd().length;
  const atEnd = at !== null && (at > lines.length || pastEnd);

  if (atEnd) {
    return { line: lines.length, text: 'unexpected end of file.' };
  }

  const reason = firstLine(error.reason ?? error.message).replace(/ \(\d+:\d+\)$/, '').replace(/[.]$/, '');
  const shown = at === null ? '' : lines[at - 1]?.trim().slice(0, 80);

  return { line: at, text: shown ? `${reason}, at: ${shown}` : `${reason}.` };
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
 * @returns {{ctx: import('./types.mjs').Ctx, marks: Mark[]}} The context, and the markers its `manual` entries ask
 * for. `applyMarkers()` places them once every transform has run.
 */
function createContext({ filePath, part, plan, entries, facts, options }) {
  const merged = new Map();
  const marks = [];
  const annotatable = part.fileKind === 'js' || part.fileKind === 'css';
  const store = (entry, { mark }) => {
    if (typeof entry?.ruleId !== 'string' || !SEVERITIES.has(entry.severity) || typeof entry.message !== 'string') {
      throw new Error(`Invalid report entry: ${JSON.stringify(entry)}`);
    }

    const owner = plan.rulesById.get(entry.ruleId);

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

    if (typeof entry.mergeKey === 'string' && merged.has(entry.mergeKey)) {
      // A later step of the run says the same thing about the same spot. By default the net result replaces the
      // first entry (a range bump from the range the user wrote to the latest target). An entry that says
      // `merge: 'earliest'` keeps the first one, so the rule of the earliest migration owns the id, the message, and
      // the guide link, and its marker.
      if (entry.merge !== 'earliest') {
        Object.assign(merged.get(entry.mergeKey), stored);
      }

      return merged.get(entry.mergeKey);
    }

    entries.push(stored);

    if (typeof entry.mergeKey === 'string') {
      merged.set(entry.mergeKey, stored);
    }

    const markersOn = options.todo !== false && options.markers !== false;

    if (mark && annotatable && markersOn && wantsMarker(entry, owner)) {
      const lines = [...new Set([entry.line, ...(entry.lines ?? [])].filter(Number.isInteger))];

      marks.push({ stored, ruleId: entry.ruleId, text: entry.message, lines });
    }

    return stored;
  };

  const report = (entry) => {
    store(entry, { mark: true });
  };

  const markChanged = () => {
    part.changed = true;
  };

  const comment = (target, ruleId, text) => {
    if (options.todo === false) {
      return false;
    }

    const owner = plan.rulesById.get(ruleId);
    const guideUrl = owner?.guide ? owner.guideUrl : null;
    let inserted = false;

    if (part.fileKind === 'js') {
      inserted = addJsTodo(part.j, target, ruleId, text, guideUrl, commentScan(part));
    } else if (part.fileKind === 'css') {
      inserted = addCssTodo(target, ruleId, text, guideUrl, part.document);
    }

    if (inserted) {
      markChanged();
    }

    return inserted;
  };

  const todo = (target, ruleId, text, shortText) => {
    const inserted = comment(target, ruleId, shortText ?? text);
    const stored = store({ ruleId, severity: 'manual', line: lineOf(target) ?? undefined, message: text },
      { mark: false });

    // The comment is in the code, put there now or by an earlier run, unless markers are off or the part holds none.
    if (annotatable && options.todo !== false) {
      stored.marked = true;
    }

    return inserted;
  };

  const ctx = {
    filePath,
    fileKind: part.fileKind,
    source: part.source,
    j: part.j,
    root: part.root,
    json: part.json ?? null,
    css: part.document ?? null,
    report,
    todo,
    comment,
    cssScope: cssScopeOf(part),
    lineOffset: part.lineOffset,
    fromText: plan.fromText ?? '',
    facts,
    options,
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
 * @property {number[]} lines Lines of the entry inside the part, `line` first, then every line of a collapsed group.
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

  const find = part.fileKind === 'js' ? createMarkerIndex(part.j, part.root) : line => cssTargetAt(part.root, line);

  for (const mark of marks) {
    const owner = plan.rulesById.get(mark.ruleId);
    const guideUrl = owner?.guide ? owner.guideUrl : null;
    let placed = false;

    for (const line of mark.lines) {
      const targets = [find(line)].flat();

      if (targets.length === 0) {
        continue;
      }

      // The same comment further up the chain counts: an earlier run may have put it on the element of a one-line
      // object that the printer then spread over several lines.
      const scan = part.fileKind === 'js' ? commentScan(part) : null;
      const there = part.fileKind === 'js'
        && targets.some(target => hasJsTodo(target, mark.ruleId, mark.text, guideUrl, scan));
      const inserted = !there && (part.fileKind === 'js'
        ? addJsTodo(part.j, targets[0], mark.ruleId, mark.text, guideUrl, scan)
        : addCssTodo(targets[0], mark.ruleId, mark.text, guideUrl, part.document));

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
  const steps = candidates.filter(step => precheckOf(step).test(source));

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
      const { ctx, marks } = createContext({ filePath, part, plan, entries, facts, options: fullOptions });

      for (const step of steps) {
        if (stepFileKinds(step).includes(part.fileKind)) {
          await step.transform.apply(ctx, step.rules);
        }
      }

      applyMarkers(part, marks, plan);
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
 * Refuse a report path that would overwrite something that is not a previous report: a file git tracks, a file the
 * run is about to migrate, or a symbolic link, which `writeFile` would follow. A file that does not exist, or an
 * untracked file that is not a project file (the report of the previous run), is fine.
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

  if (!info) {
    return;
  }

  if (info.isSymbolicLink()) {
    throw new UsageError(`--report ${reportPath} is a symbolic link, and the report would be written through it. `
      + 'Choose another file.');
  }

  const rel = relative(cwd, target).split(sep).join('/');
  const projectFile = files.includes(rel) || (repo && await isTracked(cwd, target));

  if (projectFile) {
    throw new UsageError(`--report ${reportPath} would overwrite a project file. Choose another file, for example `
      + 'migration-report.md.');
  }
}

/**
 * Read the Handsontable range of every `package.json` under the path arguments, for a run that gave no `--from` where
 * the nearest `package.json` (a monorepo root) names none.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} paths Path arguments relative to `cwd`.
 * @returns {Promise<Array<{file: string, version: string}>>} One item per `package.json` that declares a
 * `handsontable` range with a version, in path order.
 */
async function scanPackageVersions(cwd, paths) {
  const found = [];

  for (const file of (await discover({ cwd, paths })).filter(candidate => basename(candidate) === 'package.json')) {
    let manifest = null;

    try {
      manifest = JSON.parse(await readFile(join(cwd, file), 'utf8'));
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
    }
  }

  return found;
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
    } else if (detected) {
      throw new UsageError(`${detected.source.replace(/ \w+Dependencies$| dependencies$/, '')} names handsontable `
        + `as "${detected.range}", which is not a version. Pass --from.`);
    } else if (!lenientFrom) {
      const scanned = await scanPackageVersions(cwd, paths);

      if (new Set(scanned.map(item => item.version)).size > 1) {
        throw new UsageError(`The packages use different Handsontable versions (${scanned
          .map(item => `${posix.dirname(item.file)}: ${item.version}`).join(', ')}). Pass --from, or run the tool on `
          + 'each package.');
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
    const note = `No migration for ${toText} is known. Migrated up to ${newest.version}.`;

    notes.push(note);
    reportNotes.push(note);
  }

  const ids = selected.flatMap(manifest => manifest.rules.map(rule => rule.id));
  const unknown = only.filter(pattern => !ids.some(id => matchesOnly(pattern, id)));

  if (unknown.length > 0) {
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
 * @param {boolean} [options.dryRun] Collect diffs and write nothing.
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
 * @returns {Promise<{changedFiles: string[], report: Report, diffs: Array<{file: string, diff: string}>,
 * exitCode: number, notes: string[], error: string|null}>} The outcome. `exitCode` is 0 on success, 1 when a
 * file could not be parsed, read, or transformed, and 2 for a usage error or a refused dirty tree.
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
} = {}) {
  const report = new Report();
  const result = { changedFiles: [], report, diffs: [], exitCode: 0, notes: [], error: null, from: '', to: '' };
  let files;
  let resolved;

  try {
    resolved = await resolvePlan({ cwd, paths, from, to, only, includeDraft, versionsDir, allowUncovered });
    result.notes = resolved.notes;
    result.from = resolved.fromText;
    result.to = resolved.selected[resolved.selected.length - 1].version;
    report.notes.push(...resolved.reportNotes);

    const repo = await isGitRepo(cwd);

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
    }

    const links = [];

    files = await discover({ cwd, paths, skipped: links });

    if (reportPath) {
      await assertReportTarget(cwd, reportPath, files, repo);
    }

    for (const link of links) {
      report.add(skippedEntry(link.file, null, await linkMessage(cwd, link.file, files)));
    }
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

      source = await readFile(join(cwd, file), 'utf8');
    } catch (error) {
      report.add({
        ruleId: 'read-error',
        severity: 'warning',
        file,
        message: `The file could not be read: ${error.message}`,
      });

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
    });

    report.addAll(outcome.entries);

    if (outcome.changed && !(await resolvesInside(cwd, file))) {
      report.add(skippedEntry(file, null, 'It resolves to a place outside the project directory, so it was not '
        + 'changed.'));

      return;
    }

    if (outcome.changed) {
      result.changedFiles.push(file);
      result.diffs.push({ file, diff: unifiedDiff(file, source, outcome.output) });

      if (write) {
        await writeFile(join(cwd, file), outcome.output);
      }
    }
  };

  const packageFiles = files.filter(candidate => basename(candidate) === 'package.json');

  packageFiles.forEach(file => registerPackageDir(facts, file));

  let lastProgress = Date.now();

  for (const [index, file] of files.entries()) {
    await visit(file, 1);

    if (onProgress && Date.now() - lastProgress >= progressIntervalMs) {
      lastProgress = Date.now();
      onProgress({ done: index + 1, total: files.length });
    }
  }

  if (orderSteps(resolved.plan, registry, 2).length > 0) {
    for (const file of packageFiles) {
      await visit(file, 2);
    }
  }

  result.changedFiles = [...new Set(result.changedFiles)].sort();

  if (['parse-error', 'transform-error', 'read-error'].some(ruleId => report.has(ruleId))) {
    result.exitCode = 1;
  }

  return result;
}
