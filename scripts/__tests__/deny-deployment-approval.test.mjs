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
    // `-F` is git grep's fixed-strings and `-d` is grep's --directories; both collide with curl's body
    // flags, so the block needs an HTTP client in the command before a flag means anything.
    'git grep -F pending_deployments',
    'grep -d skip -r pending_deployments .',
    'cat scripts/claude/deny-deployment-approval.mjs',
    'node --test scripts/__tests__/deny-deployment-approval.test.mjs',
    // `--json` is a BODY to curl but an output selector to gh, and `-F` is git grep's fixed-strings.
    // A flag list that ignores which tool owns the flag blocks these three, and the first of them is
    // how this session read the review comments on the very PR that added the hook.
    'gh pr view 13568 --repo handsontable/handsontable --json comments --jq \'.comments[].body\' '
      + '| grep pending_deployments',
    'gh run view 123 --repo handsontable/handsontable --log | grep -F pending_deployments',
    'gh api repos/handsontable/handsontable/actions/runs/123/pending_deployments '
      + '--jq \'.[].environments[].name\'',
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
    // curl's usual POST: the body implies the method, and the body is JSON, so NEITHER an `-X` nor a
    // `state=approved` form field appears anywhere in the command. The first narrowed version of this
    // hook missed exactly this, which made it weaker than the blunt path-only match it replaced — and
    // it is the documented shape, so it is what a blocked agent reaches for next.
    'curl -H "Authorization: token $GH" -d \'{"state":"approved","environment_ids":[1]}\' '
      + 'https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'curl --json \'{"state":"approved"}\' https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'curl --data-binary @approve.json https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    // The body GLUED to the flag, pointing at a file. This is the worst case for a matcher that looks
    // for the decision: `state` appears in approve.json, not in the command, so the flag is the only
    // thing left — and a pattern demanding whitespace after `-d` never sees it.
    'curl -d@approve.json https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'curl -T approve.json https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
  ];

  writes.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `the hook let a write through: ${command}`);
  });
});

test('it covers the body flags of every client it claims to cover', () => {
  // `CURL_TOOL` has always named wget and httpie, but the body flags were curl's alone, so
  // `wget --post-file=approve.json` walked through — measured against the hook, not inferred. wget
  // infers POST from its body exactly as curl does, and httpie is the one of the three that reads
  // STDIN as the body, so a bare redirect is a write there.
  const blocked = [
    'wget --post-file=approve.json https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'wget --post-data approve.txt https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'wget --body-file=approve.json https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'http https://api.github.com/repos/x/y/actions/runs/1/pending_deployments < approve.json',
  ];

  blocked.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `the hook let a write through: ${command}`);
  });

  // curl ignores stdin unless asked for it, so a plain redirect beside a curl GET changes nothing and
  // must not be blocked. The forms that DO make curl read stdin carry a body flag and are covered above.
  assert.equal(
    runHook(bash('curl -s https://api.github.com/repos/x/y/actions/runs/1/pending_deployments < /dev/null')).status,
    0,
    'curl does not read stdin without a body flag, so a redirect beside a GET is still a GET',
  );
});

test('shell quote-splitting does not hide the endpoint', () => {
  // bash resolves `pending_dep''loyments` to the real path before the client sees it, so a pattern
  // that only reads the command as written misses an approval that will land. The same split works on
  // a flag or a value, which is why every pattern is tested against the unquoted form too.
  const blocked = [
    'curl -d@approve.json https://api.github.com/repos/x/y/actions/runs/1/pending_dep\'\'loyments',
    'gh api repos/x/y/actions/runs/1/pending_deployments -f "st"ate=approved',
    'curl -X POST https://api.github.com/repos/x/y/actions/runs/1/pen\\ding_deployments',
  ];

  blocked.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `quote-splitting hid an approval: ${command}`);
  });

  // Stripping quotes must not invent a match either: these are still reads.
  const allowed = [
    'grep -rn "pending_deployments" .ai/',
    'git grep -F \'pending_deployments\'',
    'gh api repos/x/y/actions/runs/1/pending_deployments --jq \'.[].state\'',
  ];

  allowed.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0, `the hook blocked a read: ${command}`);
  });
});

