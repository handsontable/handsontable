# DRAFT — closing comment for handsontable/handsontable#10935

Action after approval: post this comment, then close the issue.

---

Hi @yanyinqing,

Thank you for reporting this, and sorry for how long it took to get back to you with a full
answer.

We investigated it, and you are right that the result is wrong. Here is what happens:

1. `21.9 / 0.2` is not exactly `109.5` in floating-point math. It is `109.49999999999998579`.
2. That raw value is what gets stored in the cell.
3. When the value is displayed, the engine rounds it, so the cell shows `109.5`.
4. When the value is compared, the engine uses a tolerance, so `=A1=109.5` returns `TRUE`.
5. When the value is passed to `ROUND`, neither of those happens. `ROUND` gets the raw
   `109.49999999999999` and rounds it down to `109`.

So the engine shows you `109.5`, agrees that the cell equals `109.5`, and then rounds it to
`109`. Excel returns `110` because it rounds each result to 15 significant digits, which makes
the division produce exactly `109.5`.

The cause sits in HyperFormula, which is the calculation engine behind the `Formulas` plugin,
not in Handsontable itself. We tracked it there: **handsontable/hyperformula#NNNN**. Please
follow that issue for progress.

One correction to the earlier reply in this thread: `precisionRounding` cannot fix this at any
value. It only changes the displayed value and never reaches the number that `ROUND` receives.
We tested it from `10` through `17`, and `=ROUND(21.9/0.2,0)` returned `109` in every case.

Until the engine is fixed, you can round the intermediate value first so that `ROUND` gets a
clean number:

```
=ROUND(ROUND(21.9/0.2, 10), 0)
```

That returns `110`.

`MROUND` is affected in the same way. `INT`, `TRUNC`, `ROUNDUP` and `CEILING` return the
expected results for this input.

I am closing this issue here, since the work now belongs in the HyperFormula repository.

---

**Note:** replace `#NNNN` with the real HyperFormula issue number once it is created.
