---
name: docs-bugproof-review
description: Use before opening or pushing any handsontable/handsontable docs PR (guide edits, code examples, changelog/API text) written by or with Claude for aleksandra.budnik@handsontable.com -- run this self-review after the content looks finished, before asking for human review.
---

# Docs bugproof review

## Why this exists

Built from a review of AMBudnik's actual PR history (24 PRs). Every item below is a
mistake a real reviewer (Artur or others) actually caught, not a hypothetical. The
pattern in all of them is the same: the content *looked* finished -- structurally
consistent, plausible-sounding, style-correct at a glance -- and was pushed without
independently verifying it against source code, against every framework variant, or
against the rest of the page. "Looks done" is not "is done."

## The rule

**Before pushing a docs PR (new push or update), run every check below against the
actual diff. Do not skip a check because the change "is small" or "is just docs" --
small snippets are exactly where these slipped through before.**

| # | Check | What it catches | Real incident |
|---|---|---|---|
| 1 | For every behavioral/prescriptive claim ("X fires when Y", "requires Z first", "returns A"), grep the actual source (`handsontable/src/**`) for the guard condition, JSDoc, or call site. Do not write a behavior claim from memory or pattern-matching against similar docs. | Wrong or incomplete behavior claims | #13588 (unregistered-dictionary silent no-op never mentioned), #13449 (fires-before-not-after, missing trigger paths), #13398 (false claim that scroll drives afterRender) |
| 2 | If the page/section covers JS + React + Angular + Vue (or any N-framework set), open **every** framework's file/snippet and check it independently demonstrates the claim -- never assume the other three match once the first one is right. | Framework parity gaps | #13588 (Angular/Vue snippets declared hooks but never triggered the switch), #13530 (only the `javascript/` example folder was rebuilt, 3 stayed stale), #13517 (instructional text described a button that only exists in the JS variant) |
| 3 | Trace the example's actual effect, don't just read it: does the code literally produce the result the prose describes? If a snippet is a "runnable" claim, run it (or the demo you built for it) instead of eyeballing it. | Example that reads plausibly but doesn't do what it claims | #13588 (Angular/Vue hooks that never fire), #13530 (a "function" example identical in behavior to the array example next to it), #13398 ("per-cell timing" code that never times anything) |
| 4 | Run the mechanical style pass: grep the diff for em dashes (site uses hyphens/`--`), British spellings, banned placeholder data (`foo`/`bar`/`A1`/`Column1`/etc.), and confirm `menuTag: new`/`updated` is set per `docs/CLAUDE.md` section 2.6 when the page changed substantively. | Style-rule violations caught by rote | #13517, #13449 (em dash), #13398 (missing `menuTag`) |
| 5 | When the fix touches a dataset, a claim repeated elsewhere, or a convention applied across files, grep the whole repo/page for every other place carrying the same content -- not just the file you opened. | Stale content left behind after a partial fix | #13530 (banned data left in 3 of 4 framework folders, stale comment referencing a removed option), #13517 (a second paragraph elsewhere on the same page still asserted the false claim this PR was fixing) |
| 6 | Before pushing, diff your branch against the target base (`develop` for `handsontable`, per `dec_0001`) and confirm the commit list contains only your own intended commits. | Scope bleed from a stale base or accidental merge | #13101 (PR carried commits from an already-merged unrelated PR) |

## Red flags -- if you catch yourself thinking this, stop and go back to the table

- "The other three frameworks probably follow the same pattern as this one." -- No. Open each one. (#13588, #13530)
- "This sentence sounds right, it matches how I've seen this documented elsewhere." -- Sounding right is not verified. Grep the source. (#13588, #13449, #13398)
- "I already fixed the file the ticket named." -- Check for siblings: other framework folders, other paragraphs on the same page, other pages making the same claim. (#13530, #13517)
- "It's just a small docs snippet, no need for the full checklist." -- Every incident this skill is built from was a small docs snippet.

## How to apply

1. Read the diff (`git diff` against the base branch) end to end.
2. Walk the table above, item by item, against that diff. For item 1 and 3, actually open the relevant source file or run/build the example -- don't rely on recall.
3. For item 2, list every framework variant the page covers and confirm you checked each one this pass, not just the one you edited first.
4. Only after all six pass, tell the user the PR is ready for human review -- and say plainly which items you actually verified (e.g. "checked JS+source for the dictionary-registration behavior; ran the demo for the hook-firing claim") rather than a bare "looks good."
