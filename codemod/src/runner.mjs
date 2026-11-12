import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { adapterFor } from './adapters/index.mjs';
import { unifiedDiff } from './diff.mjs';
import { UsageError } from './errors.mjs';
import { discover } from './discover.mjs';
import { dirtyPaths, isGitRepo } from './git.mjs';
import { registerPackageDir } from './lib/facts.mjs';
import { modeOf, rewrites } from './lib/safety.mjs';
import { addCssTodo, addJsTodo, collectComments, lineOf } from './lib/todo.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests, matchesOnly } from './manifest.mjs';
import { Report, SKIPPED_RULE_ID } from './report.mjs';
import { registry as defaultRegistry } from './transforms/index.mjs';
import {
  defaultTo,
  detectProjectVersion,
  resolveFrom,
  resolveTo,
  selectManifests,
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
 * @returns {import('./types.mjs').ReportEntry[]} The entries, possibly none.
 */
function skippedEntries(adapter, handle, source, filePath) {
  const entries = [];

  for (const block of handle?.skippedBlocks ?? []) {
    if (block.relevant) {
      const tag = `<${block.type}${block.lang ? ` lang="${block.lang}"` : ''}${block.src ? ' src' : ''}>`;

      entries.push(skippedEntry(filePath, block.line, `A ${tag} block was not analyzed. Check it by hand.`));
    }
  }

  entries.push(...(adapter.skipNotes?.(source) ?? []).map(note => skippedEntry(filePath, note.line, note.message)));

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
 * Build the context for one part of a file. See the `Ctx` typedef in `types.mjs` for the contract.
 *
 * @param {object} args Arguments.
 * @param {string} args.filePath Project-relative path.
 * @param {import('./types.mjs').Part} args.part The part.
 * @param {import('./types.mjs').Plan} args.plan The selected rules, for guide links.
 * @param {import('./types.mjs').ReportEntry[]} args.entries Where report entries are collected.
 * @param {Set<string>} args.facts Shared facts.
 * @param {{aggressive: boolean, dryRun: boolean}} args.options Run options.
 * @returns {import('./types.mjs').Ctx} The context.
 */
function createContext({ filePath, part, plan, entries, facts, options }) {
  const merged = new Map();
  const report = (entry) => {
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
      // A later step of the run says the same thing about the same spot: the net result replaces the first entry.
      Object.assign(merged.get(entry.mergeKey), stored);

      return;
    }

    entries.push(stored);

    if (typeof entry.mergeKey === 'string') {
      merged.set(entry.mergeKey, stored);
    }
  };

  const markChanged = () => {
    part.changed = true;
  };

  const todo = (target, ruleId, text, comment) => {
    const owner = plan.rulesById.get(ruleId);
    const guideUrl = owner?.guide ? owner.guideUrl : null;
    let inserted = false;

    if (part.fileKind === 'js') {
      inserted = addJsTodo(part.j, target, ruleId, comment ?? text, guideUrl, commentScan(part));
    } else if (part.fileKind === 'css') {
      inserted = addCssTodo(target, ruleId, comment ?? text, guideUrl);
    }

    if (inserted) {
      markChanged();
    }

    report({ ruleId, severity: 'manual', line: lineOf(target) ?? undefined, message: text });

    return inserted;
  };

  return {
    filePath,
    fileKind: part.fileKind,
    source: part.source,
    j: part.j,
    root: part.root,
    report,
    todo,
    facts,
    options,
    markChanged,
  };
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
 * @param {Partial<{aggressive: boolean, dryRun: boolean}>} [args.options] Run options.
 * @param {Set<string>} [args.facts] Facts shared across the run.
 * @param {import('./transforms/index.mjs').Registry} [args.registry] Transform registry.
 * @param {1|2} [args.phase] Phase number. Defaults to 1.
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
    return {
      ...unchanged(null),
      entries: [{
        ruleId: 'parse-error',
        severity: 'warning',
        file: filePath,
        line: Number.isInteger(error.loc?.line) ? error.loc.line : (error.line ?? null),
        message: `The file could not be parsed and was skipped: ${firstLine(error.reason ?? error.message)}`,
        guideUrl: null,
      }],
    };
  }

  if (phase === 1) {
    entries.push(...skippedEntries(adapter, handle, source, filePath));
  }

  const fullOptions = { aggressive: false, dryRun: false, ...options };

  try {
    for (const part of handle.parts) {
      const ctx = createContext({ filePath, part, plan, entries, facts, options: fullOptions });

      for (const step of steps) {
        if (stepFileKinds(step).includes(part.fileKind)) {
          await step.transform.apply(ctx, step.rules);
        }
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
        message: `A transform failed and the file was left unchanged: ${error.message}`,
        guideUrl: null,
      }],
    };
  }

  const output = handle.parts.some(part => part.changed) ? adapter.print(handle, source) : source;

  return { output, changed: output !== source, entries, skipped: null };
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
 * @param {string} [args.versionsDir] Directory with the manifests.
 * @param {boolean} [args.lenientFrom] When `true`, a missing `--from` that cannot be detected means "from the
 * beginning" instead of an error.
 * @returns {Promise<{plan: import('./types.mjs').Plan, selected: import('./types.mjs').Manifest[],
 * notes: string[], fromText: string, toText: string}>} The plan and the facts about the range.
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
}) {
  const manifests = await loadManifests(versionsDir);
  const notes = [];
  const toText = to ?? defaultTo(manifests, includeDraft);

  if (!toText) {
    throw new UsageError('No released manifest is available. Pass --to, or --include-draft to use a draft one.');
  }

  let fromText = from;

  if (!fromText) {
    const detected = await detectProjectVersion(cwd, paths);

    if (detected) {
      fromText = detected.version;
      notes.push(`Detected --from ${fromText} (${detected.source}).`);
    } else if (!lenientFrom) {
      throw new UsageError('Cannot tell which Handsontable version this project uses: there is no installed '
        + 'handsontable package and no handsontable range in package.json. Pass --from, for example --from 17.1.');
    }
  }

  const { selected, skippedDrafts } = selectManifests(manifests, {
    from: fromText ? resolveFrom(fromText) : null,
    to: resolveTo(toText, manifests.map(manifest => manifest.version)),
    includeDraft,
  });

  if (skippedDrafts.length > 0) {
    notes.push(`Skipped draft manifests: ${skippedDrafts.map(manifest => manifest.version).join(', ')}. `
      + 'Use --include-draft to run them.');
  }

  if (selected.length === 0) {
    const known = manifests.map(manifest => `${manifest.version}${manifest.status === 'draft' ? ' (draft)' : ''}`);

    throw new UsageError(`Nothing to migrate from ${fromText ?? 'the beginning'} to ${toText}. `
      + `A migration runs when its version is above --from and not above --to. Known migrations: ${known.join(', ')}.`
      + `${skippedDrafts.length > 0 ? ' Only draft manifests are in range, add --include-draft to run them.' : ''}`);
  }

  const ids = selected.flatMap(manifest => manifest.rules.map(rule => rule.id));
  const unknown = only.filter(pattern => !ids.some(id => matchesOnly(pattern, id)));

  if (unknown.length > 0) {
    throw new UsageError(`Unknown rule id: ${unknown.join(', ')}. Run with --list to see the ids in range. `
      + 'A trailing * names every id with that prefix, for example --only "18.0.0/type-*".');
  }

  return {
    plan: buildPlan(selected, only),
    selected,
    notes,
    fromText: fromText ?? '',
    toText,
  };
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
 * @param {boolean} [options.includeDraft] Run draft manifests.
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
  includeDraft = false,
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
  const result = { changedFiles: [], report, diffs: [], exitCode: 0, notes: [], error: null };
  let files;
  let resolved;

  try {
    resolved = await resolvePlan({ cwd, paths, from, to, only, includeDraft, versionsDir });
    result.notes = resolved.notes;

    const repo = await isGitRepo(cwd);

    if (write && !repo) {
      onWarning?.('Not a git repository: changes cannot be reviewed with git diff. Use --dry-run first.');
    }

    if (write && !allowDirty && repo) {
      const dirty = await dirtyPaths(cwd, { ignoreUntracked: reportPath ? [resolve(cwd, reportPath)] : [] });

      if (dirty.length > 0) {
        throw new UsageError(`The git tree has ${dirty.length} uncommitted change${dirty.length === 1 ? '' : 's'}. `
          + 'Commit or stash them so the migration shows up as one clean diff, or pass --allow-dirty.');
      }
    }

    files = await discover({ cwd, paths });
  } catch (error) {
    if (error instanceof UsageError) {
      return { ...result, exitCode: 2, error: error.message };
    }

    throw error;
  }

  const facts = new Set();
  const options = { aggressive, dryRun };

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
          report.add(skippedEntry(file, null, `The file is ${Math.ceil(size / 1024)} KB, above the limit of `
            + `${Math.ceil(maxFileSize / 1024)} KB, so it was not analyzed. Raise the limit with --max-file-size.`));
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
    });

    report.addAll(outcome.entries);

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
