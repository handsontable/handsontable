/**
 * The guard on baseline growth: what a pull request adds to `tests/a11y/axe-baseline.json`, judged.
 *
 * The axe scan compares a run with the pull request's own baseline, so a pull request that adds its own
 * finding to the baseline reads clean. This guard compares the pull request's baseline with the base
 * commit's (`baselineGrowth()`) and sorts every entry it adds, and every count it raises, into one of three
 * kinds:
 *
 * - **inherited**: the entry's page is new in this pull request, and the base baseline has the same finding
 *   (the same issue, rule, element and theme) on another page. A new page shows what every grid has.
 * - **an approved exception**: the entry's issue names the task that owns the fix (`tracker`), and the pull
 *   request carries the `a11y-exception-approved` label, added by a person, which covers the entry: the
 *   baseline at the head the pull request had when the label went on holds the entry with at least as many
 *   nodes. An entry added or a count raised after the label went on is not covered.
 * - **own**: anything else. The `A11y / axe report` check run is red.
 *
 * An agent never adds the label: it records a person's decision, and an agent pushing with that person's
 * token would read as that person (`tests/AGENTS.md`, "Baselining a finding, and fixing one").
 *
 * `judgeGrowth()` and `guardOf()` are pure. `baselineGuard()` reads what they need through the REST API with
 * an injected client, as `readBaseBaseline()` does, so the check run and the pull request comment judge the
 * same way. Never import from `tests/a11y/` here: the verdict jobs check out `tests/lib` alone.
 */
import { entryKey } from './a11y-baseline.mjs';
import { baseCommit, baselineGrowth, readBaseBaseline } from './a11y-pr-comment.mjs';

export const EXCEPTION_LABEL = 'a11y-exception-approved';
export const PAGES_FILE = 'tests/a11y/pages.mjs';
export const KINDS = ['own', 'exception', 'inherited'];

/**
 * The comma-separated logins of `A11Y_EXCEPTION_APPROVERS`, trimmed and lowercased; empty when the variable is
 * unset, which lets anyone who can label the pull request approve.
 *
 * @param {string|undefined} value The variable.
 * @returns {string[]} The logins.
 */
export function approverList(value) {
  return String(value ?? '').split(',').map(login => login.trim().toLowerCase()).filter(Boolean);
}

/**
 * Sorts what the pull request adds to the baseline into inherited entries, approved exceptions and its own
 * findings.
 *
 * @param {object} input The input.
 * @param {{added: object[], raised: object[]}} input.growth What `baselineGrowth()` returned.
 * @param {object} input.base The base commit's baseline, parsed.
 * @param {object} input.head The pull request's baseline, parsed.
 * @param {Set<string>} input.basePages The page ids of the base commit's `tests/a11y/pages.mjs`.
 * @param {object|null} input.approval The label's approval: `{by, at, entries}` where `entries` maps an entry key to
 * the entry at the approved head; `{by, at, problem}` when the label is there and covers nothing; `null` without it.
 * @returns {object[]} Each added or raised entry with its `change` (`added`, `raised`), `kind` and `reason`, own first.
 */
export function judgeGrowth({ growth, base, head, basePages, approval }) {
  const baseIssues = new Set((base.issues ?? []).map(issue => issue.id));
  const headIssues = new Map((head.issues ?? []).map(issue => [issue.id, issue]));
  const elsewhere = new Set((base.entries ?? []).map(item => sameFinding(item)));
  const judged = [
    ...growth.added.map(item => ({ ...item, change: 'added' })),
    ...growth.raised.map(item => ({ ...item, change: 'raised' })),
  ].map((item) => {
    const inherited = inheritance(item, { basePages, baseIssues, elsewhere });

    if (inherited.ok) {
      return { ...item, kind: 'inherited', reason: inherited.reason };
    }

    const exception = exceptionOf(item, { approval, issue: headIssues.get(item.issue) });

    return exception.ok
      ? { ...item, kind: 'exception', reason: exception.reason, tracker: headIssues.get(item.issue)?.tracker }
      : { ...item, kind: 'own', reason: `${inherited.reason}, and ${exception.reason}` };
  });

  return judged.sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || entryKey(a).localeCompare(entryKey(b)));
}

/**
 * The key a finding shares with the same finding on another page.
 *
 * @param {object} item The entry.
 * @returns {string} The key.
 */
function sameFinding(item) {
  return [item.issue, item.rule, item.target, item.theme].join('|');
}

/**
 * Whether an entry is inherited, and why or why not.
 *
 * @param {object} item The judged entry.
 * @param {object} known What the base has.
 * @param {Set<string>} known.basePages The base's page ids.
 * @param {Set<string>} known.baseIssues The base's issue ids.
 * @param {Set<string>} known.elsewhere The base's findings, by `sameFinding()`.
 * @returns {{ok: boolean, reason: string}} The answer.
 */
