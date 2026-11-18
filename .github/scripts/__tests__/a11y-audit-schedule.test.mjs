import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';
import {
  A11Y_EVENTS, A11Y_NIGHTLY_WORKFLOW, DOCS_A11Y_WORKFLOW, READER_NIGHTLY_WORKFLOW, SOURCES_OF_WORKFLOW, WEBSITE_A11Y_WORKFLOW, isA11yRun,
} from '../lib/a11y-ledger.mjs';
import { runContextFromRun } from '../lib/test-health.mjs';
import { AUDIT_REF } from '../../../tests/lib/a11y-dispatch.mjs';
import { EVIDENCE_CHECKS } from '../../../tests/lib/a11y-evidence.mjs';
import { siteChecks } from '../../../tests/lib/a11y-site-checks.mjs';
import { AUDIT_EVENTS, countingScope } from '../../../tests/lib/a11y-verdict.mjs';

// tests/AGENTS.md ("A11y: the audit and the proof runs"): the full accessibility audit runs once a week on a
// schedule, on develop, in four workflows that start minutes apart. A cron fires from the default branch only,
// so no run from a branch can prove the schedule before it merges. This file is that proof: the four crons and
// their order, and that a scheduled run, whose `inputs` hold nothing, is read everywhere as a dispatch on develop
// with no inputs is. It passes the guard, runs everything, counts as an audit, reaches the ledger, and its red
// verdict reaches no notification.
//
// Text-based, like the other workflow pins: the tooling job installs no dependencies.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');
const DOC = 'See tests/AGENTS.md, "A11y: the audit and the proof runs".';

const READER = '.github/workflows/screenreader-nightly.yml';
const NIGHTLY = '.github/workflows/a11y-nightly.yml';
const DOCS = '.github/workflows/docs-a11y.yml';
const WEBSITE = '.github/workflows/website-a11y.yml';
// The four workflows of the audit, in the order they start.
const AUDIT = [
  { file: READER, name: READER_NIGHTLY_WORKFLOW },
  { file: NIGHTLY, name: A11Y_NIGHTLY_WORKFLOW },
  { file: DOCS, name: DOCS_A11Y_WORKFLOW },
  { file: WEBSITE, name: WEBSITE_A11Y_WORKFLOW },
];
// The reusable workflows the two nightlies call: they read the caller's event.
const CALLED = ['.github/workflows/a11y.yml', '.github/workflows/screenreader.yml'];

// What each expression that reads `inputs` gives on a schedule, where `inputs` holds nothing: a property of it
// is null, null is falsy, null equals '' (GitHub reads both as 0), and null written into a string is ''. A new
// expression joins this table with its value, which is the moment to check it on a schedule.
const ON_SCHEDULE = {
  'inputs.projects': '',
  'inputs.groups': '',
  'inputs.checks': '',
  'inputs.base-url': '',
  'inputs.projects || \'\'': '',
  'inputs.groups || \'\'': '',
  'inputs.checks || \'\'': '',
  'inputs.suite == \'pull-request\' && \'pull-request\' || \'nightly\'': 'nightly',
  'inputs.suite != \'pull-request\'': 'true',
  'github.event_name == \'workflow_dispatch\' && inputs.update-goldens || false': 'false',
  'inputs.checks == \'\' && 30 || 7': '30',
};

/**
 * The expressions of a workflow, without their braces.
 *
 * @param {string} source The workflow's text.
 * @returns {string[]} Every `${{ … }}` expression, in order.
 */
function expressions(source) {
  return [...source.matchAll(/\$\{\{\s*(.*?)\s*\}\}/g)].map(([, expression]) => expression);
}

/**
 * A workflow's crons.
 *
 * @param {string} file The workflow file.
 * @returns {string[]} Every cron of its `schedule` trigger.
 */
