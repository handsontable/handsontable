import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../claude/session.mjs';

// The deployment-approval gates (manual-qa, visual-approval, docs-visual-approval, approvers) record
// that a PERSON looked at something a machine cannot judge. "Prevent self-review" is deliberately off
// on all of them, so GitHub authorizes the TOKEN and would happily record an agent's API call as the
// token owner's own sign-off. This hook is the only thing standing between an agent and a gate it can
// clear on its own pull request.
//
// It matches a PATH, not a verb, and that is the whole design. Telling a write from a read means
// parsing shell, and five review rounds of trying produced five different bypasses — clustered short
// options, a flag glued to its value, wget's spelling of a body, httpie's positional method, a
// quote-split endpoint, a backslash continuing a line, `2>&1`, `<&-` — each one silent, each one on
// the single action the hook exists to stop. The leading slash separates a CALL from a MENTION and no
// amount of shell syntax can remove it, so that is what these tests pin: every write shape blocked,
// every bare-word mention allowed, and the deliberate cost of the trade stated rather than implied.

const root = repoRoot();
const HOOK = path.join(root, 'scripts/claude/deny-deployment-approval.mjs');
const URL_FORM = 'https://api.github.com/repos/x/y/actions/runs/1/pending_deployments';
const PATH_FORM = 'repos/x/y/actions/runs/1/pending_deployments';

/**
 * Run the hook the way Claude Code does — payload as JSON on stdin.
 *
 * @param {object} payload The PreToolUse payload.
 * @returns {{status: number, stderr: string}} The hook's exit status and message.
 */
function runHook(payload) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });

  return { status: result.status, stderr: result.stderr ?? '' };
}

const bash = command => ({ tool_name: 'Bash', tool_input: { command } });

test('every approval shape found in review is blocked, whatever the shell does to it', () => {
  // One case per bypass a verb-matching version let through, plus the plain shapes it did catch. They
  // are listed together because the point of matching the route is that the differences between them
  // stopped mattering.
  const blocked = [
    // Spelled-out method and fields.
    `gh api --method POST ${PATH_FORM} -f state=approved -f environment_ids[]=1`,
    `gh api -X POST "/${PATH_FORM}" --input approve.json`,
    `curl -X POST -H "Authorization: token $GH" ${URL_FORM}`,
    // A body implies POST with no method in sight.
    `curl -d@approve.json ${URL_FORM}`,
    `curl --json '{"state":"approved"}' ${URL_FORM}`,
    `curl --data-binary @approve.json ${URL_FORM}`,
    // Clustered and glued short options.
    `curl -sT approve.json ${URL_FORM}`,
    `curl -Tapprove.json ${URL_FORM}`,
    `curl -sd @approve.json ${URL_FORM}`,
    // wget's spelling of a body.
    `wget --post-file=approve.json ${URL_FORM}`,
    `wget --body-file=approve.json ${URL_FORM}`,
    // httpie: positional method, file body, stdin body, and all three binary names.
    `http POST ${URL_FORM} state=approved`,
    `https POST ${URL_FORM} @approve.json`,
    `httpie POST ${URL_FORM} @approve.json`,
    `http ${URL_FORM} < approve.json`,
    // Shell syntax that hid the command from a stage-splitting matcher.
    `curl -X POST \\\n  -H "Authorization: token $GH" \\\n  ${URL_FORM}`,
    `curl -d@approve.json 2>&1 ${URL_FORM}`,
    `curl -d@approve.json <&- ${URL_FORM}`,
    `curl -d@approve.json 0<&- ${URL_FORM}`,
    `curl -d@approve.json &>/tmp/log ${URL_FORM}`,
    `git status && curl -d@approve.json ${URL_FORM}`,
    `echo body | curl -d @- ${URL_FORM}`,
    // Quote-splitting the route, which bash resolves before any client sees it.
    `curl -d@approve.json ${URL_FORM.replace('pending_deployments', 'pending_dep\'\'loyments')}`,
  ];

  blocked.forEach((command) => {
    const { status, stderr } = runHook(bash(command));

    assert.equal(status, 2, `the hook let an approval through: ${command}`);
    assert.match(stderr, /must never/,
      'the block must say why, or the model retries it a different way');
  });
});

