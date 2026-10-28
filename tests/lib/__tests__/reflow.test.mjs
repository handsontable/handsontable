import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONDITIONS, clippingFindings, hoverFindings, nameApart, orientationFindings, overlapFindings, viewportFindings } from '../reflow.mjs';
import { EVIDENCE_SCHEMA, findingId, mergeEvidence, validatePart } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", zoom, reflow, text spacing, hover content): the
// verdicts behind 1.3.4, 1.4.4, 1.4.10, 1.4.12, and 1.4.13. The spec measures boxes under each condition;
// what counts as lost content is decided here.

test('each condition names its criterion and its viewport', () => {
  assert.deepEqual(CONDITIONS, {
    'reflow-320': { criteria: ['1.4.10'], viewport: { width: 320, height: 256 }, label: '320 CSS px wide (400% of 1280 by 1024)' },
    'zoom-200': { criteria: ['1.4.4'], viewport: { width: 640, height: 512 }, label: '200% zoom (640 by 512 CSS px)' },
    'text-spacing': { criteria: ['1.4.12'], viewport: { width: 1280, height: 720 }, label: 'the WCAG text-spacing override' },
  });
});

const box = (fields = {}) => ({
  selector: 'span.title', surface: 'dialog', text: 'Delete the selected rows?', overflowX: 'hidden', overflowY: 'visible', ellipsis: false,
  scrollWidth: 100, clientWidth: 100, scrollHeight: 20, clientHeight: 20, ...fields,
});

test('text a clipping container cuts off is lost; text it ellipsizes is truncated; scrollable or fitting text is fine', () => {
  const findings = clippingFindings({
    condition: 'reflow-320',
    boxes: [
      box({ scrollWidth: 160, clientWidth: 100 }),
      box({ selector: 'li.label', ellipsis: true, scrollWidth: 140, clientWidth: 100 }),
      box({ selector: 'div.list', overflowX: 'auto', scrollWidth: 300, clientWidth: 100 }),
      box({ selector: 'p.description', overflowY: 'hidden', scrollHeight: 31, clientHeight: 20 }),
      box({ selector: 'span.fits', scrollWidth: 101, clientWidth: 100 }),
    ],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity, item.selector, item.measured.hidden]), [
    ['text-clipped', ['1.4.10'], 'serious', 'span.title', 60],
    ['text-truncated', ['1.4.10'], 'moderate', 'li.label', 40],
    ['text-clipped', ['1.4.10'], 'serious', 'p.description', 11],
  ], 'one pixel of rounding is not a clip');
  assert.equal(findings[0].measured.text, 'Delete the selected rows?');
});

test('a screen-reader-only box cuts nothing off: its text is read out, never drawn', () => {
  const liveRegion = box({
    selector: 'div "Page 1 of 5"', surface: 'grid UI', text: 'Page 1 of 5', overflowY: 'hidden',
    scrollWidth: 82, clientWidth: 1, scrollHeight: 18, clientHeight: 1,
  });

  assert.deepEqual(clippingFindings({ condition: 'reflow-320', boxes: [liveRegion] }), [],
    'the announcer\'s live regions (utils/a11yAnnouncer.ts) are 1 by 1 px with overflow hidden');
});

test('a fixed surface the viewport cuts off is out of reach; an absolute one below the fold is a vertical scroll away', () => {
  const findings = viewportFindings({
    condition: 'reflow-320',
    viewport: { width: 320, height: 256, scrollWidth: 320, scrollHeight: 600 },
    surfaces: [
      { selector: 'div.ht-notification', surface: 'notification', left: 180, right: 420, top: 10, bottom: 200, fixed: true },
      { selector: 'div.htMenu', surface: 'menu', left: 10, right: 300, top: 100, bottom: 560, fixed: false },
      { selector: 'div.ht-pagination', surface: 'pagination', left: 0, right: 318, top: 10, bottom: 40, fixed: false },
    ],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.selector, item.measured.beyond]), [
    ['outside-viewport', ['1.4.10'], 'div.ht-notification', 100],
  ], 'vertical scrolling is allowed at 320 px');
});

test('a surface past the viewport on a page that cannot scroll there is out of reach', () => {
  const findings = viewportFindings({
    condition: 'zoom-200',
    viewport: { width: 640, height: 512, scrollWidth: 640, scrollHeight: 512 },
    surfaces: [{ selector: 'div.htMenu', surface: 'menu', left: 400, right: 700, top: 300, bottom: 620, fixed: false }],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.measured.beyond]), [['outside-viewport', ['1.4.4'], 108]]);
});