function crons(file) {
  const [, triggers = ''] = /^on:\n([\s\S]*?)^\S/m.exec(stripYamlComments(read(file))) ?? [];
  const [, schedule = ''] = /^ {2}schedule:\n((?: {4}.*\n)+)/m.exec(triggers) ?? [];

  return [...schedule.matchAll(/^ {4}- cron: '([^']*)'$/gm)].map(([, cron]) => cron);
}

test('each workflow of the audit has one weekly cron, on Monday, and the ledger records every one of them', () => {
  for (const { file, name } of AUDIT) {
    const workflow = stripYamlComments(read(file));

    assert.match(workflow, new RegExp(`^name: ${name}$`, 'm'), `${file}: the name the ledger records.`);
    assert.equal(crons(file).length, 1, `${file}: one cron, the weekly audit. ${DOC}`);
    assert.equal(workflow.match(/cron:/g)?.length, 1, `${file}: no cron under another key.`);
    assert.match(crons(file)[0], /^\d{1,2} \d{1,2} \* \* 1$/,
      `${file}: once a week, on Monday. While the accessibility debt is being fixed the ledger needs an audit a week to show what each fix cleared; `
      + `a run every night would spend seven times the compute. ${DOC}`);
  }
  assert.deepEqual(AUDIT.map(({ name }) => name).sort(), Object.keys(SOURCES_OF_WORKFLOW).sort(),
    `the scheduled workflows are the recorded ones (SOURCES_OF_WORKFLOW): a workflow that joins the ledger says here whether the weekly audit runs it. ${DOC}`);
});

test('the four start minutes apart, the screen reader run first, off the hour and in the small hours of Monday', () => {
  const starts = AUDIT.map(({ file }) => {
    const [minute, hour] = crons(file)[0].split(' ').map(Number);

    return { file, minute, at: (hour * 60) + minute };
  });

  assert.equal(starts[0].file, READER, 'the screen reader run is the longest and the only one that waits for a lane, so it starts first');
  starts.slice(1).forEach((start, index) => {
    assert.ok(start.at > starts[index].at, `${start.file} starts after ${starts[index].file}: the four start in one order every week. ${DOC}`);
  });
  assert.ok(starts.at(-1).at - starts[0].at <= 15,
    `the four start within a quarter of an hour, so they read one develop commit: a schedule runs on the default branch's latest commit. ${DOC}`);
  for (const { file, minute, at } of starts) {
    assert.notEqual(minute, 0, `${file}: off the hour, where GitHub delays scheduled runs and may drop them.`);
    assert.ok(at < 4 * 60,
      `${file}: early Monday UTC. Nothing merges at the weekend, no proof run is likely at night, and the screen reader run is over before the working day. ${DOC}`);
  }
});

