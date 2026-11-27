---
name: handsontable-a11y-learn
description: Use when running the accessibility learning routine after a weekly accessibility audit, or when asked to sort a learn packet (`learn-packet.json`, `learn-packet.md`, `.github/scripts/a11y-learn.mjs`), record a strike against a rule of the accessibility skill, or decide whether a new audit finding means a rule was broken, no rule existed, or nothing could prevent it. Covers the commands the routine may run, how to sort each attributable group against the diffs of its candidate pull requests, when a rule becomes a check (the second strike), the files the routine may change, the guard, and what its draft pull request must say. Not for building accessible UI (use `handsontable-a11y`) and not for fixing a finding.
---

# The accessibility learning routine

After each weekly audit, find what the audit says about the code merged that week, and write it back into the accessibility skill. A script does the counting and the tying to pull requests. You only judge the groups it could not drop.

A run ends in exactly one of three results. Say which in your last message, in these words:

- **A draft pull request**, with its link.
- **Nothing attributable**, with the counts from the packet.
- **Refused**, with every reason.

Run it the same way whether a schedule or a person started you. Ask nothing. When a step cannot be done, the result is `refused` with the reason.

## Commands the routine needs

Read-only, any time:

- `git fetch origin develop gh-pages`, `git status`, `git log`, `git show`, `git diff`
- `gh pr view <n>`, `gh pr diff <n>`, `gh pr checks <n>`, `gh pr list`
- `node .github/scripts/a11y-learn.mjs` (writes only under the git-ignored `.claude/a11y-learn/`), with `--dry-run` or `--guard`
- `node --test scripts/__tests__/a11y-skill-rules.test.mjs tests/lib/__tests__/a11y-issues.test.mjs`

To deliver, once per run: `git switch -c`, `git add`, `git commit`, `git push -u origin <branch>`, `gh pr create --draft`.

Never run anything else that writes: no audit or `test-health.yml` dispatch, no screen reader run, no force-push, no merge, no reviewer request, no edit of a pull request that is not this run's.

## Steps

1. **Start clean.** `git fetch origin develop gh-pages`, then work on a checkout of `origin/develop` with no local change. In a shallow clone the range cannot be read: `git fetch --unshallow origin develop` first.
2. **One learning pull request at a time.** `gh pr list --state open --limit 200 --json number,headRefName` and look for a head branch that contains `_A11y-learning-`. If one is open, stop: `refused: pull request #<n> of an earlier audit is still open`.
3. **Build the packet.** `node .github/scripts/a11y-learn.mjs`. Read its first line.
   - `result: refused` (exit status 3): stop, and report each `refused:` line. Do not pass `--dry-run`, `--now` or `--max-age-hours` to get around it. A person may; a dry-run packet never becomes a pull request.
   - `result: nothing-attributable`: stop, and report the counts line.
   - `result: packet`: read `.claude/a11y-learn/learn-packet.md`, then sort.
4. **Sort every attributable group** (next section). The page escapes every value for Markdown (a path reads `\_file.scss`), so copy a path, a selector or a row key from `learn-packet.json`, where it is as written.
5. **Edit**, only what the sorting calls for, only in the files listed under "What you may change".
6. **Check.** Write the pull request body to `.claude/a11y-learn/body.md` (git-ignored: an untracked file anywhere else fails the guard). Run the two test files above, then `node .github/scripts/a11y-learn.mjs --guard --body .claude/a11y-learn/body.md`. Both must pass. Fix your change, never the guard or a test.
7. **Deliver** (last section). With no group sorted into a file change, there is no pull request: the result is `nothing attributable`, and you list the groups you set aside with the reasons.

## Sorting a group

The script already dropped what teaches nothing: findings on a page, check, scenario or step the previous audit had not measured (newly measured, or inherited when the same defect was open elsewhere), re-keyed selectors, what the catalog calls no defect, what awaits triage, and findings on code nobody changed. Never sort a dropped row, and never move a row between outcomes by hand.

For each attributable group, find the cause before you judge:

1. Read the group: the cluster, the elements, the class and its rule, the checks that enforce it, the strikes so far.
2. Read each candidate's change to the listed files: `git show <sha> -- <path>`, with the path as the JSON has it. Read `gh pr view <n>` for what its author said, for example that a finding was baselined on purpose. With the `shared` tie, every candidate changed code all pages share: read until one explains the finding.
3. Name the line that causes the finding. If no candidate's diff explains it, do not guess: the group is **not sorted**, with that reason.

Then sort it into one outcome:

