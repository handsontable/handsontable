import { test } from 'node:test';
import assert from 'node:assert/strict';
import { A11Y_EVIDENCE_ARTIFACT, findingKey, readA11yArtifacts } from '../lib/a11y-ledger.mjs';
import { EVIDENCE_CHECKS, EVIDENCE_SCHEMA } from '../../../tests/lib/a11y-evidence.mjs';
import { ledgerKey } from '../../../tests/lib/a11y-pr-ledger.mjs';

// tests/AGENTS.md, "A11y: the checks beyond axe": on a pull request the findings ledger is the baseline of the short
// suite, and a finding is known when its ledger row is open. The pull request reads the row by `ledgerKey()` in
// tests/lib, which cannot import the ledger module (it reaches tests/a11y, and the verdict jobs check out tests/lib
// alone). So the two keys are held together here: every finding below, read by the collector the way a night is
// read, has the key `ledgerKey()` gives it. A finding the two key apart would read as new on every pull request.

const FINDINGS = [
  { kind: 'focus-not-returned', criteria: ['2.4.3'], severity: 'serious', step: 'Escape on the editor state', page: 'autocomplete-editor',
    theme: 'main', state: 'editor', reason: 'r' },
  { kind: 'focus-lost', criteria: ['2.4.3'], severity: 'serious', selector: 'input.ht-multi-select-editor-search-input', step: 'Tab 1',
    page: 'multiselect-editor', theme: 'main', state: 'editor', reason: 'r' },
  { kind: 'focus-indicator-contrast', criteria: ['1.4.11'], severity: 'serious', selector: 'td.ht-formula-ref-fill-ht_3f7319f5810a6f01-2  >  span',
    page: 'formula-builder', theme: 'horizon', state: 'formula-builder', variant: 'dark', reason: 'r' },
  { kind: 'axe-violation', rule: 'aria-required-parent', cause: 'aria-required-parent:fail', criteria: ['1.3.1'], severity: 'critical',
    selector: '#ht_0123456789abcdef td.htSeparator[role="menuitem"]:nth-child(3)', page: 'context-menu', theme: 'main', state: 'context-menu', reason: 'r' },
  { kind: 'shortcut-does-nothing', criteria: ['2.1.1'], severity: 'serious', step: `Ctrl+Shift+\\   with   ${'a long setup step, '.repeat(20)}`,
    page: 'grid', theme: 'main', reason: 'r' },
  { kind: 'controls-overlap', criteria: ['1.4.10'], severity: 'serious', selector: `button.${'x'.repeat(320)}`, page: 'pagination', theme: 'classic',
    variant: 'reflow-320', reason: 'r' },
];

test('ledgerKey gives a check\'s finding the key the findings ledger gives its row', () => {
  for (const check of ['keyboard-walker', 'focus-contrast']) {
    const findings = FINDINGS.map(item => ({ state: 'none', variant: null, url: `/tests/fixtures/demo/${item.page}.html`, ...item }));
    const targets = [...new Map(findings.map(item => [`${item.page}|${item.theme}|${item.variant ?? ''}`, item])).values()]
      .map(item => ({ page: item.page, theme: item.theme, state: item.state, variant: item.variant, status: 'measured', criteria: ['2.4.3'] }));
    const doc = {
      schema: EVIDENCE_SCHEMA,
      check,
      title: EVIDENCE_CHECKS[check].title,
      mode: 'report',
      triage: false,
      criteria: EVIDENCE_CHECKS[check].criteria,
      run: { commit: '4813c183892bbbadd52b3c0d79b811bd6aacd7f1', ref: 'develop', runUrl: 'https://github.com/o/r/actions/runs/1' },
      targets,
      findings: findings.map((item, index) => ({ ...item, id: `${check}|${index}` })),
      problems: [],
      summary: { targets: targets.length, measured: targets.length, errors: 0, flaky: 0, findings: findings.length, bySeverity: {}, byKind: {}, byCriterion: {} },
    };
    const read = readA11yArtifacts([{ artifact: A11Y_EVIDENCE_ARTIFACT, path: `${check}.json`, text: JSON.stringify(doc) }]);
    const rows = read.nights[0]?.findings ?? [];

    assert.equal(rows.length, FINDINGS.length, `the collector read every finding of ${check}: ${read.notes.join('; ')}`);
    assert.deepEqual(doc.findings.map(item => ledgerKey('checks', check, item)), rows.map(row => findingKey(row)),
      `${check}: tests/lib/a11y-pr-ledger.mjs keys a finding as findingKey() of .github/scripts/lib/a11y-ledger.mjs does`);
  }
});
