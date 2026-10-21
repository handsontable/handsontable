#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook (Bash). Refuses any command that reaches the deployment-approval
 * endpoint, so an agent can never clear a gate that exists to record a human decision.
 *
 * The gates this protects are `manual-qa`, `visual-approval`, `docs-visual-approval` and `approvers`
 * (`.ai/CI.md`). Each one holds a job until someone clicks **Review pending deployments** on the run
 * page, and GitHub records who clicked. "Prevent self-review" is deliberately OFF on all of them — a
 * maintainer approving their own run is accepted, because the recorded name is the accountability.
 *
 * That setting is what makes this hook necessary rather than redundant. GitHub authorizes the TOKEN,
 * not the person: an agent running with a maintainer's `gh` credentials is indistinguishable from the
 * maintainer at the API, so nothing on GitHub's side would stop `POST
 * /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments` from clearing a visual diff that
 * no human ever looked at. The approval would even be recorded under the maintainer's name, which is
 * worse than no approval: it reads as a human sign-off in the audit trail. The block belongs here,
 * where the caller is known to be an agent.
 *
 * ## Why this matches a path and not a verb
 *
 * The obvious design is to block a WRITE and allow a READ: match the endpoint, then look for `-X POST`,
 * a body flag, a `gh api` field. That design was built, reviewed five times, and failed five times —
 * each round a different piece of shell syntax rather than a missing flag. Clustered short options
 * (`-sT file`). A flag glued to its value (`-Tapprove.json`). wget's spelling of a body. httpie's
 * positional method. Quote-splitting the endpoint (`pending_dep''loyments`). A backslash continuing a
 * line, which is how anyone writes a curl long enough to need a body. `2>&1` and `<&-`, which are
 * redirections that look like control operators. Every fix closed one shape and the next review found
 * another, because deciding what a shell command DOES means parsing shell, and this is a regex.
 *
 * The failures all ran the same direction: a bypass, silent, on the one action the hook exists to stop.
 *
 * So the question changed. Not "is this a write?" — which needs a parser — but "does this command
 * reach the endpoint at all?", which needs only two facts, neither of which shell syntax can hide:
 *
 * 1. the endpoint appears in PATH form (`/pending_deployments`, with the leading slash);
 * 2. the command names an HTTP client.
 *
 * The leading slash does the work the verb analysis was for. A command that CALLS the endpoint carries
 * it as a path segment — `repos/o/r/actions/runs/123/pending_deployments` — while a command that
 * MENTIONS it carries the bare word: `grep -rn pending_deployments .ai/`, `rg pending_deployments`,
 * `git grep -F pending_deployments`. That distinction survives quoting, clustering, continuations and
 * redirections, because none of them can remove the slash from a path the API requires.
 *
 * ## What this gives up, on purpose
 *
 * A plain `GET` of the pending deployments is now refused along with the writes. The previous design
 * kept it, and trying to keep it is what cost the bypasses above. It buys little: `gh pr checks` and
 * `gh run view` both show a run waiting on a gate, both stay available, and both are what this repo's
 * own diagnosis has actually used. `GET .../approvals` — the call the fail-closed assertions in
 * `manual-qa.yml` and `visual.yml` make — is a different path and is untouched.
 *
 * One false positive is known and accepted: a command that names `gh`, `curl` or `wget` AND quotes the
 * endpoint's full route without calling it, such as piping `gh run view --log` into a grep for
 * `runs/1/pending_deployments`. Search the bare word instead and it passes. The message says so.
 *
 * ## Limits
 *
 * Reads the tool payload as JSON on stdin. Exit 2 blocks the call and returns the message to the
 * model; exit 0 lets it through. Anything unparseable exits 0 — a hook that fails closed on a
 * malformed payload would block every Bash command in the session.
 *
 * Four limits, none visible from the code, and together they are why this is a guardrail rather than a
 * boundary:
 *
 * 1. Claude Code reads `.claude/settings.json` when a session STARTS and resolves `$CLAUDE_PROJECT_DIR`
 *    to the main checkout, so this takes effect in sessions opened after it lands there, and it fails
 *    open in a linked worktree whose branch carries a copy the main checkout does not have yet
 *    (`.ai/WORKTREES.md`).
 * 2. It binds this agent, not the credentials: anyone holding the same token can call the endpoint from
 *    a plain terminal.
 * 3. It only sees Bash. A one-off `node`, `python` or `deno` script that calls `fetch` reaches the
 *    endpoint with no client named on the command line — the natural next move once curl is refused.
 * 4. It cannot follow a string built at runtime: base64, command substitution, a variable assembled
 *    earlier in the session. No regex over shell text can.
 *
 * The control that depends on none of the four is the reviewer list on the environment itself, and —
 * for 2 and 3 — not giving an agent session a token that carries environment-write in the first place.
 */
import { readFileSync } from 'node:fs';

/**
 * The approval endpoint, in the PATH form a call to it must take.
 *
 * The leading slash is the discriminator, not decoration: the REST route is
 * `/repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments`, so anything that reaches it — a
 * full URL, a `gh api` path, a URL assembled from parts — carries the segment with its slash. A
 * command that merely talks about the gate carries the bare word, which is what every grep, `rg` and
 * `git grep` over the docs uses. `gh run` has no subcommand for this today; if one appears, add it.
 */
const APPROVAL_ENDPOINT = /\/pending_deployments\b/i;

/**
 * The HTTP clients that can reach it from a shell.
 *
 * Paired with {@link APPROVAL_ENDPOINT} rather than used alone, which is what keeps an innocent
 * mention of the full route out of the block — a heredoc writing a document that quotes it, for
 * instance. Matching `https?` inside a URL is harmless here for the same reason: the only command
 * carrying both an `https://` and the endpoint path is one calling it. Limit 3 above is the gap this
 * leaves, and it is named there rather than papered over by adding `node` to a list it would not help.
 */
