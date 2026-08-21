/**
 * Repro for handsontable/handsontable#10935.
 *
 * Run with:  node repro-issue-10935.mjs
 * Needs `hyperformula` resolvable (e.g. from handsontable/node_modules).
 */
import { HyperFormula } from 'hyperformula';

const show = (label, formulas, cfg = {}) => {
  const hf = HyperFormula.buildFromArray([formulas], { licenseKey: 'gpl-v3', ...cfg });
  const values = hf.getSheetValues(0)[0];

  console.log(`\n== ${label} ==`);
  formulas.forEach((f, i) => console.log(`  ${String(f).padEnd(26)} => ${values[i]}`));
  hf.destroy();
};

console.log('Plain JS:  21.9 / 0.2 =', 21.9 / 0.2, '  (full:', (21.9 / 0.2).toPrecision(20) + ')');

// The reported bug, plus the two places that disagree with it.
show('The inconsistency', [
  '=21.9/0.2',          // displayed as 109.5   (export applies smart rounding)
  '=A1=109.5',          // TRUE                 (comparison applies epsilon)
  '=ROUND(A1,0)',       // 109  <-- BUG         (function gets the raw double)
  '=ROUND(21.9/0.2,0)', // 109  <-- BUG
]);

// precisionRounding cannot fix it at any value.
for (const precisionRounding of [10, 12, 13, 14, 15, 16, 17]) {
  show(`precisionRounding: ${precisionRounding}`, ['=ROUND(21.9/0.2,0)', '=21.9/0.2'], { precisionRounding });
}

// Which functions trip on the .5 boundary.
show('Affected functions', [
  '=21.9/0.2',
  '=ROUND(A1,0)',    // 109 - wrong
  '=MROUND(A1,1)',   // 109 - wrong
  '=INT(A1)',        // 109 - fine
  '=TRUNC(A1,0)',    // 109 - fine
  '=ROUNDUP(A1,0)',  // 110 - fine
  '=CEILING(A1,1)',  // 110 - fine
]);

// User-side workaround: clean the intermediate value before rounding it.
show('Workaround', ['=ROUND(ROUND(21.9/0.2,10),0)']);