function inheritance(item, { basePages, baseIssues, elsewhere }) {
  if (item.change === 'raised') {
    return { ok: false, reason: `it raises the count on "${item.page}", a page the base branch already scans` };
  }
  if (basePages.has(item.page)) {
    return { ok: false, reason: `the base branch already scans "${item.page}"` };
  }
  if (!baseIssues.has(item.issue)) {
    return { ok: false, reason: `"${item.page}" is new, but the base baseline has no issue "${item.issue}"` };
  }
  if (!elsewhere.has(sameFinding(item))) {
    return { ok: false, reason: `"${item.page}" is new, but the base baseline has no ${item.rule} on ${item.target} in ${item.theme} under "${item.issue}"` };
  }

  return { ok: true, reason: `"${item.page}" is new, and the base baseline has ${item.rule} on ${item.target} in ${item.theme} under "${item.issue}" on another page` };
}

/**
 * Whether an entry is an approved exception, and why or why not.
 *
 * @param {object} item The judged entry.
 * @param {object} context What decides it.
 * @param {object|null} context.approval The label's approval (`judgeGrowth()`).
 * @param {object} [context.issue] The entry's issue in the pull request's baseline.
 * @returns {{ok: boolean, reason: string}} The answer.
 */
function exceptionOf(item, { approval, issue }) {
  if (!issue?.tracker) {
    return { ok: false, reason: `its issue "${item.issue}" names no tracker, so no task owns the fix (an exception needs one)` };
  }
  if (!approval) {
    return { ok: false, reason: `the pull request has no ${EXCEPTION_LABEL} label` };
  }
  if (approval.problem) {
    return { ok: false, reason: `the ${EXCEPTION_LABEL} label covers nothing: ${approval.problem}` };
  }

  const approved = approval.entries.get(entryKey(item));

  if (!approved) {
    return { ok: false, reason: `the entry was not in the baseline when the ${EXCEPTION_LABEL} label went on (${approval.at}), so the label does not cover it` };
  }
  if (approved.nodes < item.nodes) {
    return { ok: false, reason: `the ${EXCEPTION_LABEL} label covers ${approved.nodes} nodes, and the entry now has ${item.nodes}` };
  }

  return { ok: true, reason: `approved by ${approval.by} with the ${EXCEPTION_LABEL} label on ${approval.at}` };
}

/**
 * The guard from the files it reads: the base commit's baseline and page list, and the label's approval.
 *
 * @param {object} input The input.
 * @param {{text?: string, error?: string}} input.base The base commit's baseline file (`readBaseBaseline()`).
 * @param {{text?: string, error?: string}} [input.basePages] The base commit's `tests/a11y/pages.mjs`; read only when
 * the baseline grew.
 * @param {object|null} [input.head] The pull request's baseline, parsed.
 * @param {(source: string) => Iterable<string>} input.pageIds The page ids of a page list's text (`pageLines()` keys).
 * @param {object|null} [input.label] The label as the pull request carries it: `{by, at}`, plus `approvedText` (the
 * baseline at the head when it went on) or `problem` (why that head is unknown); `null` without the label.
 * @param {string[]} [input.approvers] Who may approve (`approverList()`); empty lets anyone who can label approve.
 * @returns {object} `{label, growth, judged, approval}`, or `{error}` when the growth cannot be judged.
 */
export function guardOf({ base, basePages, head, pageIds, label = null, approvers = [] }) {
  const growth = baselineGrowth(base, head);

  if (growth.error) {
    return { error: growth.error };
  }
  if (growth.added.length + growth.raised.length === 0) {
    return { label: EXCEPTION_LABEL, growth, judged: [], approval: null };
  }
  if (!basePages || basePages.error) {
    return { error: basePages?.error ?? `the base commit's ${PAGES_FILE} was not read` };
  }

  const approval = approvalOf(label, approvers);
  const judged = judgeGrowth({
    growth,
    base: JSON.parse(base.text),
    head,
    basePages: new Set(pageIds(basePages.text)),
    approval,
  });

  return { label: EXCEPTION_LABEL, growth, judged, approval };
}

/**
 * The approval the label gives: the entries it covers, or why it covers none.
 *
 * @param {object|null} label The label (`guardOf()`).
 * @param {string[]} approvers Who may approve.
 * @returns {object|null} The approval (`judgeGrowth()`).
 */