const HTTP_CLIENT = /\b(?:curl|wget|https?|httpie|gh)\b/i;

/**
 * Read all of stdin synchronously.
 *
 * @returns {string} Raw stdin contents (empty string if none).
 */
function readStdin() {
  try {
    // Read fd 0 directly — cross-platform (a `cat` spawn ENOENTs on Windows).
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let payload = {};

try {
  payload = JSON.parse(readStdin());
} catch { /* no/!json stdin — nothing to judge */ }

if (payload?.tool_name !== 'Bash') {
  process.exit(0);
}

const command = payload?.tool_input?.command ?? '';

// Shell quoting is not syntax to a regex: bash resolves `pending_dep''loyments` to the real path before
// any client sees it. Testing the unquoted form as well closes that, and it is the only shell behaviour
// this needs to know about now — the rest were load-bearing only while the matcher tried to tell a
// write from a read.
const forms = [command, command.replace(/['"\\]/g, '')];
const reaches = pattern => forms.some(form => pattern.test(form));

if (!reaches(APPROVAL_ENDPOINT) || !reaches(HTTP_CLIENT)) {
  process.exit(0);
}

process.stderr.write(
  'Blocked: this command reaches the pending-deployment approval endpoint, and an agent must never '
  + 'approve or reject one — not even on a pull request it opened itself.\n\n'
  + 'The manual-qa, visual-approval, docs-visual-approval and approvers gates exist to record that a '
  + 'PERSON looked. "Prevent self-review" is off on all of them, so the author may approve their own '
  + 'run; what may not happen is an agent clearing the gate with the author\'s token, because GitHub '
  + 'would record that as the author\'s own sign-off.\n\n'
  + 'Ask the human to click "Review pending deployments" on the run page.\n\n'
  + 'To SEE whether a run is waiting, use `gh pr checks <number>` or `gh run view <run-id>` — both are '
  + 'unaffected, and so is `GET .../approvals`, which is a different path. Reads of this endpoint are '
  + 'refused along with writes: telling them apart needs a shell parser, and every attempt to do it '
  + 'with patterns left a silent way through (see the docblock).\n\n'
  + 'If you are only grepping for the string, search the bare word `pending_deployments` rather than '
  + 'the full route — that is not blocked.\n'
);

process.exit(2);
