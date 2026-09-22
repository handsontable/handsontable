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
 * Three limits to know, because none is visible from the code and each means this is a guardrail
 * rather than a boundary. Claude Code reads `.claude/settings.json` when a session STARTS, and it
 * resolves `$CLAUDE_PROJECT_DIR` to the main checkout — so this hook first takes effect in sessions
 * opened after it reaches that checkout, and it fails open in a linked worktree whose branch carries
 * a copy the main checkout does not have yet (`.ai/WORKTREES.md`). It binds this agent, not the
 * credentials: anyone holding the same token can still call the endpoint from a plain terminal. And
 * it only knows the HTTP clients it names — a one-off `node`, `python` or `deno` script that calls
 * `fetch` reaches the endpoint with none of the flag patterns matching, which is the natural next
 * move once curl is refused. Only the two tool-agnostic patterns still cover that shape, and only
 * when the method or the decision is written in the command rather than read from a file. Widening
 * the tool list does not fix it, because such a script carries no recognizable flags at all.
 * The control that depends on none of the three is the reviewer list on the environment itself.
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
 * The verbs are grouped BY TOOL, because the same letters mean opposite things in different commands.
 * `-F` is a body field to curl and `--fixed-strings` to git grep; `--json` is a body to curl but an
 * OUTPUT SELECTOR to gh, so `gh pr view --json comments | grep pending_deployments` is a read; `-T`
 * uploads a file for curl and is not a gh write at all. A flag list that ignores which tool owns the
 * flag blocks ordinary reads about this gate — including the one that answers "is this run waiting on
 * a human?", which is the question the hook's own message tells a refused agent to go and ask.
 *
 * - EXPLICIT_METHOD — a mutating method in any spelling (`-X POST`, `--request PUT`,
 *   `--method PATCH`). Tool-agnostic: no read spells itself this way.
 * - DECISION — the decision itself, in either spelling: `state=approved` as a form field, or
 *   `"state": "approved"` as JSON. A JSON body carries the colon form, so matching only `=` reads an
 *   approval as innocent.
 * - GH_API_WRITE — `gh api` with a field or a body (`-f`, `-F`, `--field`, `--raw-field`, `--input`).
 *   Each of those makes gh infer POST, so the method never appears in the command. The `gh api`
 *   prefix is load-bearing: it is what separates a write from `gh pr view --json`.
 * - CURL_BODY — a curl body, which also implies POST with no `-X` in sight (`-d`, `--data*`,
 *   `--json`, `--form`, `-T`, `--upload-file`). This is the shape a blocked agent reaches for next,
 *   and it is what curl's own documentation shows. The value may be GLUED to the flag, and `@file` is
 *   the form that moves the JSON off the command line entirely — `curl -d@approve.json` carries no
 *   `state` anywhere, so the flag is the only thing left to match on.
 *
 * A plain `GET` of the same path lists what is waiting and changes nothing, so it stays allowed — it is
 * how an agent answers "is this run blocked on a human?", which is a question worth being able to ask.
 */
const CURL = /\bcurl\b/i;

const WGET = /\bwget\b/i;

// httpie is matched at COMMAND POSITION only. `\bhttps\b` matches inside every `https://` URL, so a
// word-boundary test would read an ordinary curl GET as an httpie call and block it.
const HTTPIE = /^\s*(?:https?|httpie)\s/i;

const EXPLICIT_METHOD = /(?:-X|--request|--method)\s*=?\s*(?:POST|PUT|PATCH)/i;