test('every expression that reads the inputs has a known value on a schedule, where the inputs hold nothing', () => {
  for (const { file } of AUDIT) {
    const reads = expressions(stripYamlComments(read(file))).filter(expression => /\binputs\./.test(expression));

    assert.ok(reads.length > 0, `${file}: read the expressions`);
    for (const expression of reads) {
      assert.ok(Object.hasOwn(ON_SCHEDULE, expression),
        `${file}: \${{ ${expression} }} reads the inputs, and a schedule has none. Say what it gives there (ON_SCHEDULE): the run must read as a dispatch on develop with no inputs. ${DOC}`);
    }
  }

  const lane = job(stripYamlComments(read(READER)), 'screenreader');
  const module = job(stripYamlComments(read(NIGHTLY)), 'a11y');
  const forwarded = (body, input) => new RegExp(`^ {6}${input}: \\$\\{\\{ (.*) \\}\\}$`, 'm').exec(body)?.[1];

  // What the called workflows receive on a schedule: every lane, comparing with the goldens; every check.
  assert.equal(ON_SCHEDULE[forwarded(lane, 'groups')], '', `${READER}: an empty groups input runs every group`);
  assert.equal(ON_SCHEDULE[forwarded(lane, 'projects')], '', `${READER}: an empty projects input runs every project`);
  assert.equal(ON_SCHEDULE[forwarded(lane, 'update-goldens')], 'false', `${READER}: a scheduled run compares with the goldens, it never records them`);
  assert.equal(ON_SCHEDULE[forwarded(module, 'nightly')], 'true', `${NIGHTLY}: a scheduled run runs every check, never the short suite`);
  assert.equal(ON_SCHEDULE[forwarded(module, 'check-ids')], '', `${NIGHTLY}: an empty check-ids input runs the suite`);
  for (const input of ['groups', 'projects']) {
    assert.match(forwarded(lane, input), / \|\| ''$/,
      `${READER}: a string input of a called workflow gets a string on every event; \`inputs.${input}\` alone is null on a schedule.`);
  }
  assert.match(forwarded(module, 'check-ids'), / \|\| ''$/, `${NIGHTLY}: a string input of a called workflow gets a string on every event.`);
  // An audit's evidence is what the conformance report cites, so a scheduled run keeps it as long as a dispatched one.
  for (const file of [DOCS, WEBSITE]) {
    const [, retention] = /^ {10}retention-days: \$\{\{ (.*inputs\..*) \}\}$/m.exec(job(stripYamlComments(read(file)), 'checks')) ?? [];

    assert.equal(ON_SCHEDULE[retention], '30', `${file}: the evidence of a scheduled audit is kept 30 days.`);
  }
});

test('a scheduled run passes every check-inputs guard and runs everything, as a dispatch on develop with no inputs does', () => {
  const covers = {
    [READER]: /^a11y-dispatch-inputs: reader projects: every one; scenario groups: every one$/m,
    [NIGHTLY]: new RegExp(`^a11y-dispatch-inputs: checks beyond axe: ${Object.keys(EVIDENCE_CHECKS).join(', ')}$`, 'm'),
    [DOCS]: new RegExp(`^a11y-dispatch-inputs: docs site checks: ${Object.keys(siteChecks('docs')).join(', ')}$`, 'm'),
    [WEBSITE]: new RegExp(`^a11y-dispatch-inputs: website site checks: ${Object.keys(siteChecks('website')).join(', ')}$`, 'm'),
  };

  for (const { file } of AUDIT) {
    const guard = job(stripYamlComments(read(file)), 'check-inputs');
    const step = steps(guard).find(entry => /^ {8}run: node tests\/scripts\/a11y-dispatch-inputs\.mjs /m.test(entry)) ?? '';
    const [, command = ''] = /^ {8}run: (node tests\/scripts\/a11y-dispatch-inputs\.mjs .*)$/m.exec(step) ?? [];
    // The step's environment as a schedule fills it, and the ref a schedule runs on.
    const env = { GITHUB_REF: AUDIT_REF };

    for (const [, name, expression] of step.matchAll(/^ {10}([A-Z][A-Z0-9_]*): \$\{\{ (.*) \}\}$/gm)) {
      assert.ok(Object.hasOwn(ON_SCHEDULE, expression), `${file}: say what \${{ ${expression} }} gives on a schedule (ON_SCHEDULE)`);
      env[name] = ON_SCHEDULE[expression];
    }

    assert.ok(command, `${file}: the check-inputs job runs the guard script. ${DOC}`);
    assert.doesNotMatch(guard, /^ {4}if: .*(?:workflow_dispatch|schedule)/m, `${file}: the guard runs on the schedule as on a dispatch.`);

    // The step's own command line, with each "$NAME" as the schedule sets it.
    const [, ...args] = command.split(' ').map((word) => {
      const [, name] = /^"\$([A-Z][A-Z0-9_]*)"$/.exec(word) ?? [];

      if (name !== undefined) {
        assert.ok(Object.hasOwn(env, name), `${file}: the guard reads $${name}, which the step does not set`);

        return env[name];
      }

      return word;
    });
    const child = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });

    assert.equal(child.status, 0, `${file}: a scheduled run is the audit, and the guard lets it through. ${child.stdout}${child.stderr}`);
    assert.match(child.stdout, /^a11y-dispatch-inputs: no subset on refs\/heads\/develop$/m, `${file}: no input, so no subset`);
    assert.match(child.stdout, covers[file], `${file}: the scheduled run covers everything. ${DOC}`);
  }
});

