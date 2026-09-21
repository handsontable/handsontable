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
// clear on its own pull request, so each test here pins one way that protection could be lost:
// the hook stops blocking, it starts blocking everything (and gets switched off), or the wiring that
// invokes it disappears from .claude/settings.json.

const root = repoRoot();
const HOOK = path.join(root, 'scripts/claude/deny-deployment-approval.mjs');

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

test('it blocks approving a pending deployment, whatever shape the call takes', () => {
  // Three shapes an agent would actually reach for. All of them carry the endpoint segment, which is
  // why the pattern matches on that rather than on `gh` or on a flag order that varies.
  const blocked = [
    'gh api --method POST repos/handsontable/handsontable/actions/runs/123/pending_deployments '
      + '-f state=approved -f environment_ids[]=1',
    'curl -X POST -H "Authorization: token $GH" '
      + 'https://api.github.com/repos/handsontable/handsontable/actions/runs/123/pending_deployments',
    'gh api -X POST "/repos/$REPO/actions/runs/$RUN/pending_deployments" --input approve.json',
  ];

  blocked.forEach((command) => {
    const { status, stderr } = runHook(bash(command));

    assert.equal(status, 2, `the hook let an approval through: ${command}`);
    assert.match(stderr, /never do that/,
      'the block must say why, or the model retries it a different way');
  });
});

test('it leaves every other command alone, including reading the approvals it protects', () => {
  // A hook that blocks more than the one dangerous verb gets switched off, and a hook that is off
  // protects nothing (.ai/LOCAL-ENFORCEMENT.md §2). The fail-closed assertions in manual-qa.yml and
  // visual.yml read `GET .../approvals` on every run, so that call in particular must stay open.
  const allowed = [
    'gh api repos/handsontable/handsontable/actions/runs/123/approvals',
    'gh pr checks 13568 --repo handsontable/handsontable',
    'gh run view 123 --repo handsontable/handsontable',
    'npm run test:tooling',
    'git status --short',
  ];

  allowed.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0, `the hook blocked an innocent command: ${command}`);
  });
});

test('reading about the gate is not approving it', () => {
  // The first version of this hook matched the endpoint string alone, so every command that MENTIONED
  // the path was blocked — including a grep over the very docs that describe the gate, and a `cat` of
  // this hook. That is the shape .ai/LOCAL-ENFORCEMENT.md §2 warns about: the false positives make
  // somebody switch the hook off, and then it guards nothing. Each of these is a read.
  const reads = [
    'grep -rn pending_deployments .ai/',
    'rg pending_deployments scripts/claude',
    'git grep -n pending_deployments',
    'cat scripts/claude/deny-deployment-approval.mjs',
    'node --test scripts/__tests__/deny-deployment-approval.test.mjs',
    // A plain GET lists what a run is waiting on and changes nothing — it is how an agent answers
    // "is this blocked on a human?", which it should be able to ask.
    'gh api repos/handsontable/handsontable/actions/runs/123/pending_deployments',
  ];

  reads.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0,
      `the hook blocked a read: ${command}. It must match the write, not the path.`);
  });
});

test('it catches a write however the method is spelled', () => {
  // gh infers POST from a field flag, so the method often never appears in the command; curl and gh
  // spell the explicit form differently; and the decision itself is a give-away whatever carries it.
  // Each of these reaches the endpoint with intent to change it.
  const writes = [
    'gh api repos/x/y/actions/runs/1/pending_deployments -f state=approved',
    'gh api --method POST repos/x/y/actions/runs/1/pending_deployments',
    'gh api -X POST repos/x/y/actions/runs/1/pending_deployments --input body.json',
    'curl --request PUT https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'gh api repos/x/y/actions/runs/1/pending_deployments --raw-field state=rejected',
  ];

  writes.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `the hook let a write through: ${command}`);
  });
});

test('it judges Bash only, and survives a payload it cannot read', () => {
  // A PreToolUse hook that threw on a malformed payload would block every Bash call in the session,
  // so the unreadable cases must exit 0 rather than fail closed.
  assert.equal(runHook({ tool_name: 'Edit', tool_input: { file_path: 'pending_deployments.md' } }).status, 0,
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