| Outcome | It is this when | What you write |
|---|---|---|
| **A rule existed and was broken** | The class has a rule, and the diff does what the rule forbids. An exception the author wrote down is still a strike. | A strike on the class in `rules.json`: `{ "cluster": "<id>", "audit": "<date of the audit, YYYY-MM-DD>", "pullRequest": <number> }`, one per cluster and pull request. Raise the strike count in the class's row of `references/classes.md`. |
| **No rule existed** | The group has no class, or the class's rule does not cover what the diff did. | One line: a build rule in `SKILL.md`, or a trap in `references/patterns.md` when one surface owns it. Say what to do and why, with no count, date, task id or pull request number. A new class needs its row in `rules.json` and `references/classes.md`, and `defectClass` on the cluster. |
| **Not preventable** | No rule an author could follow would have stopped it: a screen reader's own behavior, a limit of the tool, a false positive. | `{ "cluster": "<id>", "reason": "<why>" }` in `notPreventable` of `rules.json`. For a false positive also set `notDefect` on the cluster in `tests/a11y/issues.json`, unless the cluster has a tracker: the catalog refuses both, and the tracker is not yours to remove. |

Two findings are no lesson. Leave them **not sorted**, with the reason, and change no file for them:

- **An old defect in a new place.** The group says the same finding was already open on other pages, and the diff only adds one more instance of a pattern that is wrong everywhere (a link in the docs prose, in the site's link color). It is a strike only when the diff adds the cause itself: the attribute, the color, the handler.
- **The measurement changed.** The group lists a fixture, a spec, a scenario or a golden that changed in the range, and that change explains the row.

A group can hold findings that **came back**: resolved in an earlier audit and seen again in this one. When a candidate's diff brings the defect back, sort the group like any other: a fix undone is a rule broken. When the group says the finding had come back before and no diff explains it, it is a reading that comes and goes: **not sorted**, with that reason.

A group the packet marks as already recorded as not preventable needs nothing.

Change or add at most five rules in one pull request. With more, keep the five groups with the most findings and list the rest as left for a person.

## When a rule becomes a check

A class whose strikes name two distinct pull requests, or two audits, is at its **second strike**: the rule failed as prose twice, so it needs a check. The packet shows each class's strikes before this run, and `--guard` prints `second strike: <class>` for a class that reached it in your change.

For each such class, add a section "Rules that need a check" to the pull request body with: the class id and its rule, both strikes (cluster, audit date, pull request number), the check to build or extend, and where it must run. Start from the class's `enforcedBy`: a check that runs `weekly` and would have seen the finding needs to run on the pull request; one that already runs on the `pull-request` and let it through needs the case it misses; `none` needs a new check. The guard fails a body that does not name the class.

Do not build the check and do not shorten the rule: both are outside what you may change. The rule's prose shrinks to a pointer in the change that lands the check, so a rule is never left with neither.

## What you may change

- Anything under `.claude/skills/handsontable-a11y/`: `SKILL.md`, `references/*.md`, `rules.json`.
- In `tests/a11y/issues.json`: the `defectClass` and `notDefect` fields of clusters that exist. No other field, no new cluster, no reorder.

Nothing else: no product code, no test, no baseline or golden, no workflow, no `AGENTS.md`, not this skill and not the script. `rules.json` is edited in place: never deleted, always valid JSON, with its `budget` as it was. The guard reads the whole change against `origin/develop`, untracked files included, and fails on anything outside this list. The skill's own test keeps `SKILL.md` inside its line and rule budget: when a new line does not fit, shorten or merge an existing one, never raise the budget.

## The pull request

- **Branch:** `feature/<TASK-ID>_A11y-learning-<audit date>`, from `origin/develop`. The audit date is the latest audit's in the packet (`YYYY-MM-DD`). The task id is the one the run was given. With none, stop: `refused: no task id for the branch`.
- **One task id, everywhere.** The title, the body, every commit message and every comment name that id and no other. The ClickUp integration attaches every id it finds, for good. Name a pull request by its number, a cluster by its id, and another task in words. The packet carries no task id on purpose; `tests/a11y/issues.json` does (`tracker`), so never copy from it. The guard checks the commits and the body.
- **Title:** `<TASK-ID>: Learn from the accessibility audit of <audit date>`.
- **Body:** fill `.github/PULL_REQUEST_TEMPLATE.md` as it is on the branch. Follow the `pr-creation` skill for the template's own rules. Under Context, in this order:
  1. The audits compared: per source, the two dates and run ids, and the commit range.
  2. Where the new findings went: the counts of the packet (new, inherited, newly measured, set aside, attributable).
  3. One line per sorted group: the outcome, the pull request that shipped it, the file and line that cause it, and what you changed.
  4. "Rules that need a check", when a class reached its second strike.
  5. "Not sorted": each group you left, with its reason.
- Under Commands run, paste the last lines of the two test files and of the guard.
- **Draft, always.** `gh pr create --draft --body-file .claude/a11y-learn/body.md`. Request no reviewer, start no review of it, and never merge it: a person reads every rule before it reaches the skill.
- Commit with the author the run was given. Push once, with no force.