function approvalOf(label, approvers) {
  if (!label) {
    return null;
  }

  const { by, at } = label;

  if (approvers.length > 0 && !approvers.includes(String(by).toLowerCase())) {
    return { by, at, problem: `${by} added it, and only ${approvers.join(', ')} may approve an exception (A11Y_EXCEPTION_APPROVERS)` };
  }
  if (label.problem) {
    return { by, at, problem: label.problem };
  }

  let document;

  try {
    document = JSON.parse(label.approvedText);
  } catch (error) {
    return { by, at, problem: `the baseline at the head it approved is not valid JSON (${error.message})` };
  }

  const entries = new Map((Array.isArray(document?.entries) ? document.entries : []).map(item => [entryKey(item), item]));

  return { by, at, entries };
}

/**
 * The pull request's `a11y-exception-approved` label as its events tell it: who added it last and when, or `null`
 * when it is not on the pull request (never added, or removed after the last time it was added).
 *
 * The latest event wins by its time, then its id, never by where it sits in the listing: GitHub does not document
 * the order of a pull request's events (they come oldest first today), and a label added and later removed must
 * read as absent whichever way the pages run.
 *
 * @param {object} input The request.
 * @param {Function} input.request The REST client, as `readBaseBaseline()` takes it.
 * @param {string} input.repoApi The repository's API URL.
 * @param {string|number} input.prNumber The pull request.
 * @returns {Promise<{by: string, at: string}|null>} The label.
 */
export async function readLabel({ request, repoApi, prNumber }) {
  let last = null;

  for (let page = 1; ; page += 1) {
    const events = await request(`${repoApi}/issues/${prNumber}/events?per_page=100&page=${page}`);

    for (const event of events) {
      if ((event.event === 'labeled' || event.event === 'unlabeled') && event.label?.name === EXCEPTION_LABEL && isLater(event, last)) {
        last = event;
      }
    }
    if (events.length < 100) {
      break;
    }
  }

  return last?.event === 'labeled' ? { by: last.actor?.login ?? 'someone', at: last.created_at } : null;
}

/**
 * Whether an event happened after another: by its time, and by its id within one second, since the API gives
 * times to the second and ids grow with each event.
 *
 * @param {{created_at: string, id: number}} event The event.
 * @param {{created_at: string, id: number}|null} other The latest event so far.
 * @returns {boolean} `true` when `event` is the later one, or `other` is `null`.
 */
function isLater(event, other) {
  if (!other) {
    return true;
  }

  const delta = Date.parse(event.created_at) - Date.parse(other.created_at);

  return Number.isFinite(delta) && delta !== 0 ? delta > 0 : Number(event.id) > Number(other.id);
}

/**
 * The head the pull request had when the label went on: the head commit of the latest pull request run of this
 * repository's branch created before then. A run is created when a push reaches the pull request, so this is the
 * last push before the label, not a commit date an author can set.
 *
 * @param {object} input The request.
 * @param {Function} input.request The REST client.
 * @param {string} input.repoApi The repository's API URL.
 * @param {string} input.repository The repository, `owner/name`.
 * @param {string} input.headRef The pull request's branch.
 * @param {string} input.at When the label went on, ISO 8601.
 * @returns {Promise<string|null>} The commit, or `null` when no run was created before the label.
 */
export async function headAt({ request, repoApi, repository, headRef, at }) {
  const query = `branch=${encodeURIComponent(headRef)}&event=pull_request&created=${encodeURIComponent(`<=${at}`)}&per_page=50`;
  const { workflow_runs: runs = [] } = await request(`${repoApi}/actions/runs?${query}`);
  const latest = runs
    .filter(run => run.head_repository?.full_name === repository && Date.parse(run.created_at) <= Date.parse(at))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

  return latest?.head_sha ?? null;
}

/**
 * Reads what the guard needs and judges the growth: the base commit (`baseCommit()`), its baseline, and, only when
 * the pull request grows the baseline, its page list, the label and the baseline at the head the label approved.
 *
 * @param {object} input The request.
 * @param {Function} input.request The REST client.
 * @param {string} input.repoApi The repository's API URL.
 * @param {string} input.repository The repository, `owner/name`.
 * @param {string|number} input.prNumber The pull request.
 * @param {string} [input.checkedOut] The commit the job checked out (`A11Y_CHECKOUT_SHA`).
 * @param {string} [input.payloadBase] The event's base commit (`A11Y_BASE_SHA`).
 * @param {string} [input.headRef] The pull request's branch (`A11Y_HEAD_REF`).
 * @param {string[]} [input.approvers] Who may approve (`approverList()`).
 * @param {object|null} input.head The pull request's baseline, parsed.
 * @param {(source: string) => Iterable<string>} input.pageIds The page ids of a page list's text.
 * @returns {Promise<object>} What `guardOf()` returns.
 */
