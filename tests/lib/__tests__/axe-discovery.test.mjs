import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_TAGS, discoveryFindings, nodeCause, nodeReason, ruleFamily } from '../axe-discovery.mjs';
import { EVIDENCE_SCHEMA, findingId, validatePart } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", the axe discovery run): how one discovery scan's axe
// results become triage records. The spec (`a11y/checks/axe-discovery.spec.ts`) runs axe with the
// wider tags; everything that shapes its records is here.

const CONTRAST = {
  id: 'color-contrast-enhanced', impact: 'serious', help: 'Elements must meet enhanced color contrast ratio thresholds',
  tags: ['cat.color', 'wcag2aaa', 'wcag146'],
  nodes: [
    { target: ['td:nth-child(2)'], html: '<td class="htDimmed current">A1</td>', failureSummary: 'Fix any: contrast 5.1:1' },
    { target: ['td:nth-child(3)'], html: '<td class="htDimmed">B1</td>', failureSummary: 'Fix any: contrast 5.1:1' },
  ],
};
const REGION = {
  id: 'region', impact: 'moderate', help: 'All page content should be contained by landmarks', tags: ['cat.keyboard', 'best-practice'],
  nodes: [{ target: ['.ht-root-wrapper'], html: '<div class="ht-root-wrapper">', failureSummary: 'Fix any: not in a landmark' }],
};
const INCOMPLETE = {
  id: 'color-contrast', impact: 'serious', help: 'Elements must meet minimum color contrast ratio thresholds', tags: ['cat.color', 'wcag2aa', 'wcag143'],
  nodes: [
    { target: ['th:nth-child(2)'], html: '<th class="ht__highlight">A</th>',
      any: [{ id: 'color-contrast', data: { messageKey: 'bgImage' }, message: 'Element\'s background color could not be determined due to a background image' }] },
    { target: ['th:nth-child(3)'], html: '<th class="ht__highlight">B</th>',
      any: [{ id: 'color-contrast', data: { messageKey: 'bgImage' }, message: 'Element\'s background color could not be determined due to a background image' }] },
    { target: ['th:nth-child(4)'], html: '<th class="ht__highlight">C</th>', any: [],
      none: [{ id: 'color-contrast', data: { messageKey: 'shortTextContent' }, message: 'Element content is too short to determine if it is actual text content' }] },
  ],
};

