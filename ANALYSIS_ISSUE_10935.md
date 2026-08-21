# Analysis: issue #10935 — `=ROUND(21.9/0.2, 0)` returns 109, not 110

Date: 2026-08-21
Issue: https://github.com/handsontable/handsontable/issues/10935

## Verdict

- **Reproducible: yes.**
- **Where the bug lives: HyperFormula.** Not Handsontable.
- Still present in **HyperFormula 3.4.0** (the newest release) and in **3.3.0** (the version pinned in this repo).

## How to reproduce

No Handsontable needed. Plain HyperFormula:

```js
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildFromArray([
  ['=21.9/0.2', '=ROUND(A1,0)', '=ROUND(21.9/0.2,0)', '=A1=109.5'],
], { licenseKey: 'gpl-v3' });

console.log(hf.getSheetValues(0)[0]);
// [109.5, 109, 109, true]
```

Repro script: `repro-issue-10935.mjs` (in this branch).

## What happens, step by step

1. `21.9 / 0.2` in JavaScript is **not** exactly `109.5`. It is `109.49999999999998579`.
   This is normal IEEE-754 double behavior, not a HyperFormula defect on its own.
2. HyperFormula stores that raw value, `109.49999999999999`, in the cell.
3. When you **read the cell out**, HyperFormula applies "smart rounding". The cell
   **displays 109.5**.
4. When you **compare** with `=`, HyperFormula uses an epsilon. So `=A1=109.5` is **TRUE**.
5. When you pass the cell to **ROUND**, neither of those happens. `ROUND` gets the raw
   `109.49999999999999` and runs a plain `Math.round` on it. `Math.round(109.49999999999999)`
   is `109`.

So the engine gives two different answers about the same value:

| What you ask | Answer |
|---|---|
| Show me A1 | `109.5` |
| Is A1 equal to 109.5? | `TRUE` |
| Round A1 to 0 places | `109` |

That inconsistency is the bug. A user is told the value is 109.5, then sees 109.5 round down.

## Root cause in the code

Smart rounding is applied in only two places in HyperFormula:

1. `es/Exporter.mjs:68` — `exportValue()`. This is the **read-out** path only.
   ```js
   } else if (this.config.smartRounding && isExtendedNumber(value)) {
     return this.cellValueRounding(getRawValue(value));
   }
   ```
2. `es/interpreter/ArithmeticHelper.mjs:167` — `actualEps`, used for **comparisons** only.
   ```js
   this.actualEps = config.smartRounding ? config.precisionEpsilon : 0;
   ```

Nothing rounds the value that flows *between* operations, or the value handed to a function
argument. `ROUND` itself (`es/interpreter/plugin/RoundingPlugin.mjs:38`) is a bare `Math.round`:

```js
round(ast, state) {
  return this.runFunction(ast.args, state, this.metadata('ROUND'), (numberToRound, places) => {
    const placesMultiplier = Math.pow(10, places);
    if (numberToRound < 0) {
      return -Math.round(-numberToRound * placesMultiplier) / placesMultiplier;
    } else {
      return Math.round(numberToRound * placesMultiplier) / placesMultiplier;
    }
  });
}
```

## Why this is Handsontable's problem to route, not to fix

`handsontable/src/plugins/formulas/engine/settings.ts` only passes rounding config through
as defaults (`precisionEpsilon: 1e-13`, `precisionRounding: 14`, `smartRounding: true`).
Handsontable has no rounding logic of its own. Confirmed by grepping `handsontable/src/` —
the only hits are that settings file and its test.

## Correction to the existing comment on the issue

The maintainer reply on the issue says:

> We determined that the `precisionRounding` limitation causes this issue, and while setting
> it to, for example, `15` should solve it, the hardcoded limit is actually `14`.

**That is not correct.** `precisionRounding` cannot fix this at any value, because it never
touches the number `ROUND` receives. A full sweep on `=ROUND(21.9/0.2,0)`:

| `precisionRounding` | `=ROUND(21.9/0.2,0)` | `=21.9/0.2` (displayed) |
|---|---|---|
| 10 | 109 | 109.5 |
| 12 | 109 | 109.5 |
| 13 | 109 | 109.5 |
| 14 (default) | 109 | 109.5 |
| 15 | 109 | 109.5 |
| 16 | 109 | 109.49999999999999 |
| 17 | 109 | 109.49999999999999 |

`precisionRounding` only changes what the **display** shows. `ROUND` stays 109 everywhere.
Also note there is no hard limit at 14 — values of 15, 16 and 17 are all accepted.

## Which functions are affected

Anything that reads the raw value and makes a decision at the .5 boundary:

| Formula | Result | Correct? |
|---|---|---|
| `=ROUND(A1,0)` | 109 | wrong (109.5 should round to 110) |
| `=MROUND(A1,1)` | 109 | wrong |
| `=INT(A1)` | 109 | fine (floor of 109.5 is 109) |
| `=TRUNC(A1,0)` | 109 | fine |
| `=ROUNDUP(A1,0)` | 110 | fine |
| `=CEILING(A1,1)` | 110 | fine |
| `=A1*2` | 219 | fine (display rounding hides it) |

## Reference behavior

Excel returns **110**. Excel keeps 15 significant decimal digits per stored/intermediate
result. `109.49999999999998579` at 15 significant digits is exactly `109.500000000000`, and
`ROUND(109.5, 0)` is 110. HyperFormula keeps the full 17-digit double instead, so `ROUND`
sees a value just under the boundary. The issue reporter's screenshot shows the Excel result.

## Upstream status

HyperFormula issue **#1571 — "[Bug]: Precision rounding diference between HF and Excel"** is
the same root cause (same reported workaround of `precisionRounding: 15`, same failure).
It was **closed as completed on 2025-11-14 without a code fix**. The maintainer response was:

> Ok, we will update our documentation to make it clear that floating-point calculations are
> not always 100% accurate. Also, we consider adding a high-precision calculation mode to
> HyperFormula which could increase the calculation precision from ~10 to ~20 significant digits.

So upstream treats this as documented behavior plus a possible future feature, not a fix.
There is no open HyperFormula issue that specifically covers the ROUND/display inconsistency.

## Possible fixes (for whoever picks this up — all upstream in HyperFormula)

1. **Apply smart rounding to function arguments too**, not just on export. Most faithful to
   Excel, and it makes display, comparison, and functions agree. Highest risk of changing
   existing results.
2. **Round to 15 significant digits after every arithmetic operation**, like Excel does.
   This is the real Excel model. Also broad.
3. **Make the rounding functions epsilon-aware** — have `ROUND`/`MROUND` snap the argument to
   `precisionRounding` significant digits before rounding. Narrow, targeted at the reported
   symptom, low blast radius.
4. **Ship the high-precision mode** the HyperFormula team mentioned in #1571.

Option 3 is the smallest change that fixes exactly what users report.

## Workaround for users today

Round the intermediate value first, so `ROUND` gets a clean number:

```
=ROUND(ROUND(21.9/0.2, 10), 0)   ->  110
```