test('no job or step tells a schedule from a dispatch, but the wait for the lanes and the golden recorder', () => {
  const comparisons = file => [...new Set([...stripYamlComments(read(file)).matchAll(/github\.event_name\s*(==|!=)\s*'([a-z_]+)'/g)]
    .map(([, operator, event]) => `${operator} ${event}`))].sort();
  // A comparison with `pull_request`, either way, tells a pull request's run from every other, and a schedule and
  // a dispatch land on the same side of it. Any other comparison could tell the two apart.
  const tellsApart = file => comparisons(file).filter(comparison => !comparison.endsWith(' pull_request'));
  const why = 'Everything else asks only whether the run is a pull request\'s, so a scheduled run takes every path a dispatch takes.';

  assert.deepEqual(tellsApart(READER), ['== schedule', '== workflow_dispatch'], `${READER}: ${why} ${DOC}`);
  for (const file of [NIGHTLY, DOCS, WEBSITE]) {
    assert.ok(comparisons(file).length > 0, `${file}: read the comparisons`);
    assert.deepEqual(tellsApart(file), [], `${file}: ${why} ${DOC}`);
  }
  for (const file of CALLED) {
    assert.deepEqual(tellsApart(file), [], `${file}: a called workflow reads its caller's event. ${why}`);
  }

  const reader = stripYamlComments(read(READER));

  assert.equal(reader.match(/github\.event_name == 'schedule'/g)?.length, 1, `${READER}: only the wait for the lanes is the schedule's own.`);
  assert.equal(reader.match(/github\.event_name == 'workflow_dispatch'/g)?.length, 1, `${READER}: only a dispatch can ask to record the goldens.`);
  for (const { file } of AUDIT) {
    const workflow = stripYamlComments(read(file));

    for (const id of jobIds(workflow)) {
      assert.doesNotMatch(job(workflow, id), /^ {4}if: .*(?:== 'workflow_dispatch'|!= 'schedule')/m, `${file}: the ${id} job runs on the schedule.`);
    }
  }
});

test('a scheduled run counts as an audit, and the ledger records it from each of the four workflows', () => {
  const [, chained = ''] = /^ {4}workflows: \[(.*)\]$/m.exec(stripYamlComments(read('.github/workflows/test-health.yml'))) ?? [];
  const run = { id: 1, run_attempt: 1, html_url: 'https://github.com/o/r/actions/runs/1', head_branch: 'develop', head_sha: 'a'.repeat(40),
    event: 'schedule', updated_at: '2026-11-23T03:30:00Z', conclusion: 'failure' };

  assert.ok(AUDIT_EVENTS.includes('schedule'), 'the check runs of a scheduled run count every open finding');
  assert.equal(countingScope('schedule'), 'audit');
  assert.equal(countingScope('workflow_dispatch'), 'audit');
  assert.ok(A11Y_EVENTS.includes('schedule'));
  for (const { file, name } of AUDIT) {
    assert.equal(isA11yRun(runContextFromRun({ ...run, name })), true,
      `${file}: its scheduled run on develop is a night of the ledger, red verdict or not. ${DOC}`);
    assert.equal(isA11yRun(runContextFromRun({ ...run, name, event: 'pull_request' })), false, `${file}: its pull request run is never one`);
    assert.ok(chained.includes(`'${name}'`), `.github/workflows/test-health.yml: the collector chains on ${name}, so a scheduled run is collected with no dispatch. ${DOC}`);
  }
});