test('a surface wider than the viewport that makes the page scroll sideways is a two-dimensional scroll', () => {
  const findings = viewportFindings({
    condition: 'reflow-320',
    viewport: { width: 320, height: 256, scrollWidth: 512, scrollHeight: 400 },
    surfaces: [{ selector: 'div.ht-sheets-bar', surface: 'sheets bar', left: 0, right: 512, top: 300, bottom: 330, fixed: false }],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity, item.measured.beyond]),
    [['needs-horizontal-scroll', ['1.4.10'], 'serious', 192]]);
});

test('a surface before the page\'s origin is out of reach: no scroll goes left of it or above it', () => {
  const findings = viewportFindings({
    condition: 'reflow-320',
    viewport: { width: 320, height: 256, scrollX: 0, scrollY: 0, scrollWidth: 736, scrollHeight: 900 },
    surfaces: [
      { selector: 'div.htMenu', surface: 'menu', left: -51, right: 166, top: 40, bottom: 240, fixed: false },
      { selector: 'div.htContextMenuSub_Alignment', surface: 'menu', left: -267, right: -50, top: 60, bottom: 200, fixed: false },
      { selector: 'div.htDropdownMenu', surface: 'menu', left: 10, right: 200, top: -40, bottom: 160, fixed: false },
    ],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.selector, item.measured.beyond]), [
    ['outside-viewport', 'div.htMenu', 51],
    ['outside-viewport', 'div.htContextMenuSub_Alignment', 267],
    ['outside-viewport', 'div.htDropdownMenu', 40],
  ], 'the page scrolls sideways and down, and neither scroll reaches a box before its origin');
});

test('a surface is placed by the page\'s scroll offset, and past the page\'s scroll size it is out of reach', () => {
  const viewport = { width: 640, height: 512, scrollX: 0, scrollY: 300, scrollWidth: 640, scrollHeight: 1000 };

  assert.deepEqual(viewportFindings({
    condition: 'zoom-200',
    viewport,
    surfaces: [{ selector: 'div.htMenu', surface: 'menu', left: 10, right: 300, top: -40, bottom: 200, fixed: false }],
  }), [], 'above the viewport on a page scrolled down is a scroll up away');
  assert.deepEqual(viewportFindings({
    condition: 'zoom-200',
    viewport,
    surfaces: [{ selector: 'div.htMenu', surface: 'menu', left: 10, right: 300, top: 400, bottom: 900, fixed: false }],
  }).map(item => [item.kind, item.measured.beyond]), [['outside-viewport', 200]],
  'a box inside a clipping container does not grow the page, so scrolling down stops short of it');
});

test('a sideways scroll is a finding at 320 px only: at 200% zoom or under text spacing it loses nothing', () => {
  for (const [condition, width] of [['zoom-200', 640], ['text-spacing', 1280]]) {
    assert.deepEqual(viewportFindings({
      condition,
      viewport: { width, height: 512, scrollWidth: width + 200, scrollHeight: 512 },
      surfaces: [{ selector: 'div.ht-sheets-bar', surface: 'sheets bar', left: 0, right: width + 200, top: 300, bottom: 330, fixed: false }],
    }), [], `1.4.10 is the criterion that rules out a second scroll direction, not ${CONDITIONS[condition].criteria[0]}`);
  }
});

test('two surfaces of one name are told apart: the menu and its submenu at 320 px are two findings with two ids', () => {
  const findings = viewportFindings({
    condition: 'reflow-320',
    viewport: { width: 320, height: 256, scrollX: 0, scrollY: 0, scrollWidth: 320, scrollHeight: 256 },
    surfaces: nameApart([
      { selector: 'div.htMenu', surface: 'menu', left: -51, right: 166, top: 40, bottom: 240, fixed: false },
      { selector: 'div.htMenu', surface: 'menu', left: -267, right: -50, top: 60, bottom: 200, fixed: false },
    ]),
  });
  const doc = mergeEvidence({
    check: 'reflow',
    parts: [{
      schema: EVIDENCE_SCHEMA, durationMs: 1, findings,
      target: { page: 'context-menu-submenu', theme: 'main', state: 'context-menu-submenu', variant: 'reflow-320' },
    }],
  });

  assert.deepEqual(findings.map(item => item.selector), ['div.htMenu', 'div.htMenu (2)']);
  assert.equal(new Set(doc.findings.map(item => item.id)).size, 2, 'the context menu and its Alignment submenu are both div.htMenu');
  assert.deepEqual(doc.problems, [], 'no two findings share an id');
});

test('a name gets an ordinal only when an earlier item of the list has it', () => {
  const controls = [{ selector: 'button "Next"' }, { selector: 'button "Previous"' }, { selector: 'button "Next"' }, { selector: 'button "Next"' }];

  assert.deepEqual(nameApart(controls).map(item => item.selector), ['button "Next"', 'button "Previous"', 'button "Next" (2)', 'button "Next" (3)']);
  assert.equal(controls[2].selector, 'button "Next"', 'the measured list is left as it was');
});