test('a write is judged per pipeline stage, so a later grep is not a body flag', () => {
  // Scanning the whole command made an ordinary read look like an approval: a GET piped into
  // `grep -F` carries `-F`, and one piped into `grep -d skip` carries `-d`. Both were blocked — the
  // same false positive this hook was narrowed to avoid, arriving from the other end. A write is one
  // command doing one thing, so each stage carries its own endpoint and its own verb.
  const allowed = [
    'gh api repos/x/y/actions/runs/1/pending_deployments | grep -F approved',
    'curl -s https://api.github.com/repos/x/y/actions/runs/1/pending_deployments | grep -d skip approved',
    'gh api repos/x/y/actions/runs/1/pending_deployments | grep -f patterns.txt',
    'gh api repos/x/y/actions/runs/1/pending_deployments --jq \'.[].state\' | sort | uniq -c',
  ];

  allowed.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0, `a piped read was blocked: ${command}`);
  });

  // The split is quote-aware, or a JSON body containing a pipe would cut the stage in half and leave
  // the endpoint somewhere with no tool and no flag — an evasion rather than a nicety.
  const blocked = [
    'curl -d \'{"note":"a|b","state":"approved"}\' '
      + 'https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
    'echo body | curl -d @- https://api.github.com/repos/x/y/actions/runs/1/pending_deployments',
  ];

  blocked.forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `a staged write went through: ${command}`);
  });
});

test('curl short options are read case-sensitively, because the case is the meaning', () => {
  // `-d` is a body and `-D` is --dump-header; `-F` is a form and `-f` is --fail; `-T` uploads and `-t`
  // is --telnet-option. Matching the letters case-insensitively blocked three reads outright. curl
  // also accepts a body flag clustered with other short options and glued to its value, and neither
  // shape leaves a `state` anywhere in the command.
  const endpoint = 'https://api.github.com/repos/x/y/actions/runs/1/pending_deployments';

  [
    `curl -sT approve.json ${endpoint}`,
    `curl -Tapprove.json ${endpoint}`,
    `curl -sd @approve.json ${endpoint}`,
  ].forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `a clustered or glued body went through: ${command}`);
  });

  [
    `curl -f ${endpoint}`,
    `curl -D headers.txt ${endpoint}`,
    `curl -t BINARY ${endpoint}`,
  ].forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0,
      `a read-only curl flag was read as a body: ${command}. -d/-F/-T are bodies; -D/-f/-t are not.`);
  });
});

test('httpie is covered the way httpie is actually driven', () => {
  // It takes the method positionally rather than behind `-X`, reads STDIN as the body, and has an
  // `@file` body form — so every pattern written for curl misses it. The binary ships under three
  // names, and `https` is the one that cannot be matched on a word boundary: every `https://` URL
  // contains it, so command position is what separates the client from the scheme.
  const endpoint = 'https://api.github.com/repos/x/y/actions/runs/1/pending_deployments';

  [
    `http POST ${endpoint} state=approved`,
    `http POST ${endpoint} @approve.json`,
    `https POST ${endpoint} @approve.json`,
    `httpie POST ${endpoint} @approve.json`,
    `http ${endpoint} < approve.json`,
  ].forEach((command) => {
    assert.equal(runHook(bash(command)).status, 2, `an httpie write went through: ${command}`);
  });

  // The scheme in a URL is not the httpie binary, and curl does not read stdin without a body flag.
  [
    `curl -s ${endpoint}`,
    `curl -s ${endpoint} < /dev/null`,
  ].forEach((command) => {
    assert.equal(runHook(bash(command)).status, 0, `an https:// URL was read as an httpie call: ${command}`);
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
