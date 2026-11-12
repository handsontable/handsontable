import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { adapterFor } from './adapters/index.mjs';
import { unifiedDiff } from './diff.mjs';
import { UsageError } from './errors.mjs';
import { discover } from './discover.mjs';
import { dirtyPaths, isGitRepo } from './git.mjs';
import { addCssTodo, addJsTodo, lineOf } from './lib/todo.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from './manifest.mjs';
import { Report } from './report.mjs';
import { registry as defaultRegistry } from './transforms/index.mjs';
import {
  defaultTo,
  detectInstalledVersion,
  resolveFrom,
  resolveTo,
  selectManifests,
} from './versions.mjs';

const SEVERITIES = new Set(['changed', 'manual', 'warning']);

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
 * @param {1|2} phase Phase number. Phase 2 runs only the registry's phase 2 kinds.
 * @returns {Array<{transform: import('./types.mjs').Transform, rules: import('./types.mjs').Rule[]}>} Steps.
 */
function orderSteps(plan, registry, phase) {
  const steps = [];

  for (const { rules } of plan.versions) {
    const used = new Set();

    for (const kind of registry.order) {
      const transform = registry.byKind.get(kind);

      if (!transform || used.has(transform) || registry.phaseTwo.has(kind) !== (phase === 2)) {
        continue;
      }

      used.add(transform);

      const own = rules.filter(rule => transform.kinds.includes(rule.kind)
        && registry.phaseTwo.has(rule.kind) === (phase === 2));

      if (own.length > 0) {
        steps.push({ transform, rules: own });
      }
    }
  }

  return steps;
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
  const report = (entry) => {
    if (typeof entry?.ruleId !== 'string' || !SEVERITIES.has(entry.severity) || typeof entry.message !== 'string') {
      throw new Error(`Invalid report entry: ${JSON.stringify(entry)}`);
    }

    entries.push({
      ruleId: entry.ruleId,
      severity: entry.severity,
      file: filePath,
      line: Number.isInteger(entry.line) ? entry.line + part.lineOffset : null,
      message: entry.message,
      guideUrl: plan.rulesById.get(entry.ruleId)?.guideUrl ?? null,
    });
  };

  const markChanged = () => {
    part.changed = true;
  };

  const todo = (target, ruleId, text) => {
    let inserted = false;

    if (part.fileKind === 'js') {
      inserted = addJsTodo(part.j, target, ruleId, text);
    } else if (part.fileKind === 'css') {
      inserted = addCssTodo(target, ruleId, text);
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

  const steps = orderSteps(plan, registry, phase)
    .filter(step => step.transform.fileKinds.some(kind => adapter.fileKinds.includes(kind)));

  if (steps.length === 0) {
    return unchanged('no-transform');
  }

  if (!adapter.precheck.test(source)) {
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

  const fullOptions = { aggressive: false, dryRun: false, ...options };

  try {
    for (const part of handle.parts) {
      const ctx = createContext({ filePath, part, plan, entries, facts, options: fullOptions });

      for (const { transform, rules } of steps) {
        if (transform.fileKinds.includes(part.fileKind)) {
          await transform.apply(ctx, rules);
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
    const detected = await detectInstalledVersion(cwd);

    if (detected) {
      fromText = detected.version;
      notes.push(`Detected --from ${fromText} (${detected.source}).`);
    } else if (!lenientFrom) {
      throw new UsageError('Cannot detect the installed Handsontable version. Pass --from, for example --from 17.1.');
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
    throw new UsageError(`No migration to run from ${fromText ?? 'the beginning'} to ${toText}.`
      + `${skippedDrafts.length > 0 ? ' Only draft manifests are in range.' : ''}`);
  }

  const known = new Set(selected.flatMap(manifest => manifest.rules.map(rule => rule.id)));
  const unknown = only.filter(id => !known.has(id));

  if (unknown.length > 0) {
    throw new UsageError(`Unknown rule id: ${unknown.join(', ')}. Run with --list to see the ids in range.`);
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
 * @returns {Array<{id: string, kind: string, version: string, safe: boolean, implemented: boolean}>} Rows in
 * run order.
 */
export function describeRules(plan, registry = defaultRegistry) {
  return plan.versions.flatMap(({ rules }) => [...rules]
    .sort((a, b) => registry.order.indexOf(a.kind) - registry.order.indexOf(b.kind))
    .map(rule => ({
      id: rule.id,
      kind: rule.kind,
      version: rule.version,
      safe: rule.safe,
      implemented: registry.byKind.has(rule.kind),
    })));
}

/**
 * Run a migration: resolve the range, guard the git tree, discover files, transform them in two phases, and
 * write the result. Nothing is written when `write` is `false`.
 *
 * Phase 1 visits every discovered file and applies all kinds except `dependency`. Phase 2 visits only
 * `package.json` files and applies the `dependency` rules, reading the facts phase 1 collected.
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
} = {}) {
  const report = new Report();
  const result = { changedFiles: [], report, diffs: [], exitCode: 0, notes: [], error: null };
  let files;
  let resolved;

  try {
    resolved = await resolvePlan({ cwd, from, to, only, includeDraft, versionsDir });
    result.notes = resolved.notes;

    if (write && !allowDirty && await isGitRepo(cwd)) {
      const dirty = await dirtyPaths(cwd);

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

  for (const file of files) {
    await visit(file, 1);
  }

  if (orderSteps(resolved.plan, registry, 2).length > 0) {
    for (const file of files.filter(candidate => basename(candidate) === 'package.json')) {
      await visit(file, 2);
    }
  }

  result.changedFiles = [...new Set(result.changedFiles)].sort();

  if (['parse-error', 'transform-error', 'read-error'].some(ruleId => report.has(ruleId))) {
    result.exitCode = 1;
  }

  return result;
}
