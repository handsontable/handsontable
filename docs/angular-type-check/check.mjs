#!/usr/bin/env node
/**
 * Splits multi-section Angular example files into individual TS files,
 * writes them to a temp directory, then runs tsc --noEmit against TWO
 * Handsontable versions:
 *   - "local"  -> the dev build in ../../handsontable/tmp
 *   - "latest" -> handsontable@latest installed into .latest/node_modules
 *
 * Reporting rule (run-level): an error is only surfaced when BOTH versions
 * fail. If either version type-checks cleanly, the run is considered OK and
 * no error is shown (it is treated as a version-transition artifact).
 *
 * Each source file uses the format:
 *   /* file: app.component.ts * /
 *   ...content...
 *   /* end-file * /
 *
 * Sections are written to: .tmp/{guide-path}/{example-name}/{filename}
 * Plain TS files (no sections) are copied as-is.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(__dirname, '../content');
const tmpDir = path.resolve(__dirname, '.tmp');
const latestDir = path.resolve(__dirname, '.latest');

fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

function findAngularExamples(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAngularExamples(full, results);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      path.basename(path.dirname(full)) === 'angular'
    ) {
      results.push(full);
    }
  }
  return results;
}

const FILE_RE = /\/\* file: (.+?) \*\/([\s\S]*?)\/\* end-file \*\//g;
const CSS_IMPORT_RE = /^import\s+['"][^'"]+\.css['"]\s*;?\s*$/gm;
const STYLE_URLS_RE = /styleUrls\s*:\s*\[[^\]]*\]/g;
let fileCount = 0;

// Maps every generated .tmp file (posix path relative to __dirname) back to the
// source example it came from. Used by --report to attribute ngc errors to an
// example regardless of how many sections it was split into.
const exampleByTmpFile = new Map();

function toKey(absFile) {
  return path.relative(__dirname, absFile).split(path.sep).join('/');
}

function stripCssImports(code) {
  return code
    .replace(CSS_IMPORT_RE, '')
    .replace(STYLE_URLS_RE, 'styles: []');
}

for (const srcPath of findAngularExamples(contentDir)) {
  const relPath = path.relative(contentDir, srcPath);
  const exampleId = relPath.split(path.sep).join('/');
  const source = fs.readFileSync(srcPath, 'utf8');

  FILE_RE.lastIndex = 0;
  let match;
  let hasSections = false;

  while ((match = FILE_RE.exec(source)) !== null) {
    hasSections = true;
    const [, filename, content] = match;
    const exampleName = path.basename(relPath, '.ts');
    const guideDir = path.dirname(relPath);
    const outDir = path.join(tmpDir, guideDir, exampleName);

    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, filename.trim());
    fs.writeFileSync(outFile, stripCssImports(content.trim()) + '\n');
    exampleByTmpFile.set(toKey(outFile), exampleId);
    fileCount++;
  }

  if (!hasSections) {
    const outDir = path.join(tmpDir, path.dirname(relPath));
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, path.basename(relPath));
    fs.writeFileSync(outFile, stripCssImports(fs.readFileSync(srcPath, 'utf8')));
    exampleByTmpFile.set(toKey(outFile), exampleId);
    fileCount++;
  }
}

console.log(`Prepared ${fileCount} files in .tmp/`);

/**
 * Ensures handsontable@latest is installed under .latest/node_modules and
 * returns the absolute path to it. Cached between runs; delete the .latest
 * directory (or run with REFRESH_LATEST=1) to force a fresh install.
 */
