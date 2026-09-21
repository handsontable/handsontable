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
 * Scope is deliberately narrow — the deployment-approval endpoint and nothing else. Reading a run,
 * listing approvals (`GET .../approvals`, which the fail-closed assertion in `manual-qa.yml` and
 * `visual.yml` uses) and every other `gh` call stay available; a hook that blocked more than the one
 * dangerous verb would be turned off, and a hook that is off protects nothing
 * (`.ai/LOCAL-ENFORCEMENT.md` §2).
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

if (!PENDING_DEPLOYMENTS.test(command)) {
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