test('a bare mention of the gate is not a call to it', () => {
  // The load-bearing distinction. A command that CALLS the endpoint carries it as a path segment; a
  // command that TALKS about it carries the bare word. Matching the word alone is where this hook
  // started, and it blocked every grep over the docs that describe the gate — the false-positive shape
  // that gets a hook switched off, and a hook that is off protects nothing (.ai/LOCAL-ENFORCEMENT.md §2).
  const allowed = [
    'grep -rn pending_deployments .ai/',
    'rg pending_deployments scripts/claude',
    'git grep -n pending_deployments',
    'git grep -F pending_deployments',
    'grep -d skip -r pending_deployments .',
    'cat scripts/claude/deny-deployment-approval.mjs',
    'node --test scripts/__tests__/deny-deployment-approval.test.mjs',
    // Reading review comments on the pull request that adds this hook: names `gh`, mentions the word.
    'gh pr view 13568 --repo handsontable/handsontable --json comments --jq \'.comments[].body\' '
      + '| grep pending_deployments',
    'gh run view 123 --repo handsontable/handsontable --log | grep -F pending_deployments',
  ];

  allowed.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0,
      `the hook blocked a mention: ${command}. It must match the route, not the word.`);
  });
});

test('the ways to SEE a waiting gate stay open', () => {
  // Refusing reads of the route is only defensible because the useful questions have other answers.
  // These are the calls this repo's own diagnosis actually used, and the fail-closed assertions in
  // manual-qa.yml and visual.yml depend on the third one.
  const allowed = [
    'gh pr checks 13568 --repo handsontable/handsontable',
    'gh run view 35706362223 --repo handsontable/handsontable',
    'gh api repos/handsontable/handsontable/actions/runs/123/approvals',
    'curl -sS https://visual.handsontable.com/base/develop/out.json',
  ];

  allowed.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0, `the hook blocked an innocent command: ${command}`);
  });

  assert.match(runHook(bash(`gh api ${PATH_FORM}`)).stderr, /gh pr checks|gh run view/,
    'when it refuses, the message must name the calls that answer the same question');
});

test('reads of this one route are refused with the writes, on purpose', () => {
  // The previous design kept a plain GET allowed, and keeping it is what cost five bypasses: the only
  // thing separating that GET from an approval is the verb, and the verb cannot be read reliably off a
  // shell string. This pins the trade so nobody re-opens it by accident — and the last case pins the
  // false positive that comes with it, which is accepted rather than unnoticed.
  assert.equal(runHook(bash(`gh api ${PATH_FORM}`)).status, 2,
    'a plain GET of the approval route is refused too; see the docblock for why');
  assert.equal(runHook(bash(`curl -s ${URL_FORM}`)).status, 2,
    'the same for curl — the hook cannot tell this from an approval without parsing shell');
  assert.equal(runHook(bash(`gh run view 123 --log | grep -F ${PATH_FORM}`)).status, 2,
    'naming a client and quoting the full route is blocked even when nothing is called: the accepted '
    + 'false positive, and the message says to grep the bare word instead');
});

test('it judges Bash only, and survives a payload it cannot read', () => {
  // A PreToolUse hook that threw on a malformed payload would block every Bash call in the session,
  // so the unreadable cases must exit 0 rather than fail closed.
  assert.equal(runHook({ tool_name: 'Edit', tool_input: { file_path: `${PATH_FORM}.md` } }).status, 0,
    'a non-Bash tool must not be judged by a pattern written for shell commands');
  assert.equal(runHook({ tool_name: 'Bash' }).status, 0, 'a Bash payload with no command must pass');
  assert.equal(runHook({}).status, 0, 'an empty payload must pass');

  const raw = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });

  assert.equal(raw.status, 0, 'unparseable stdin must pass, or every Bash command in the session breaks');
});

test('the hook is wired as a PreToolUse Bash hook in .claude/settings.json', () => {
  // The script alone protects nothing: Claude Code only runs it because the settings file names it.
  // A refactor that moves or renames either half silently removes the protection, and nothing else
  // would notice — there is no CI run in which this hook fires.
  const settings = JSON.parse(readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
  const preToolUse = settings.hooks?.PreToolUse ?? [];
  const bashEntry = preToolUse.find(entry => entry.matcher === 'Bash');

  assert.ok(bashEntry, '.claude/settings.json has no PreToolUse hook matching Bash');
  assert.ok(
    (bashEntry.hooks ?? []).some(hook => hook.command?.includes('deny-deployment-approval.mjs')),
    'the Bash PreToolUse hook no longer invokes deny-deployment-approval.mjs',
  );
});
