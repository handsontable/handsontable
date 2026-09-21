#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook (Bash). Refuses any command that would approve or reject a pending
 * environment deployment, so an agent can never clear a gate that exists to record a human decision.
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
 * Scope is deliberately narrow — writes to the deployment-approval endpoint and nothing else. Reading a
 * run, listing approvals (`GET .../approvals`, which the fail-closed assertion in `manual-qa.yml` and
 * `visual.yml` uses), a plain `GET` of the pending deployments themselves, and every grep or `cat` over
 * the files that describe this gate all stay available. That is not politeness: a hook that
 * false-positives gets turned off, and a hook that is off protects nothing
 * (`.ai/LOCAL-ENFORCEMENT.md` §2), so it must match the dangerous verb rather than the path string.
 *
 * Reads the tool payload as JSON on stdin. Exit 2 blocks the call and returns the message to the
 * model; exit 0 lets it through. Anything unparseable exits 0 — a hook that fails closed on a
 * malformed payload would block every Bash command in the session.
 *
 * Two limits to know, because neither is visible from the code and both mean this is a guardrail
 * rather than a boundary. Claude Code reads `.claude/settings.json` when a session STARTS, and it
 * resolves `$CLAUDE_PROJECT_DIR` to the main checkout — so this hook first takes effect in sessions
 * opened after it reaches that checkout, and it fails open in a linked worktree whose branch carries
 * a copy the main checkout does not have yet (`.ai/WORKTREES.md`). And it binds this agent, not the
 * credentials: anyone holding the same token can still call the endpoint from a plain terminal. The
 * control that does not depend on either is the reviewer list on the environment itself.
 */
import { readFileSync } from 'node:fs';

/**
 * The REST path that approves or rejects a waiting deployment. `gh api`, `curl` and any wrapper that
 * builds the URL from parts all contain this segment, so one pattern covers the shapes an agent would
 * actually reach for. `gh run` has no subcommand for this today; if one appears, add it here.
 */
const PENDING_DEPLOYMENTS = /pending_deployments/i;

/**
 * What makes a command an APPROVAL rather than a mention of one.
 *
 * The endpoint segment alone is not enough, and matching on it alone is how this hook would end up
 * switched off: `grep -rn pending_deployments .ai/`, `rg pending_deployments`, `cat`ting this file,
 * or reading the docs that describe the gate all contain the string and all are innocent. A hook that
 * false-positives gets disabled, and a disabled hook protects nothing (`.ai/LOCAL-ENFORCEMENT.md` §2),
 * so the pattern has to name the dangerous verb.
 *
 * Every entry is a way to turn that endpoint into a write:
 * - an explicit mutating method, in curl's spelling or gh's (`-X POST`, `--method POST`, `--request PUT`);
 * - `gh api` with a field or a body — `-f`, `-F`, `--field`, `--raw-field`, `--input` all make gh infer
 *   POST, so the method never appears in the command;
 * - a curl BODY, which also implies POST with no `-X` in sight: `-d`, `--data*`, `--json`, `--form`,
 *   `-T`. This is the shape the first version of the narrowed check missed, and it is the one a blocked
 *   agent would reach for next — it is what curl's own documentation shows;
 * - the decision itself, in either spelling: `state=approved` as a form field, or `"state": "approved"`
 *   as JSON. A JSON body carries the colon form, so matching only `=` reads an approval as innocent.
 *
 * A plain `GET` of the same path lists what is waiting and changes nothing, so it stays allowed — it is
 * how an agent answers "is this run blocked on a human?", which is a question worth being able to ask.
 */
const REQUEST_TOOL = /\b(?:curl|wget|http|gh)\b/i;

const APPROVAL_VERB = [
  /(?:-X|--request|--method)\s*=?\s*(?:POST|PUT|PATCH)/i,
  /\bgh\s+api\b[\s\S]*?(?:^|\s)(?:-f|-F|--field|--raw-field|--input)(?:\s|=)/i,
  /(?:^|\s)(?:-d|-F|-T|--data|--data-raw|--data-binary|--data-urlencode|--data-ascii|--json|--form)(?:\s|=)/i,
  /(?:^|\s)--upload-file(?:\s|=)/i,
  /\bstate\b\s*[=:]\s*["']?(?:approved|rejected)\b/i,
];

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

// Three conditions, and the request tool is what keeps the flag patterns honest. Several of the
// mutation flags are ordinary flags of ordinary tools — `git grep -F` is fixed-strings, `grep -d` is
// --directories — so matching a flag alone would block a search over the files that describe this gate.
// A command that names no HTTP client is not reaching the endpoint whatever its flags say.
if (!PENDING_DEPLOYMENTS.test(command)
  || !REQUEST_TOOL.test(command)
  || !APPROVAL_VERB.some(verb => verb.test(command))) {
  process.exit(0);
}

process.stderr.write(
  'Blocked: this command would approve or reject a pending environment deployment, and an agent must '
  + 'never do that — not even on a pull request it opened itself.\n\n'
  + 'The manual-qa, visual-approval, docs-visual-approval and approvers gates exist to record that a '
  + 'PERSON looked. "Prevent self-review" is off on all of them, so the author may approve their own '
  + 'run; what may not happen is an agent clearing the gate with the author\'s token, because GitHub '
  + 'would record that as the author\'s own sign-off.\n\n'
  + 'Ask the human to click "Review pending deployments" on the run page instead. Reading the run and '
  + 'listing its approvals (GET .../approvals) are not blocked.\n'
);

process.exit(2);