test('the discovery run widens the scan to best practices, AAA and the experimental rules', () => {
  assert.deepEqual(DISCOVERY_TAGS, ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice', 'experimental']);
});

test('every rule belongs to one family: the A and AA set the gating scan runs, AAA, best practice, experimental', () => {
  assert.equal(ruleFamily(['wcag2aa', 'wcag143']), 'wcag-a-aa');
  assert.equal(ruleFamily(['wcag2aaa', 'wcag146']), 'wcag-aaa');
  assert.equal(ruleFamily(['best-practice']), 'best-practice');
  assert.equal(ruleFamily(['wcag2a', 'experimental']), 'experimental', 'an experimental rule is experimental whatever else it is tagged');
});

test('a node\'s reason is the first message axe gives, or its failure summary', () => {
  assert.equal(nodeReason(INCOMPLETE.nodes[0]), 'Element\'s background color could not be determined due to a background image');
  assert.equal(nodeReason(INCOMPLETE.nodes[2]), 'Element content is too short to determine if it is actual text content');
  assert.equal(nodeReason({ failureSummary: 'Fix any: x' }), 'Fix any: x');
  assert.equal(nodeReason({}), 'axe gave no reason');
});

test('a node\'s cause is the axe check behind its first message and the message key, never the message text', () => {
  assert.equal(nodeCause(INCOMPLETE.nodes[0]), 'color-contrast:bgImage');
  assert.equal(nodeCause(INCOMPLETE.nodes[2]), 'color-contrast:shortTextContent');
  assert.equal(nodeCause({ all: [{ id: 'aria-hidden-body', data: null, message: 'x' }] }), 'aria-hidden-body', 'a check without a message key is its id');
  assert.equal(nodeCause({ failureSummary: 'Fix any: x' }), 'unknown');
});

test('violations group by rule and element; needs-review results by rule, element and cause', () => {
  const findings = discoveryFindings({ violations: [CONTRAST, REGION], incomplete: [INCOMPLETE] });

  assert.deepEqual(findings.map(item => [item.kind, item.rule, item.criteria, item.severity, item.selector, item.measured.nodes, item.measured.family]), [
    ['axe-violation', 'color-contrast-enhanced', ['1.4.6'], 'serious', 'td', 2, 'wcag-aaa'],
    ['axe-violation', 'region', [], 'moderate', 'div.ht-root-wrapper', 1, 'best-practice'],
    ['axe-needs-review', 'color-contrast', ['1.4.3'], 'advisory', 'th', 2, 'wcag-a-aa'],
    ['axe-needs-review', 'color-contrast', ['1.4.3'], 'advisory', 'th', 1, 'wcag-a-aa'],
  ]);
  assert.equal(findings[2].reason, 'Elements must meet minimum color contrast ratio thresholds: Element\'s background color could not be determined due to a background image');
  assert.equal(findings[2].measured.example, 'th:nth-child(2)');
  assert.equal(findings[2].cause, 'color-contrast:bgImage');
  assert.equal(findings[0].cause, undefined, 'a violation is keyed by its rule alone');
});

test('a needs-review record keeps one key and one id across runs when axe writes per-node values into its message', () => {
  // The autocomplete editor's `aria-controls` holds the instance's random guid (`ht_<hex>`), and a target-size
  // message holds the element's size in px: neither may split a record or change its id.
  const scan = (guid, width) => discoveryFindings({ incomplete: [
    { id: 'aria-valid-attr-value', impact: 'critical', help: 'ARIA attributes must conform to valid values', tags: ['wcag2a', 'wcag412'], nodes: [
      { target: ['textarea.handsontableInput'], html: '<textarea class="handsontableInput">',
        any: [], all: [{ id: 'aria-valid-attr-value', data: { messageKey: 'controlsWithinPopup' },
          message: `Unable to determine if aria-controls referenced ID exists on the page: aria-controls="${guid}-listbox-0-0"` }] },
    ] },
    { id: 'target-size', impact: 'serious', help: 'All touch targets must be 24px large, or leave sufficient space', tags: ['wcag22aa', 'wcag258'], nodes: [
      { target: ['th:nth-child(2) > .changeType'], html: '<button class="changeType">',
        any: [{ id: 'target-offset', data: { messageKey: 'nonTabbableNeighbor' }, message: `Target has insufficient offset (${width}px, at least 24px)` }] },
      { target: ['th:nth-child(3) > .changeType'], html: '<button class="changeType">',
        any: [{ id: 'target-offset', data: { messageKey: 'nonTabbableNeighbor' }, message: `Target has insufficient offset (${width + 3}px, at least 24px)` }] },
    ] },
  ] }).map(item => ({ ...item, page: 'editor', theme: 'main' }));
  const first = scan('ht_00b705', 18);
  const second = scan('ht_9c41e2', 21);

  assert.deepEqual(first.map(item => item.measured.nodes), [1, 2], 'two sizes on one element shape are one record');
  assert.deepEqual(second.map(item => findingId('axe-discovery', item)), first.map(item => findingId('axe-discovery', item)));
  assert.match(first[0].reason, /aria-controls="ht_00b705-listbox-0-0"/, 'the reason keeps axe\'s own words');
});

test('two records on one element differ by rule and cause, so their ids never collide', () => {
  const findings = discoveryFindings({ violations: [CONTRAST, REGION], incomplete: [INCOMPLETE] })
    .map(item => ({ ...item, page: 'grid', theme: 'main' }));
  const ids = findings.map(item => findingId('axe-discovery', item));

  assert.equal(new Set(ids).size, ids.length);
});

test('the records are valid evidence', () => {
  const findings = discoveryFindings({ violations: [CONTRAST, REGION], incomplete: [INCOMPLETE] });

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main' }, durationMs: 1, findings }), []);
});
