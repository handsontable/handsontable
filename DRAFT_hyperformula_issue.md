# DRAFT — new issue for handsontable/hyperformula

**Title:** `[Bug]: ROUND() skips smart rounding, so a cell that displays 109.5 rounds down to 109`

**Labels:** `bug` (added automatically by the template)

---

### Description

`ROUND()` receives the raw floating-point value of its argument, while the display path and the
comparison operators both apply smart rounding. The engine ends up reporting two different
answers about the same number.

Steps to reproduce:

```js
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildFromArray([
  ['=21.9/0.2', '=A1=109.5', '=ROUND(A1,0)', '=ROUND(21.9/0.2,0)'],
], { licenseKey: 'gpl-v3' });

console.log(hf.getSheetValues(0)[0]);
// actual:   [109.5, true, 109, 109]
// expected: [109.5, true, 110, 110]
```

So for one and the same value:

| Question | Answer |
|---|---|
| What is A1? | `109.5` |
| Is A1 equal to 109.5? | `TRUE` |
| What is A1 rounded to 0 places? | `109` |

Excel returns `110` here, because it rounds each result to 15 significant digits, which makes
the division produce exactly `109.5`.

**Cause**

`21.9 / 0.2` is `109.49999999999998579` as an IEEE-754 double, and that is what gets stored.
Smart rounding is then applied in only two places:

- `src/Exporter.ts` &mdash; `exportValue()`, the read-out path. This is why the cell displays `109.5`.
- `src/interpreter/ArithmeticHelper.ts` &mdash; `actualEps`, used for comparisons. This is why
  `=A1=109.5` is `TRUE`.

Nothing rounds the value passed into a function argument, and `ROUND` is a plain `Math.round`
(`src/interpreter/plugin/RoundingPlugin.ts`). `Math.round(109.49999999999999)` is `109`.

**`precisionRounding` does not help**

Setting `precisionRounding` is the workaround suggested in earlier reports, but it only affects
the exported value. A sweep on `=ROUND(21.9/0.2,0)`:

| `precisionRounding` | `=ROUND(21.9/0.2,0)` | `=21.9/0.2` as displayed |
|---|---|---|
| 10 | 109 | 109.5 |
| 12 | 109 | 109.5 |
| 13 | 109 | 109.5 |
| 14 (default) | 109 | 109.5 |
| 15 | 109 | 109.5 |
| 16 | 109 | 109.49999999999999 |
| 17 | 109 | 109.49999999999999 |

`ROUND` stays at `109` for every value.

**Other functions**

`MROUND` fails the same way. `INT`, `TRUNC`, `ROUNDUP` and `CEILING` all return the expected
result for this input.

**Workaround for users**

Round the intermediate value first, so `ROUND` gets a clean number:

```
=ROUND(ROUND(21.9/0.2, 10), 0)   ->  110
```

**Notes**

Reported downstream as handsontable/handsontable#10935.

This shares a root cause with #1571, which was closed with a plan to document the imprecision
and to consider a high-precision mode. This report is narrower: the problem is not only that
doubles are imprecise, but that the engine already smart-rounds the value for display and for
comparison, and then does not apply the same treatment when the value is passed to a function.
That is what makes the result look like a defect to users rather than expected floating-point
behavior.

One targeted option would be to snap the argument of `ROUND`/`MROUND` to `precisionRounding`
significant digits before rounding. A broader option is to round after every arithmetic
operation, as Excel does.

### Video or screenshots

_No response_

### Demo

No sandbox needed — the snippet in the description reproduces it in Node with a default engine
configuration.

### HyperFormula version

3.4.0 (also reproduced on 3.3.0)

### Your framework

_No response_

### Your environment

Node.js 24 (engine-only, no browser involved)