test('controls drawn over each other are a finding; nested and touching ones are not', () => {
  const findings = overlapFindings({
    condition: 'text-spacing',
    controls: [
      { id: 0, selector: 'button.prev', left: 0, top: 0, right: 40, bottom: 30, within: [] },
      { id: 1, selector: 'button.next', left: 30, top: 0, right: 70, bottom: 30, within: [] },
      { id: 2, selector: 'button.last', left: 70, top: 0, right: 110, bottom: 30, within: [] },
      { id: 3, selector: 'input.check', left: 5, top: 5, right: 15, bottom: 15, within: [5, 0] },
    ],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.selector, item.measured.area]), [
    ['controls-overlap', ['1.4.12'], 'button.prev × button.next', 300],
  ]);
});

test('one control drawn over two neighbors is two findings, each named by its pair', () => {
  const findings = overlapFindings({
    condition: 'zoom-200',
    controls: [
      { id: 0, selector: 'button.wide', left: 0, top: 0, right: 100, bottom: 30, within: [] },
      { id: 1, selector: 'button.left', left: 10, top: 0, right: 40, bottom: 30, within: [] },
      { id: 2, selector: 'button.right', left: 60, top: 0, right: 90, bottom: 30, within: [] },
    ],
  });
  const ids = findings.map(item => findingId('reflow', { ...item, page: 'pagination', theme: 'main', variant: 'zoom-200' }));

  assert.deepEqual(findings.map(item => item.selector), ['button.wide × button.left', 'button.wide × button.right']);
  assert.equal(new Set(ids).size, 2, 'a run-to-run compare tells the two overlaps apart, and fixing one clears its id');
});

test('a popup lies over what is under it by design: its controls overlap only the controls of a popup', () => {
  const findings = overlapFindings({
    condition: 'reflow-320',
    controls: [
      { id: 0, selector: 'input.address', left: 0, top: 0, right: 80, bottom: 30, within: [], popup: false },
      { id: 1, selector: 'div.option', left: 10, top: 10, right: 90, bottom: 40, within: [], popup: true },
      { id: 2, selector: 'div.close', left: 60, top: 10, right: 100, bottom: 40, within: [], popup: true },
    ],
  });

  assert.deepEqual(findings.map(item => item.selector), ['div.option × div.close'],
    'a list drawn over the formula bar hides it until it closes; two of its own controls over each other are lost');
});

test('hover content must be dismissible, hoverable, and persistent', () => {
  assert.deepEqual(hoverFindings({ selector: '.htComments', dismissible: true, hoverable: true, persistent: true }), []);
  assert.deepEqual(hoverFindings({ selector: '.htComments', dismissible: false, hoverable: false, persistent: false })
    .map(item => [item.kind, item.criteria, item.severity]), [
    ['hover-content-not-dismissible', ['1.4.13'], 'serious'],
    ['hover-content-not-hoverable', ['1.4.13'], 'serious'],
    ['hover-content-not-persistent', ['1.4.13'], 'serious'],
  ]);
});

test('a hover property the spec could not measure is no finding: the spec lists it as a problem', () => {
  assert.deepEqual(hoverFindings({ selector: '.htComments', hoverable: false, dismissible: true }).map(item => item.kind),
    ['hover-content-not-hoverable'], 'the comment did not show again for the persistence step, so it was not measured');
  assert.deepEqual(hoverFindings({ selector: '.htComments' }), [], 'a comment that never appeared measured nothing');
});

test('a grid shown in one orientation and not the other is locked to an orientation (1.3.4)', () => {
  assert.deepEqual(orientationFindings({ portrait: { width: 390, height: 300 }, landscape: { width: 800, height: 300 } }), []);
  assert.deepEqual(orientationFindings({ portrait: { width: 0, height: 0 }, landscape: { width: 800, height: 300 } })
    .map(item => [item.kind, item.criteria, item.severity, item.step]), [['orientation-locked', ['1.3.4'], 'serious', 'portrait']]);
});

test('the check\'s findings are valid evidence', () => {
  const findings = [
    ...clippingFindings({ condition: 'zoom-200', boxes: [box({ scrollWidth: 160 })] }),
    ...hoverFindings({ selector: '.htComments', dismissible: false, hoverable: true, persistent: true }),
    ...orientationFindings({ portrait: { width: 0, height: 0 }, landscape: { width: 1, height: 1 } }),
  ];

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'dialog', theme: 'main' }, durationMs: 1, findings }), []);
});