function ensureLatestHandsontable() {
  const htPath = path.join(latestDir, 'node_modules', 'handsontable');
  const refresh = process.env.REFRESH_LATEST === '1';

  if (refresh) {
    fs.rmSync(latestDir, { recursive: true, force: true });
  }

  if (!fs.existsSync(path.join(htPath, 'package.json'))) {
    fs.mkdirSync(latestDir, { recursive: true });
    fs.writeFileSync(
      path.join(latestDir, 'package.json'),
      JSON.stringify({ name: 'ht-latest', private: true }, null, 2),
    );
    console.log('Installing handsontable@latest into .latest/ ...');
    execSync('npm install handsontable@latest --no-audit --no-fund --no-package-lock', {
      stdio: 'inherit',
      cwd: latestDir,
    });
  }

  const version = JSON.parse(fs.readFileSync(path.join(htPath, 'package.json'), 'utf8')).version;
  return { htPath, version };
}

/**
 * Runs ngc for a single Handsontable resolution target.
 * Captures (does not stream) output so the caller decides whether to print it.
 * Returns { ok, output }.
 */
function runCheck({ label, htDir }) {
  const tsconfig = {
    extends: './tsconfig.json',
    compilerOptions: {
      paths: {
        handsontable: [htDir],
        'handsontable/*': [`${htDir}/*`],
      },
    },
    include: ['./.tmp/**/*.ts', './types/**/*.d.ts'],
    exclude: ['**/node_modules/**'],
  };

  const tsconfigPath = path.join(__dirname, `tsconfig.tmp.${label}.json`);
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  try {
    const output = execSync(
      `node node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js --noEmit -p tsconfig.tmp.${label}.json`,
      { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { ok: true, output };
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    return { ok: false, output };
  } finally {
    fs.rmSync(tsconfigPath, { force: true });
  }
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;
const ERROR_LINE_RE = /(\.tmp[/\\][^\s:]+?\.ts):\d+:\d+\s*-\s*error/g;

/**
 * Parses an ngc output blob into the set of example ids that had >=1 error,
 * by mapping each errored .tmp file back through exampleByTmpFile.
 */
function failingExamples(output) {
  const ids = new Set();
  const clean = output.replace(ANSI_RE, '');
  let m;
  while ((m = ERROR_LINE_RE.exec(clean)) !== null) {
    const key = m[1].split('\\').join('/');
    const id = exampleByTmpFile.get(key);
    if (id) ids.add(id);
  }
  return ids;
}

// Matches both TypeScript (`TS\d+`) and Angular template (`NG\d+`) diagnostics;
// ngc reports the latter against the inline-template location in the .ts file.
const ERROR_DETAIL_RE = /(\.tmp[/\\][^\s:]+?\.ts):(\d+):(\d+)\s*-\s*error\s+((?:TS|NG)\d+):\s*(.*)/g;

/**
 * Parses an ngc output blob into a Map of individual errors keyed by
 * `file|code|message` (TS or NG; stable across versions because the generated .tmp
 * files are identical between runs — only the Handsontable types differ).
 * Each value carries the friendly example id and the human-readable message.
 */
function parseErrors(output) {
  const errors = new Map();
  const clean = output.replace(ANSI_RE, '');
  const matches = [...clean.matchAll(ERROR_DETAIL_RE)];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const [full, file, line, col, code, message] = m;

    // The text between this error line and the next one holds the code frame
    // (the offending source line plus the `~~~` underline) that ngc emits.
    const frameStart = m.index + full.length;
    const frameEnd = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    const frame = clean
      .slice(frameStart, frameEnd)
      .replace(/\r/g, '')
      .replace(/^\s*\n/, '')        // drop the blank line ngc puts before the frame
      .replace(/\n\s*\n[\s\S]*$/, '') // keep only the first frame block
      .replace(/\s+$/, '');

    const tmpKey = file.split('\\').join('/');
    // Identity key intentionally excludes line:col. The same logical error
    // (same file, same TS code, same message) must match across versions even
    // if a version-specific earlier error shifts the reported position;
    // otherwise a shared error gets mislabelled as LOCAL-ONLY / LATEST-ONLY.
    const key = `${tmpKey}|${code}|${message.trim()}`;
    errors.set(key, {
      key,
      exampleId: exampleByTmpFile.get(tmpKey) ?? tmpKey,
      location: `${line}:${col}`,
      code,
      message: message.trim(),
      frame,
    });
  }
  return errors;
}

// --report: classify every example as public / dev-only / broken instead of
// the pass/fail gate. Always runs BOTH versions in full.
if (process.argv.includes('--report')) {
  const localRun = runCheck({ label: 'local', htDir: '../../handsontable/tmp' });
  const { htPath: rHtPath, version: rVersion } = ensureLatestHandsontable();
  const latestRun = runCheck({
    label: 'latest',
    htDir: path.relative(__dirname, rHtPath).split(path.sep).join('/'),
  });

  const failLocal = failingExamples(localRun.output);
  const failLatest = failingExamples(latestRun.output);
  const allIds = [...new Set(exampleByTmpFile.values())].sort();

  const publicOk = [];
  const devOnly = [];
  const broken = [];

  for (const id of allIds) {
    if (!failLatest.has(id)) publicOk.push(id);          // passes on published latest
    else if (!failLocal.has(id)) devOnly.push(id);       // passes locally, fails on latest
    else broken.push(id);                                // fails on both
  }

  const list = (arr) => (arr.length ? arr.map((x) => `  ${x}`).join('\n') : '  (none)');
  console.log(`\n===== Example availability report (latest = ${rVersion}) =====`);
  console.log(`\nPUBLIC — type-checks against handsontable@latest (${publicOk.length}):`);
  console.log(list(publicOk));
  console.log(`\nDEV-ONLY — passes on local tmp, fails on latest (${devOnly.length}):`);
  console.log(list(devOnly));
  console.log(`\nBROKEN — fails on both versions (${broken.length}):`);
  console.log(list(broken));
  console.log(`\nTotal examples: ${allIds.length}`);
  process.exit(0);
}

// 1) Check against the local dev build first.
console.log('\n[1/2] Type-checking against local build (../../handsontable/tmp) ...');
const local = runCheck({ label: 'local', htDir: '../../handsontable/tmp' });

console.log(local.ok
  ? 'Local build type-checks cleanly; verifying against handsontable@latest to catch latest-only breakages ...'
  : 'Local build reported errors; verifying against handsontable@latest to classify them ...');

// 2) Always run latest too — even when local is clean — so issues can be
//    classified as LOCAL-ONLY, LATEST-ONLY, or BOTH. Skipping latest on a clean
//    local run would hide a "DEV-ONLY" example (type-checks on the dev build but
//    is broken on the published version): it should surface as a neutral check,
//    not a silent green.
const { htPath, version } = ensureLatestHandsontable();
console.log(`\n[2/2] Type-checking against handsontable@latest (${version}) ...`);
const latest = runCheck({ label: 'latest', htDir: path.relative(__dirname, htPath).split(path.sep).join('/') });

const localErrors = parseErrors(local.output);
const latestErrors = parseErrors(latest.output);

// Guard: if ngc exited non-zero but we couldn't extract a single `error TS…`
// line from its output, the failure is in a form the parser doesn't understand
// (Angular NG… template diagnostics, a compiler crash, a bad tsconfig, a failed
// install, etc.). The classification below only ever fails the run on a parsed
// `error TS…` shared by both versions, so without this guard such a failure
// would slip through as "STATUS: TRUE". Dump the raw output and fail hard.
const unparsedFailures = [];
if (!local.ok && localErrors.size === 0) unparsedFailures.push(['local', local.output]);
if (!latest.ok && latestErrors.size === 0) unparsedFailures.push(['latest', latest.output]);

if (unparsedFailures.length > 0) {
  console.error('\nSTATUS: FALSE — ngc failed but produced no recognizable `error TS…` lines.');
  for (const [label, output] of unparsedFailures) {
    console.error(`\n----- raw ngc output (${label}) -----`);
    console.error(output.trim() || '(no output captured)');
  }
  process.exit(1);
}

// Union of every distinct error seen across both versions.
const allKeys = [...new Set([...localErrors.keys(), ...latestErrors.keys()])].sort();

const inBoth = [];
const localOnly = [];
const latestOnly = [];

for (const key of allKeys) {
  const inLocal = localErrors.has(key);
  const inLatest = latestErrors.has(key);
  const err = localErrors.get(key) ?? latestErrors.get(key);

  if (inLocal && inLatest) inBoth.push(err);
  else if (inLocal) localOnly.push(err);
  else latestOnly.push(err);
}

// Every error is reported as info, tagged with where it occurs.
if (allKeys.length > 0) {
  console.log('\n===== Type-check errors (each listed as info) =====\n');
}

const printErr = (tag, e) => {
  console.log(`${tag}  ${e.exampleId}:${e.location}  ${e.code}: ${e.message}`);
  if (e.frame) {
    console.log(e.frame.split('\n').map((l) => `    ${l}`).join('\n'));
  }
  if (tag.startsWith('[LOCAL-ONLY')) {
    console.log(
      '    note: present only on the local dev build, not on handsontable@latest — '
      + 'likely a local type regression rather than a broken example.',
    );
  }
  console.log('');
};

for (const e of inBoth) printErr('[BOTH      ]', e);
for (const e of localOnly) printErr('[LOCAL-ONLY]', e);
for (const e of latestOnly) printErr('[LATEST-ONLY]', e);

const warnCount = localOnly.length + latestOnly.length;

// Markdown body shared by the job summary panel and the published check-run.
function buildReportMarkdown() {
  const row = (e, scope) => `| ${e.exampleId} | \`${e.code}\` | ${scope} | ${String(e.message).replace(/\\/g, '\\\\').replace(/\|/g, '\\|')} |`;
  const lines = [];
  lines.push('## Angular docs type-check');
  lines.push('');
  const result = inBoth.length > 0
    ? '❌ FAILED'
    : warnCount > 0 ? '⚠️ PASSED WITH WARNINGS' : '✅ PASSED';
  lines.push(`**Result:** ${result} (latest = ${version})`);
  lines.push('');
  lines.push(`- ❌ Errors in **both** versions (fail the run): **${inBoth.length}**`);
  lines.push(`- ⚠️ Version-specific issues (warnings only): **${warnCount}**`);
  lines.push('');
  if (inBoth.length + warnCount > 0) {
    lines.push('| Example | Code | Scope | Message |');
    lines.push('| --- | --- | --- | --- |');
    for (const e of inBoth) lines.push(row(e, '❌ both versions'));
    for (const e of localOnly) lines.push(row(e, '⚠️ local only'));
    for (const e of latestOnly) lines.push(row(e, '⚠️ latest only'));
    lines.push('');
  }
  return lines.join('\n');
}

const reportMarkdown = buildReportMarkdown();

/**
 * Publishes a Check Run via the GitHub Checks API. This is the only way to get
 * a "neutral" entry in the PR checks summary ("… 1 neutral …") — a normal step
 * can only resolve to success (exit 0) or failure (exit !=0), never neutral.
 * Requires GITHUB_TOKEN with `checks: write` permission.
 */
async function publishCheckRun(conclusion, title) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (typeof fetch !== 'function') {
    console.log('(skipping check-run publish: global fetch unavailable — needs Node 18+)');
    return;
  }
  if (!token || !repo) {
    console.log(`::warning::Cannot publish a "${conclusion}" check-run: missing `
      + `${!token ? 'GITHUB_TOKEN/GH_TOKEN' : 'GITHUB_REPOSITORY'}. `
      + 'Grant `checks: write` and pass the token to surface this as a neutral check in the PR.');
    return;
  }

  const [owner, name] = repo.split('/');

  // For pull_request events GITHUB_SHA is the merge commit; the check must be
  // attached to the PR head SHA to show up in the PR's checks summary.
  let headSha = process.env.GITHUB_SHA;
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (eventPath && fs.existsSync(eventPath)) {
      const ev = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
      if (ev.pull_request && ev.pull_request.head && ev.pull_request.head.sha) {
        headSha = ev.pull_request.head.sha;
      }
    }
  } catch {
    // fall back to GITHUB_SHA
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}/check-runs`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'content-type': 'application/json',
        'user-agent': 'angular-type-check',
      },
      body: JSON.stringify({
        name: 'Angular docs type-check',
        head_sha: headSha,
        status: 'completed',
        conclusion, // 'neutral' | 'failure'
        output: {
          title,
          summary: reportMarkdown.slice(0, 65000),
        },
      }),
    });

    if (res.ok) {
      console.log(`Published check-run "Angular docs type-check" (conclusion=${conclusion}).`);
    } else {
      const body = await res.text().catch(() => '');
      console.log(`::warning::Failed to publish "${conclusion}" check-run `
        + `(${res.status} ${res.statusText}). Needs \`checks: write\` permission. ${body.slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`::warning::Error publishing "${conclusion}" check-run: ${err.message}`);
  }
}

// GitHub Actions annotations: shared errors become red ::error annotations
// (and the step fails below with exit 1 -> "Error: Process completed with exit
// code 1."), while version-specific errors become yellow ::warning annotations
// that surface in the Warnings panel without failing the run.
if (process.env.GITHUB_ACTIONS === 'true') {
  const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const annotate = (level, e, scope) => {
    const file = `docs/content/${e.exampleId}`;
    const title = `${e.code} — ${scope}`;
    const msg = `${e.code}: ${e.message} (${scope}; reported at ${e.location} of the generated type-check file)`;
    console.log(`::${level} file=${esc(file)},title=${esc(title)}::${esc(msg)}`);
  };
  for (const e of inBoth) annotate('error', e, 'fails on BOTH local and latest');
  for (const e of localOnly) annotate('warning', e, 'local dev build only');
  for (const e of latestOnly) annotate('warning', e, 'handsontable@latest only');

  // When the step passes but version-specific issues exist, a green check alone
  // makes it look problem-free. Emit a top-level ::warning so the run shows the
  // yellow "this run has warnings" banner even with exit 0.
  if (inBoth.length === 0 && warnCount > 0) {
    console.log(
      `::warning title=Angular type-check passed with ${warnCount} version-specific issue(s)::`
      + esc(`${warnCount} example(s) type-check on only one Handsontable version. `
        + 'The step passed (no error shared by both versions) but these need attention — see annotations / job summary.'),
    );
  }

  // Job summary: a markdown panel on the run page that is hard to miss, unlike
  // file annotations which are easy to overlook on a green step.
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, `${reportMarkdown}\n`);
  }

  // Publish a separate, explicitly-named check-run so the PR checks summary
  // shows the right conclusion: NEUTRAL for warnings-only (visible as
  // "1 neutral" instead of being hidden among "successful"), FAILURE otherwise.
  if (inBoth.length > 0) {
    await publishCheckRun('failure', `Failed: ${inBoth.length} error(s) in both local and latest`);
  } else if (warnCount > 0) {
    await publishCheckRun('neutral', `Passed with ${warnCount} version-specific issue(s)`);
  }
}

console.log(
  `\nSummary: ${inBoth.length} in both, ${localOnly.length} local-only, ${latestOnly.length} latest-only (latest = ${version}).`,
);

// FALSE only when at least one error occurs in BOTH versions. Exit 1 makes the
// GitHub Actions step fail so the user sees "Error: Process completed with exit
// code 1.". Version-specific errors alone keep the step green (warnings only),
// while the published check-run carries the "neutral" conclusion in the PR.
if (inBoth.length > 0) {
  console.error('\nSTATUS: FALSE — at least one error occurs in BOTH versions (step fails).');
  process.exit(1);
}

if (warnCount === 0) {
  console.log('\nNo type errors on either version. STATUS: TRUE');
} else {
  console.log('\nSTATUS: TRUE — only version-specific errors (warnings + neutral PR check, step passes).');
}
process.exit(0);
