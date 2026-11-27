import { readFile, writeFile } from 'node:fs/promises';
import { posix, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { UsageError } from './errors.mjs';
import { errorDocument, listDocument, runDocument, serialize, wantsJson, wantsList } from './json-output.mjs';
import { plainName, plainText } from './lib/markdown.mjs';
import { redact } from './lib/redact.mjs';
import { BELOW_FROM_RULE_ID, plural, renderConsole, renderMarkdown } from './report.mjs';
import { describeRules, resolvePlan, run } from './runner.mjs';

/**
 * Rule ids of the warnings that make a run exit with code 1: a file the tool could not read, parse, or transform.
 */
const USAGE_LINE = 'Usage: handsontable-codemod migrate [paths...] [options]';

export const HELP = `${USAGE_LINE}

Apply the mechanical part of a Handsontable upgrade to your project and report the rest.

Arguments:
  paths                 Files or directories to migrate, relative to the current directory. Default: the
                        current directory.

Options:
  --from <version>      Version your project is on: 17, 17.1, or 18.0.0. A partial version means any version
                        of that line. When omitted, it is detected for each path argument from the nearest
                        node_modules/handsontable, then the handsontable range in the nearest package.json,
                        up to the current directory. Paths that differ need --from.
  --to <version>        Version to migrate to. A partial version means the highest known release of that line.
                        Defaults to the latest released migration, or to the latest draft that has rules
                        with --include-draft.
  --dry-run             Print a unified diff and write no project files. A file named by --report is still
                        written.
  --allow-dirty         Run even when the git tree has uncommitted changes.
  --report <file>       Also write the full report to <file> as a Markdown checklist. Keep the file out of the
                        project tree, or delete it after use: the git check ignores an untracked file at
                        this path, and no other.
  --only <ruleId>       Run only this rule. Repeat the flag for several rules. A trailing * matches a prefix,
                        for example --only "18.0.0/type-*".
  --list                List the rules in the version range and exit. "rewrite" rules edit code, "report"
                        rules only report.
  --json                Print one JSON document on standard output and nothing else: no diff, no summary,
                        no "Next:" lines. It works with --dry-run, --list, and --report, and also for a usage
                        error or a refusal. Notes and warnings stay on standard error. The exit codes do not
                        change. --help and --version print their text.
  --fail-on-manual      Exit with code 3 when a run leaves at least one manual step. A spot to review and a
                        warning never cause it. Without the flag a run that finds manual steps exits with 0.
  --aggressive          Also rewrite settings objects found with medium confidence.
  --no-todo             Leave no TODO comments in the code. By default a manual step gets a TODO(handsontable-codemod
                        <rule>) comment at its line. With this flag the report is the only record of them.
  --include-draft       Run migrations that are still drafts. Without --to, the run goes up to the newest
                        draft that has rules.
  --allow-uncovered     Run although the project is older than the oldest version the tool migrates from. The
                        report starts with the guides of the steps the tool does not cover.
  --max-file-size <n>   Skip files larger than <n> bytes and list them in the report. Default: 1048576.
  --version             Print the version of the tool.
  -h, --help            Show this help.

Exit codes:
  0  Done.
  1  A file could not be read, parsed, or transformed. The other files are still migrated.
  2  Usage error or refusal: unknown flag or command, dirty git tree, no version to start from, nothing to
     migrate, unknown rule id.
  3  The run finished and left manual steps, and --fail-on-manual was given. Codes 1 and 2 win over it.
  130  Stopped with Ctrl-C (SIGINT).
`;

const OPTIONS = {
  from: { type: 'string' },
  to: { type: 'string' },
  'dry-run': { type: 'boolean' },
  'allow-dirty': { type: 'boolean' },
  report: { type: 'string' },
  only: { type: 'string', multiple: true },
  list: { type: 'boolean' },
  json: { type: 'boolean' },
  'fail-on-manual': { type: 'boolean' },
  aggressive: { type: 'boolean' },
  'no-todo': { type: 'boolean' },
  'include-draft': { type: 'boolean' },
  'allow-uncovered': { type: 'boolean' },
  'max-file-size': { type: 'string' },
  version: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

/**
 * Say what is wrong with the arguments in one sentence, without the extra advice of `parseArgs`.
 *
 * @param {Error & {code?: string}} error The error `parseArgs` threw.
 * @param {string[]} argv The arguments, to quote the value a flag was wrongly given.
 * @returns {string} For example `Unknown option "--bogus".`.
 */
function describeUsageError(error, argv) {
  // What the user typed goes into the sentence spelled like a file name, so a line break in it stays on the line.
  const named = /'(-[^']*?)(?: <value>)?'/.exec(error.message)?.[1];

  if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION' && named) {
    return `Unknown option "${plainName(named)}".`;
  }

  if (error.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE' && named) {
    // A flag that takes no value was given one (`--json=1`), or an option that takes a value was left without it.
    const given = /does not take an argument/.test(error.message)
      ? argv.find(argument => argument.startsWith(`${named}=`)) : undefined;

    return given === undefined ? `Option "${plainName(named)}" needs a value.`
      : `Option "${plainName(named)}" takes no value, so "${plainName(given)}" is not valid.`;
  }

  return plainName(error.message.split('. ')[0].replace(/'/g, '"').replace(/\.?$/, '.'));
}

/**
 * The version in the `package.json` of the tool.
 *
 * @returns {Promise<string>} The version text.
 */
async function packageVersion() {
  return (await packageInfo()).version;
}

/**
 * The name and version in the `package.json` of the tool.
 *
 * @returns {Promise<{name: string, version: string}>} The tool.
 */
async function packageInfo() {
  const { name, version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

  return { name, version };
}

/**
 * Format the rules of a plan as an aligned text table with a line of counts at the end.
 *
 * @param {ReturnType<typeof describeRules>} rows Rows from `describeRules`.
 * @param {Array<{version: string}>} [notAutomated] The `notAutomated` entries of the plan. One summary line names how
 * many there are per version. It comes before the counts, so the last line is always the counts.
 * @returns {string} Text that ends with a newline.
 */
function renderList(rows, notAutomated = []) {
  const idWidth = Math.max(...rows.map(row => row.id.length), 2);
  const kindWidth = Math.max(...rows.map(row => row.kind.length), 4);
  const state = row => (row.implemented ? row.mode : 'not implemented');
  const lines = rows.map(row => `${row.id.padEnd(idWidth)}  ${row.kind.padEnd(kindWidth)}  ${state(row)}`);
  const count = name => rows.filter(row => state(row) === name).length;
  const missing = count('not implemented');

  if (notAutomated.length > 0) {
    const versions = [...new Set(notAutomated.map(item => item.version))];
    const perVersion = version => notAutomated.filter(item => item.version === version).length;
    const parts = versions.map(version => `${perVersion(version)} in ${version}`);

    lines.push('', `Changes with no rule, to read in the guide: ${parts.join(', ')}.`);
  }

  if (lines.length > 0) {
    lines.push('');
  }

  lines.push(`${rows.length} rules: ${count('rewrite')} rewrite, ${count('report')} report`
    + `${missing > 0 ? `, ${missing} not implemented` : ''}.`);

  return `${lines.join('\n')}\n`;
}

/**
 * Print the lines that say what to do after a run: format and test when files changed, then the manual steps. The
 * manual line says how many steps have a TODO marker in the code and how many are in the report only, and names the
 * search for the markers only when there is at least one.
 *
 * @param {{changedFiles: string[], report: import('./report.mjs').Report, draftRangeVersion: string|null}} result The
 * outcome of the run.
 * @param {(text: string) => void} stdout Standard output writer.
 * @returns {void}
 */
export function nextSteps(result, stdout) {
  const { manual, marked, review, markedReview, notes } = result.report.counts();

  if (result.changedFiles.some(file => posix.basename(file) === 'package.json')) {
    stdout('Next: install the new package ranges with your package manager. The tool does not install anything.\n');

    if (result.draftRangeVersion) {
      // A draft migration that bumps a package follows a release candidate, and a range without a prerelease tag never
      // matches one. A draft with no dependency rule writes no range, so a run that only includes it says nothing.
      stdout(`Next: the range ^${result.draftRangeVersion} matches no published version yet, because a release `
        + 'candidate never matches it. Until the release, install the candidate with: npm install handsontable@rc\n');
    }
  }

  if (result.changedFiles.length > 0) {
    stdout('Next: run your formatter and linter on the changed files.\n'
      + 'Next: run tsc and your tests.\n');
  }

  /**
   * Say where the entries of one class are: all in the code, none, or some.
   *
   * @param {number} count How many entries.
   * @param {number} inCode How many of them have a marker.
   * @returns {string} The sentence.
   */
  const whereOf = (count, inCode) => {
    if (inCode === 0) {
      return 'They are listed in the report only.';
    }

    return inCode === count ? 'All of them are marked in the code.'
      : `${inCode} of ${count} ${inCode === 1 ? 'is' : 'are'} marked in the code; the rest are listed in the report `
        + 'only.';
  };

  if (manual > 0) {
    stdout(`Next: work through the ${plural(manual, 'manual step')} in the report. ${whereOf(manual, marked)}\n`);
  }

  if (review > 0) {
    stdout(`Next: look at the ${plural(review, 'spot')} to review in the report. The behavior changed there, and `
      + `your code may already be right. ${whereOf(review, markedReview)}\n`);
  }

  if (notes > 0) {
    stdout(`Next: read the ${plural(notes, 'note')} under "Read once" in the report. `
      + `${notes === 1 ? 'It says' : 'They say'} what a rewrite changed. No spot needs a decision.\n`);
  }

  if (marked + markedReview > 0) {
    stdout('Next: find the markers with: git grep "TODO(handsontable-codemod"\n');
  }
}

/**
 * The one line that an interrupted run prints: how many files it had written and how to undo them. The advice depends
 * on what a run can promise. In a git repository that was clean at the start (`--allow-dirty` is the only way to start
 * on another), `git checkout -- .` restores exactly the files the run wrote. After `--allow-dirty` it would discard the
 * user's own edits too, and outside git there is nothing to restore from.
 *
 * @param {{changedFiles: string[], inGit: boolean}} result The outcome of the run so far.
 * @param {{dryRun: boolean, allowDirty: boolean}} flags The flags that change what a run leaves behind.
 * @returns {string} The line, without a line break.
 */
export function interruptedLine({ changedFiles, inGit }, { dryRun, allowDirty }) {
  if (dryRun) {
    return 'Interrupted. --dry-run changes no file, so there is nothing to undo.';
  }

  if (changedFiles.length === 0) {
    return 'Interrupted before the first file was written, so there is nothing to undo.';
  }

  const verb = changedFiles.length === 1 ? 'was' : 'were';
  const written = `Interrupted after ${plural(changedFiles.length, 'file')} ${verb} written, so the migration is `
    + 'incomplete.';

  if (!inGit) {
    return `${written} This directory is not a git repository, so restore the files from a backup.`;
  }

  if (allowDirty) {
    return `${written} You passed --allow-dirty, so git checkout -- . would discard your own changes too: review the `
      + 'files with git diff and restore the ones the tool wrote.';
  }

  return `${written} To undo, run: git checkout -- .`;
}

/**
 * Run the CLI. It never calls `process.exit`: the caller sets `process.exitCode` from the return value.
 *
 * With `--json` the standard output holds one JSON document and nothing else (see `json-output.mjs`). The notes, the
 * warnings, and the errors stay on standard error, as without the flag.
 *
 * @param {string[]} argv Arguments after the node binary and script path.
 * @param {object} [io] Injection points for tests.
 * @param {string} [io.cwd] Working directory.
 * @param {(text: string) => void} [io.stdout] Standard output writer.
 * @param {(text: string) => void} [io.stderr] Standard error writer.
 * @param {(path: string, text: string) => Promise<void>} [io.writeReport] Writes the `--report` file. Defaults to
 * `writeFile`, and a test replaces it to fail after the run.
 * @param {boolean} [io.progress] Whether to print a progress line every two seconds. Defaults to whether standard
 * output is a terminal.
 * @param {AbortSignal} [io.signal] Asks a migration to stop. The executable aborts it on the first SIGINT. The run
 * finishes the file it is on, the CLI prints one line (how many files were written, how to undo them), and the exit
 * code is 130.
 * @returns {Promise<number>} The exit code: 0 done, 1 runtime or parse errors, 2 usage error or refusal, 3 manual
 * steps left with `--fail-on-manual`, 130 stopped by `signal`.
 */
export async function main(argv, {
  cwd = process.cwd(),
  stdout: writeOut = text => process.stdout.write(text),
  stderr: writeErr = text => process.stderr.write(text),
  progress = Boolean(process.stdout.isTTY),
  writeReport = writeFile,
  signal,
} = {}) {
  // Everything that reaches a terminal or a log passes through one filter, so the user information of a URL in a
  // dependency spec never shows up, whichever message or diff line carries it, and a control character from a file
  // name or a source line (an escape sequence that rewrites the screen) is printed as text.
  const stdout = text => writeOut(plainText(redact(text)));
  const stderr = text => writeErr(plainText(redact(text)));
  // `--json` is read from the raw arguments, so a usage error that `parseArgs` throws can honor it too.
  const json = wantsJson(argv);
  const tool = json ? await packageInfo() : null;
  // The document goes out once, as the last thing a command writes. Its strings are made safe one by one, and the
  // text as a whole bypasses `stdout`, which would turn an escape that JSON needs into text.
  const emit = (code, build) => {
    if (json) {
      writeOut(serialize(build()));
    }

    return code;
  };
  const failure = (code, error, mode = wantsList(argv) ? 'list' : 'run', notes = []) => emit(code, () => errorDocument({
    tool,
    mode,
    exitCode: code,
    error,
    notes,
  }));
  let parsed;

  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    const problem = describeUsageError(error, argv);

    stderr(`${problem}\n${USAGE_LINE}\nRun with --help for all options.\n`);

    return failure(2, problem);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    stdout(HELP);

    return 0;
  }

  if (values.version) {
    stdout(`${await packageVersion()}\n`);

    return 0;
  }

  const [command, ...paths] = positionals;
  const mode = values.list ? 'list' : 'run';

  if (command !== 'migrate') {
    const problem = command ? `Unknown command "${plainName(command)}".` : 'Missing command.';

    stderr(`${problem} Use: handsontable-codemod migrate\n${USAGE_LINE}\nRun with --help for all options.\n`);

    return failure(2, problem, mode);
  }

  const maxFileSize = values['max-file-size'] === undefined ? undefined : Number(values['max-file-size']);

  if (maxFileSize !== undefined && (!Number.isInteger(maxFileSize) || maxFileSize <= 0)) {
    const given = plainName(values['max-file-size']);
    const problem = `--max-file-size needs a whole number of bytes above 0, not "${given}".`;

    stderr(`${problem}\n`);

    return failure(2, problem, mode);
  }

  for (const flag of ['from', 'to']) {
    if (values[flag] === '') {
      const problem = `Option "--${flag}" needs a value.`;

      stderr(`${problem}\n${USAGE_LINE}\nRun with --help for all options.\n`);

      return failure(2, problem, mode);
    }
  }

  const range = {
    cwd,
    paths,
    from: values.from,
    to: values.to,
    only: values.only ?? [],
    includeDraft: Boolean(values['include-draft']),
    allowUncovered: Boolean(values['allow-uncovered']),
  };
  const dryRun = Boolean(values['dry-run']);

  // The result of `run()`, for the document of a crash that comes after it.
  let outcome = null;

  try {
    if (values.list) {
      const { plan, notes, endsAt, fromText } = await resolvePlan({ ...range, lenientFrom: true });
      const rows = describeRules(plan);

      notes.forEach(note => stderr(`${note}\n`));

      if (json) {
        return emit(0, () => listDocument({ tool,
          rows,
          notAutomated: plan.notAutomated,
          notes,
          from: fromText,
          to: endsAt }));
      }

      stdout(renderList(rows, plan.notAutomated));

      return 0;
    }

    const result = await run({
      ...range,
      paths,
      dryRun,
      aggressive: Boolean(values.aggressive),
      todo: !values['no-todo'],
      allowDirty: Boolean(values['allow-dirty']),
      reportPath: values.report,
      maxFileSize,
      onWarning: text => stderr(`${text}\n`),
      signal,
      onProgress: progress
        ? ({ done, total }) => stderr(`Checked ${done} of ${plural(total, 'file')}...\n`)
        : undefined,
    });

    outcome = result;

    result.notes.forEach(note => stderr(`${note}\n`));

    if (result.error) {
      stderr(`${result.error}\n`);

      return emit(result.exitCode, () => runDocument({ tool, result, dryRun, exitCode: result.exitCode }));
    }

    if (result.interrupted) {
      // The report would describe a part of the project, so the one line is the whole output. The document says
      // `interrupted`, so a reader knows that its entries are a part.
      stderr(`${interruptedLine(result, { dryRun, allowDirty: Boolean(values['allow-dirty']) })}\n`);

      return emit(130, () => runDocument({ tool, result, dryRun, exitCode: 130 }));
    }

    if (dryRun && !json) {
      result.diffs.forEach(({ diff }) => stdout(diff));
    }

    const summary = { filesChanged: result.changedFiles.length, dryRun };

    if (!json) {
      stdout(renderConsole(result.report, { ...summary, reportFile: values.report }));
    }

    if (values.report) {
      const date = new Date().toISOString().slice(0, 10);

      try {
        await writeReport(resolve(cwd, values.report), renderMarkdown(result.report, {
          ...summary,
          from: result.from,
          to: result.to,
          date,
        }));
        (json ? stderr : stdout)(`Report written to ${values.report}.\n`);
      } catch (error) {
        // The files are migrated and the summary is printed. A report that cannot be written must not hide the rest.
        stderr(`Could not write the report to ${values.report}: ${error.message}\n`);
        result.exitCode = 1;
      }
    }

    if (!dryRun && !json) {
      nextSteps(result, stdout);
    }

    result.report.entries.filter(entry => entry.ruleId === BELOW_FROM_RULE_ID)
      .forEach(entry => stderr(`Warning: ${entry.message}\n`));

    const { read, written } = result.report.failedFiles();

    if (result.exitCode === 1 && read.size > 0) {
      stderr(`${plural(read.size, 'file')} could not be read. See the warnings above.\n`);
    }

    if (written.size > 0) {
      // The entry is in the report too, but a run that prints nothing else on standard error must still say why it
      // exits with 1.
      result.report.entries.filter(entry => entry.ruleId === 'write-error')
        .forEach(entry => stderr(`Warning: ${entry.file}: ${entry.message}\n`));
      stderr(`${plural(written.size, 'file')} could not be written. See the warnings above.\n`);
    }

    // The code of a run that could not finish its work (1) stays what it is. Only a run that would exit 0 can exit 3,
    // and a dry run counts: that is how a CI job asks the question without writing a file.
    const manual = result.report.counts().manual;

    if (values['fail-on-manual'] && result.exitCode === 0 && manual > 0) {
      stderr(`${plural(manual, 'manual step')} left, so the exit code is 3 (--fail-on-manual).\n`);
      result.exitCode = 3;
    }

    return emit(result.exitCode, () => runDocument({ tool, result, dryRun, exitCode: result.exitCode }));
  } catch (error) {
    if (error instanceof UsageError) {
      stderr(`${error.message}\n`);

      return failure(2, error.message, mode);
    }

    // Anything can be thrown, and a throw that is not an Error has no message.
    const message = String(error?.message ?? error);

    stderr(`${error?.stack ?? message}\n`);

    // Files may be written already: the document says which, from the result of the run, or from what a throw inside the
    // run carries.
    const partial = outcome ?? error?.partial ?? null;

    if (partial !== null && mode === 'run') {
      return emit(1, () => ({ ...runDocument({ tool, result: partial, dryRun, exitCode: 1 }), error: message }));
    }

    return failure(1, message, mode);
  }
}