export async function baselineGuard({ request, repoApi, repository, prNumber, checkedOut, payloadBase, headRef, approvers = [], head, pageIds }) {
  const commit = await baseCommit({ request, repoApi, checkedOut, payloadBase });

  if (commit.error) {
    return { error: commit.error };
  }

  const base = await readBaseBaseline({ request, repoApi, sha: commit.sha });
  const growth = base.error ? null : baselineGrowth(base, head);

  if (!growth || growth.error || growth.added.length + growth.raised.length === 0) {
    return guardOf({ base, head, pageIds });
  }

  const basePages = await readBaseBaseline({ request, repoApi, sha: commit.sha, file: PAGES_FILE });
  let label = null;

  try {
    label = await readLabel({ request, repoApi, prNumber });
    if (label) {
      label = { ...label, ...(await approvedBaseline({ request, repoApi, repository, headRef, at: label.at })) };
    }
  } catch (error) {
    return { error: `reading the ${EXCEPTION_LABEL} label ${error.status ? `answered ${error.status}` : `failed (${error.message})`}` };
  }

  return guardOf({ base, basePages, head, pageIds, label, approvers });
}

/**
 * The baseline at the head the label approved, or why it is unknown.
 *
 * @param {object} input The request (`headAt()`).
 * @returns {Promise<{approvedText: string}|{problem: string}>} The file's text, or the problem.
 */
async function approvedBaseline({ request, repoApi, repository, headRef, at }) {
  if (!headRef) {
    return { problem: 'the pull request\'s branch was not given (A11Y_HEAD_REF), so the head it approved is unknown' };
  }

  const sha = await headAt({ request, repoApi, repository, headRef, at });

  if (!sha) {
    return { problem: `no run of this pull request was created before the label went on (${at}), so the head it approved is unknown` };
  }

  const file = await readBaseBaseline({ request, repoApi, sha });

  return file.error ? { problem: file.error } : { approvedText: file.text };
}

/**
 * How many judged entries are of each kind.
 *
 * @param {object[]} judged The judged entries.
 * @returns {{own: number, exception: number, inherited: number}} The counts.
 */
export function kindCounts(judged) {
  return Object.fromEntries(KINDS.map(kind => [kind, judged.filter(item => item.kind === kind).length]));
}

/**
 * The guard from saved files, for a dry run: `--base <file>` (the baseline at the merge base), `--base-pages <file>`
 * (`tests/a11y/pages.mjs` there) and `--approval <file>`, a JSON object standing in for the label: `{"by", "at",
 * "baseline"}`, where `baseline` is the baseline file at the head the label approved, or `{"by", "at", "problem"}`.
 *
 * @param {object} input The input.
 * @param {string} input.basePath The base baseline file.
 * @param {string} [input.basePagesPath] The base page list file.
 * @param {string} [input.approvalPath] The approval file.
 * @param {object|null} input.head The pull request's baseline, parsed.
 * @param {(source: string) => Iterable<string>} input.pageIds The page ids of a page list's text.
 * @param {string[]} [input.approvers] Who may approve.
 * @param {(file: string) => string} input.readText Reads a file; throws when it is missing.
 * @returns {object} What `guardOf()` returns.
 */
export function guardFromFiles({ basePath, basePagesPath, approvalPath, head, pageIds, approvers = [], readText }) {
  const file = (name) => {
    try {
      return { text: readText(name) };
    } catch (error) {
      return { error: `${name} could not be read (${error.message})` };
    }
  };
  const inputs = { base: file(basePath), basePages: basePagesPath ? file(basePagesPath) : undefined, head, pageIds, approvers };

  if (!approvalPath) {
    return guardOf(inputs);
  }

  const approval = approvalFile(file(approvalPath), approvalPath);

  if (approval.error) {
    // As in CI, where the label is read only when the baseline grew: an approval file that cannot be read is a
    // tooling failure only when there is growth for it to judge.
    const guard = guardOf(inputs);

    return guard.error || guard.judged.length === 0 ? guard : { error: approval.error };
  }

  const { by, at, baseline, problem } = approval;
  const approved = baseline ? file(baseline) : null;
  const label = { by, at, ...(problem ? { problem } : approved?.error ? { problem: approved.error } : { approvedText: approved?.text ?? '' }) };

  return guardOf({ ...inputs, label });
}

/**
 * The `--approval` file's object, or why it cannot stand in for the label.
 *
 * @param {{text?: string, error?: string}} read The file, as `guardFromFiles()` reads it.
 * @param {string} name The file's name, for the message.
 * @returns {object} `{by, at, baseline?, problem?}`, or `{error}`.
 */
function approvalFile(read, name) {
  if (read.error) {
    return { error: read.error };
  }

  let approval;

  try {
    approval = JSON.parse(read.text);
  } catch (error) {
    return { error: `${name} is not valid JSON (${error.message})` };
  }
  if (!approval || typeof approval !== 'object' || typeof approval.by !== 'string' || typeof approval.at !== 'string') {
    return { error: `${name} must be a JSON object with "by" and "at" strings, and "baseline" or "problem"` };
  }

  return approval;
}
