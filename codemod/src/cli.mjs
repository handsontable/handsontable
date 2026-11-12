import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { UsageError } from './errors.mjs';
import { plural, renderConsole, renderMarkdown } from './report.mjs';
import { describeRules, resolvePlan, run } from './runner.mjs';

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
                        Defaults to the latest released migration.
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
  --aggressive          Also rewrite settings objects found with medium confidence.
  --include-draft       Run migrations that are still drafts.
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
`;

const OPTIONS = {
  from: { type: 'string' },
  to: { type: 'string' },
  'dry-run': { type: 'boolean' },
  'allow-dirty': { type: 'boolean' },
  report: { type: 'string' },
  only: { type: 'string', multiple: true },
  list: { type: 'boolean' },
  aggressive: { type: 'boolean' },
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
 * @returns {string} For example `Unknown option "--bogus".`.
 */
function describeUsageError(error) {
  const named = /'(-[^']*?)(?: <value>)?'/.exec(error.message)?.[1];

  if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION' && named) {
    return `Unknown option "${named}".`;
  }

  if (error.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE' && named) {
    return `Option "${named}" needs a value.`;
  }

  return error.message.split('. ')[0].replace(/'/g, '"').replace(/\.?$/, '.');
}

/**
 * The version in the `package.json` of the tool.
 *
 * @returns {Promise<string>} The version text.
 */
async function packageVersion() {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

  return manifest.version;
}

/**
 * Format the rules of a plan as an aligned text table with a line of counts at the end.
 *
 * @param {ReturnType<typeof describeRules>} rows Rows from `describeRules`.
 * @returns {string} Text that ends with a newline.
 */
function renderList(rows) {
  const idWidth = Math.max(...rows.map(row => row.id.length), 2);
  const kindWidth = Math.max(...rows.map(row => row.kind.length), 4);
  const state = row => (row.implemented ? row.mode : 'not implemented');
  const lines = rows.map(row => `${row.id.padEnd(idWidth)}  ${row.kind.padEnd(kindWidth)}  ${state(row)}`);
  const count = name => rows.filter(row => state(row) === name).length;
  const missing = count('not implemented');

  lines.push('', `${rows.length} rules: ${count('rewrite')} rewrite, ${count('report')} report`
    + `${missing > 0 ? `, ${missing} not implemented` : ''}.`);

  return `${lines.join('\n')}\n`;
}

/**
 * Run the CLI. It never calls `process.exit`: the caller sets `process.exitCode` from the return value.
 *
 * @param {string[]} argv Arguments after the node binary and script path.
 * @param {object} [io] Injection points for tests.
 * @param {string} [io.cwd] Working directory.
 * @param {(text: string) => void} [io.stdout] Standard output writer.
 * @param {(text: string) => void} [io.stderr] Standard error writer.
 * @param {boolean} [io.progress] Whether to print a progress line every two seconds. Defaults to whether standard
 * output is a terminal.
 * @returns {Promise<number>} The exit code: 0 done, 1 runtime or parse errors, 2 usage error or refusal.
 */
export async function main(argv, {
  cwd = process.cwd(),
  stdout = text => process.stdout.write(text),
  stderr = text => process.stderr.write(text),
  progress = Boolean(process.stdout.isTTY),
} = {}) {
  let parsed;

  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    stderr(`${describeUsageError(error)}\n${USAGE_LINE}\nRun with --help for all options.\n`);

    return 2;
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

  if (command !== 'migrate') {
    const problem = command ? `Unknown command "${command}".` : 'Missing command.';

    stderr(`${problem} Use: handsontable-codemod migrate\n${USAGE_LINE}\nRun with --help for all options.\n`);

    return 2;
  }

  const maxFileSize = values['max-file-size'] === undefined ? undefined : Number(values['max-file-size']);

  if (maxFileSize !== undefined && (!Number.isInteger(maxFileSize) || maxFileSize <= 0)) {
    stderr(`--max-file-size needs a whole number of bytes above 0, not "${values['max-file-size']}".\n`);

    return 2;
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

  try {
    if (values.list) {
      const { plan, notes } = await resolvePlan({ ...range, lenientFrom: true });

      notes.forEach(note => stderr(`${note}\n`));
      stdout(renderList(describeRules(plan)));

      return 0;
    }

    const dryRun = Boolean(values['dry-run']);
    const result = await run({
      ...range,
      paths,
      dryRun,
      aggressive: Boolean(values.aggressive),
      allowDirty: Boolean(values['allow-dirty']),
      reportPath: values.report,
      maxFileSize,
      onWarning: text => stderr(`${text}\n`),
      onProgress: progress
        ? ({ done, total }) => stderr(`Checked ${done} of ${plural(total, 'file')}...\n`)
        : undefined,
    });

    result.notes.forEach(note => stderr(`${note}\n`));

    if (result.error) {
      stderr(`${result.error}\n`);

      return result.exitCode;
    }

    if (dryRun) {
      result.diffs.forEach(({ diff }) => stdout(diff));
    }

    const summary = { filesChanged: result.changedFiles.length, dryRun };

    stdout(renderConsole(result.report, summary));

    if (values.report) {
      const date = new Date().toISOString().slice(0, 10);

      await writeFile(resolve(cwd, values.report), renderMarkdown(result.report, {
        ...summary,
        from: result.from,
        to: result.to,
        date,
      }));
      stdout(`Report written to ${values.report}.\n`);
    }

    if (!dryRun && result.changedFiles.length > 0) {
      const manual = result.report.counts().manual;

      stdout('Next: run your formatter and linter on the changed files.\n'
        + 'Next: run tsc and your tests.\n');

      if (manual > 0) {
        stdout(`Next: work through the ${plural(manual, 'manual step')} in the report. `
          + 'Find the markers with: git grep "TODO(handsontable-codemod"\n');
      }
    }

    return result.exitCode;
  } catch (error) {
    if (error instanceof UsageError) {
      stderr(`${error.message}\n`);

      return 2;
    }

    stderr(`${error.stack ?? error.message}\n`);

    return 1;
  }
}