test('a red verdict of a scheduled audit reaches no notification: Slack hears only of a run that never reached its checks', () => {
  for (const file of [READER, NIGHTLY]) {
    const workflow = stripYamlComments(read(file));
    const notify = job(workflow, 'notify');

    assert.match(notify, /^ {4}if: \$\{\{ failure\(\) && github\.event_name != 'pull_request' && github\.ref_name == 'develop' \}\}$/m,
      `${file}: the Slack ping fires on develop on a failure before the checks, on the schedule as on a dispatch. ${DOC}`);
    assert.doesNotMatch(notify, /^ {4}needs: .*verdict/m,
      `${file}: an audit with an open critical or serious finding ends red on its verdict job by design; that is the audit's answer, never a broken build, and Slack must not hear of it. ${DOC}`);
    for (const id of jobIds(workflow)) {
      assert.doesNotMatch(job(workflow, id), /^ {4}needs: .*verdict/m, `${file}: nothing follows the verdict job (${id}).`);
    }
  }
  for (const file of [DOCS, WEBSITE]) {
    assert.doesNotMatch(stripYamlComments(read(file)), /slack/i, `${file}: the site audits post to no channel at all. ${DOC}`);
  }

  // Only the collector reacts to a completed audit run: no other workflow chains on one of the four.
  const dir = path.join(ROOT, '.github/workflows');
  const listeners = readdirSync(dir).filter(name => /\.ya?ml$/.test(name)).filter((name) => {
    const [, block = ''] = /^ {2}workflow_run:\n((?: {4}.*\n)+)/m.exec(stripYamlComments(readFileSync(path.join(dir, name), 'utf8'))) ?? [];

    return AUDIT.some(({ name: workflow }) => block.includes(`'${workflow}'`));
  });

  assert.deepEqual(listeners, ['test-health.yml'], `.github/workflows: only the collector chains on the audit workflows. ${DOC}`);
});

test('the website audit reads production behind the same guard on every event', () => {
  const workflow = stripYamlComments(read(WEBSITE));
  const envOf = id => [.../^ {4}env:\n((?: {6}.*\n)+)/m.exec(job(workflow, id))?.[1].matchAll(/^ {6}([A-Z][A-Z0-9_]*):/gm) ?? []].map(([, name]) => name);

  assert.deepEqual(envOf('scan'), ['WEBSITE_A11Y_BASE_URL', 'A11Y_HEAD_SHA'], `${WEBSITE}: the scan is handed the deploy and the commit, nothing about the event.`);
  assert.deepEqual(envOf('checks'), ['WEBSITE_A11Y_BASE_URL', 'HOT_A11Y_SITE', 'A11Y_CHECKS', 'A11Y_HEAD_SHA'],
    `${WEBSITE}: the checks are handed the deploy, the site, the subset and the commit, nothing about the event.`);
  assert.equal(ON_SCHEDULE['inputs.base-url'], '', 'no deploy named, so a scheduled run reads production');

  // guardSite() answers the form submit and the booking in the browser, so an audit sends no form and books no call.
  // It decides from the request alone: nothing in the scan's own code reads the event or the ref.
  const guard = read('tests/a11y/website/website-site.ts');

  assert.match(guard, /^export async function guardSite\(/m);
  assert.doesNotMatch(guard, /process\.env/, 'tests/a11y/website/website-site.ts: the guard reads nothing from the environment, so no trigger can switch it off');
  for (const dir of ['tests/a11y/website', 'tests/a11y/sites']) {
    for (const name of readdirSync(path.join(ROOT, dir)).filter(entry => /\.(?:ts|mjs)$/.test(entry))) {
      assert.doesNotMatch(read(`${dir}/${name}`), /GITHUB_EVENT_NAME|GITHUB_REF\b/, `${dir}/${name}: the scan reads the same site the same way on a schedule.`);
    }
  }
});