const DECISION = /\bstate\b\s*[=:]\s*["']?(?:approved|rejected)\b/i;

const GH_API_WRITE = /\bgh\s+api\b[\s\S]*?(?:^|\s)(?:-f|-F|--field|--raw-field|--input)(?:\s|=)/i;

// Short options are case-SENSITIVE, and the difference is the whole point: `-d` is a body and `-D` is
// --dump-header; `-F` is a form and `-f` is --fail; `-T` uploads and `-t` is --telnet-option. Matching
// them case-insensitively blocked `curl -f <endpoint>`, `curl -D headers.txt` and `curl -t` — three
// reads. Exactly `-d`, `-F` and `-T` are curl's body options, so the letter is looked for INSIDE the
// option token rather than as a token of its own: curl accepts them clustered (`-sT approve.json`)
// and glued to their value (`-Tapprove.json`), and both shapes carried no `state` on the command line.
// Scoped to curl because wget spells `-d` as --debug.
const CURL_SHORT_BODY = /(?:^|\s)-[A-Za-z]*[dFT]/;

const CURL_LONG_BODY = /(?:^|\s)--(?:data(?:-\w+)?|json|form|upload-file)(?:[\s=@'"{[]|$)/i;

// wget infers POST from its body exactly as curl does, and `CURL_TOOL` had always named wget while
// carrying only curl's flags, so `--post-file=approve.json` went through.
const WGET_BODY = /(?:^|\s)--(?:post|body)-(?:data|file)(?:[\s=@'"{[]|$)/i;

// httpie takes its method positionally rather than behind `-X`, reads STDIN as the body, and has a
// documented `@file` body form — none of which any of the patterns above would see.
const HTTPIE_WRITE = [
  /(?:^|\s)(?:POST|PUT|PATCH)(?:\s|$)/,
  /(?:^|\s)[^\s=<>|]*:?=?@\S/,
  /(?:^|\s)<\s*\S/,
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

/**
 * Splits a command into the pipeline stages a shell would run, without splitting inside quotes.
 *
 * The unit matters. Scanning the WHOLE command for a write flag makes an ordinary read look like an
 * approval: `gh api <endpoint> | grep -F approved` carries `-F`, and `curl -s <endpoint> | grep -d
 * skip` carries `-d`, so both were blocked — the exact false positive this hook was narrowed to avoid
 * two rounds ago, reintroduced from the other end. A write is one command doing one thing, so each
 * stage is judged on its own and has to carry the endpoint itself.
 *
 * Quotes are tracked because a naive split would cut inside a JSON body — `-d '{"a":"b|c"}'` — and
 * leave the endpoint in a stage with no tool and no flag, which is an evasion rather than a nicety.
 *
 * Two shapes are NOT separators, and both were bypasses before they were handled. A backslash at the
 * end of a line continues it, which is how anyone writes a curl long enough to need a body — the tool
 * lands on one line and the endpoint on another, and each fragment alone looks harmless. And an `&`
 * inside a redirection (`2>&1`, `&>/tmp/log`, `>&2`) is not the control operator it resembles; cutting
 * there splits an ordinary command in half. A real `&&` or a backgrounding `&` still separates.
 *
 * Joining continuations before the quote scan is deliberately approximate: a backslash-newline inside
 * single quotes is literal to bash and is joined here anyway. That errs toward treating two fragments
 * as one command, which can only make this stricter, never blinder.
 *
 * @param {string} bashCommand The raw Bash command.
 * @returns {string[]} The non-empty stages, in order.
 */
function shellStages(bashCommand) {
  const joined = bashCommand.replace(/\\\r?\n/g, ' ');
  const stages = [];
  let current = '';
  let quote = '';

  for (let index = 0; index < joined.length; index += 1) {
    const character = joined[index];

    if (quote) {
      current += character;

      if (character === quote) {
        quote = '';
      }

      continue; // eslint-disable-line no-continue
    }

    if (character === '\'' || character === '"') {
      quote = character;
      current += character;

      continue; // eslint-disable-line no-continue
    }

    // `2>&1` and `&>file` are redirections, not control operators.
    const redirection = character === '&' && (current.endsWith('>') || joined[index + 1] === '>');

    if (!redirection && (character === '|' || character === ';' || character === '&' || character === '\n')) {
      stages.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  stages.push(current);

  return stages.filter(stage => stage.trim() !== '');
}

/**
 * Judges one pipeline stage: does it reach the endpoint, and does it write?
 *
 * Shell quoting is not syntax to a regex. bash resolves `pending_dep''loyments` to the real endpoint
 * before any client sees it, and the same split works on a flag or a value, so every pattern is tested
 * against the stage with quotes and backslashes removed as well as against the stage as written.
 * Testing both forms rather than only the stripped one keeps the quoted patterns intact — the body
 * flags accept a quote as their trailing character, and stripping first would hide that.
 *
 * What this does NOT close: a command that builds the string at runtime — base64, command
 * substitution, a variable assembled earlier in the session. A regex over shell text cannot follow
 * that, and pretending otherwise would be worse than saying so.
 *
 * @param {string} stage One stage from {@link shellStages}.
 * @returns {boolean} True when this stage would approve or reject a deployment.
 */
function stageWrites(stage) {
  const forms = [stage, stage.replace(/['"\\]/g, '')];
  const hits = pattern => forms.some(form => pattern.test(form));

  if (!hits(PENDING_DEPLOYMENTS)) {
    return false;
  }

  return hits(EXPLICIT_METHOD)
    || hits(DECISION)
    || hits(GH_API_WRITE)
    || (hits(CURL) && (hits(CURL_SHORT_BODY) || hits(CURL_LONG_BODY)))
    || (hits(WGET) && hits(WGET_BODY))
    || (hits(HTTPIE) && HTTPIE_WRITE.some(hits));
}

if (!shellStages(command).some(stageWrites)) {
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
