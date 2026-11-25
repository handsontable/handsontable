import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  inputFindings,
  popupFindings,
  shortcutFindings,
  skipLinkFindings,
  unreachableFindings,
  walkFindings,
  walkProblem,
  walkVerdict,
} from '../site-keyboard.mjs';
import {
  boundaryFindings,
  boundaryOf,
  boxInCapture,
  changedRings,
  focusExtent,
  isFieldShape,
  isFieldStop,
  orientationFindings,
  outlineReach,
  pageReflowFindings,
  pixelBox,
  pseudoRingBox,
  shadowReach,
  stateLostFindings,
} from '../site-visual.mjs';

// tests/AGENTS.md ("A11y: the site checks beyond axe"): the verdicts of the keyboard walk on a site (2.1.1, 2.1.2,
// 2.1.4, 2.4.1, 2.4.3, 3.2.1, 3.2.2, 4.1.2) and the visual judges the site checks add (1.4.10, 1.3.4, 1.4.11, 1.4.1).

const stop = (fields = {}) => ({
  region: 'page', key: 'body:1>a:0', shape: 'a.nav-link', role: 'link', name: 'Guides', hidden: null, ariaHidden: false, tabindex: null,
  navigated: false, dialogOpened: false, ...fields,
});
const kinds = findings => findings.map(finding => finding.kind).sort();

test('a walk ends at the sentinel after the page, cycles when it comes back to a stop, or runs out', () => {
  assert.equal(walkVerdict({ stops: [stop(), stop({ key: 'b' }), stop({ region: 'end', key: 'end' })] }), 'complete');
  assert.equal(walkVerdict({ stops: [stop(), stop({ key: 'b' }), stop()] }), 'cycle');
  assert.equal(walkVerdict({ stops: [stop(), stop({ key: 'b' })], budgetExhausted: true }), 'budget');
  assert.equal(walkVerdict({ stops: [stop({ region: 'grid', key: 'cell' }), stop({ region: 'grid', key: 'cell' }), stop({ region: 'end', key: 'end' })] }),
    'complete', 'a grid region repeats its keys and is not a cycle of the page');
  assert.equal(walkVerdict({ stops: [stop(), stop({ region: 'body', key: 'navigated', navigated: true })] }), 'navigated',
    'a Tab that loaded another page ends the walk short of the end, never as complete');
  assert.equal(walkVerdict({ stops: [stop(), stop({ region: 'grid', key: 'cell' })] }), 'stopped',
    'a walk that found nothing past a grid ends short of the end, never as complete');
  assert.equal(walkVerdict({ stops: [stop(), stop({ key: 'b' }), stop({ region: 'start', key: 'start' })], direction: 'backward' }), 'complete',
    'a Shift+Tab walk ends at the sentinel before the page');
  assert.equal(walkVerdict({ stops: [stop(), stop({ region: 'start', key: 'start' })] }), 'stopped',
    'a Tab walk that comes out at the start never reached the end');
  assert.match(walkProblem('navigated', 100), /stops after it were not walked/);
  assert.match(walkProblem('budget', 100), /ran out of its 100 presses/);
  assert.match(walkProblem('stopped', 100), /nothing past an embedded grid/);
  assert.equal(walkProblem('complete', 100), null);
  assert.match(walkProblem('cycle', 100), /stops past the cycle were not walked/,
    'a cycle is a finding, and the stops past it were never reached, so its target is not measured either');
});

test('2.1.2: a cycle Escape does not break is a trap; one it breaks is advisory', () => {
  const stops = [stop(), stop({ key: 'b', shape: 'button.close' }), stop()];

  assert.deepEqual(walkFindings({ stops, verdict: 'cycle' }).map(item => [item.kind, item.severity]), [['keyboard-trap', 'critical']]);
  assert.deepEqual(walkFindings({ stops, verdict: 'cycle', escaped: true }).map(item => [item.kind, item.severity]), [['tab-walk-cycles', 'advisory']]);
});

test('2.1.2: an example grid the documented way out does not leave holds the focus', () => {
  const stops = [stop(), ...Array.from({ length: 3 }, () => stop({ region: 'grid', key: 'cell', shape: 'td.current[role="gridcell"]' }))];
  const [finding] = walkFindings({ stops, verdict: 'complete', gridTrap: true });

  assert.deepEqual([finding.kind, finding.severity, finding.selector, finding.measured.stops], ['grid-holds-focus', 'serious', 'td.current[role="gridcell"]', 3]);
});

test('per shape, once: a stop nobody sees, one the tree hides, one with no name, no role, or a positive tabindex', () => {
  const findings = walkFindings({
    verdict: 'complete',
    stops: [
      stop({ shape: 'button.copy', role: 'button', name: 'Copy', hidden: 'not rendered, or hidden by visibility or opacity' }),
      stop({ shape: 'button.copy', key: 'c2', role: 'button', name: 'Copy', hidden: 'not rendered, or hidden by visibility or opacity' }),
      stop({ shape: 'a.active', key: 'aa', ariaHidden: true }),
      stop({ shape: 'button.icon', key: 'bi', role: 'button', name: '' }),
      stop({ shape: 'pre[role="region"]', key: 'pre', role: 'generic', name: 'const a = 1' }),
      stop({ shape: 'div.card', key: 'dc', role: 'link', tabindex: 3 }),
      stop({ shape: 'td', key: 'cell', region: 'grid', role: 'gridcell', name: '' }),
    ],
  });

  assert.deepEqual(kinds(findings), ['focus-stop-aria-hidden', 'focus-stop-hidden', 'focus-stop-unnamed', 'focus-stop-without-role', 'tabindex-positive']);
  assert.equal(findings.find(item => item.kind === 'focus-stop-hidden').measured.count, 2);
  assert.deepEqual(findings.find(item => item.kind === 'focus-stop-hidden').criteria, ['2.4.3', '2.4.7']);
});

test('3.2.1: a Tab that loaded another page or opened a dialog changed the context', () => {
  const findings = walkFindings({ verdict: 'complete', stops: [stop({ navigated: true }), stop({ key: 'x', shape: 'button.open', dialogOpened: true })] });

  assert.deepEqual(findings.map(item => [item.kind, item.selector, item.measured.navigated]), [
    ['context-change-on-focus', 'a.nav-link', true], ['context-change-on-focus', 'button.open', false]]);
});

test('2.4.1: the skip link first, visible when focused, and skipping into the main content', () => {
  assert.deepEqual(skipLinkFindings({ present: false, first: false, visible: null, landsInMain: null }), []);
  assert.deepEqual(skipLinkFindings({ present: true, first: true, visible: true, landsInMain: true }), []);
  assert.deepEqual(kinds(skipLinkFindings({ present: true, first: false, visible: null, landsInMain: null })), ['skip-link-not-first']);
  assert.deepEqual(kinds(skipLinkFindings({ present: true, first: true, visible: false, landsInMain: false, selector: 'a.sl-skip-link' })),
    ['skip-link-does-not-skip', 'skip-link-hidden-on-focus']);
});

test('a popup: items no key reaches, a modal the focus leaves, Escape ignored, the focus not given back', () => {
  const base = { state: 'versions-menu', selector: '#versions-trigger', reachedItem: true, closedOnEscape: true, focusReturned: true };

  assert.deepEqual(popupFindings(base), []);
  assert.deepEqual(kinds(popupFindings({ ...base, reachedItem: false })), ['popup-items-unreachable']);
  assert.deepEqual(kinds(popupFindings({ ...base, modal: true, leftModal: true })), ['focus-leaves-modal']);
  assert.deepEqual(kinds(popupFindings({ ...base, leftModal: true })), [], 'a popup that is not modal may let the focus go');
  assert.deepEqual(kinds(popupFindings({ ...base, closedOnEscape: false, focusReturned: false })), ['popup-escape-ignored'],
    'the focus is judged only once the popup closed');
  assert.deepEqual(kinds(popupFindings({ ...base, focusReturned: false })), ['focus-not-returned']);
});

test('2.1.4: a printable key that acts with nothing focused; 3.2.2: an input that changes the context', () => {
  const shortcuts = shortcutFindings([
    { key: 'a', navigated: false, dialogOpened: false, focused: null, repeated: null },
    { key: '/', navigated: false, dialogOpened: false, focused: 'input#docsearch-input', repeated: true },
    { key: 'r', navigated: true, dialogOpened: false, focused: null, to: 'https://example.test/?r', repeated: false },
    { key: 'g', navigated: true, dialogOpened: false, focused: null, to: 'https://example.test/guides/', repeated: true },
  ]);

  assert.deepEqual(shortcuts.map(item => [item.kind, item.step, item.severity]),
    [['single-key-shortcut', 'key "/"', 'serious'], ['single-key-shortcut', 'key "g"', 'serious']],
    'an effect the second press did not repeat came from the page, not the key');
  assert.equal(shortcuts[1].measured.to, 'https://example.test/guides/', 'a navigation says where it went');

  const inputs = inputFindings([
    { selector: 'select.theme', key: 'ArrowDown', navigated: false, dialogOpened: false, focusMoved: false },
    { selector: 'select.version', key: 'ArrowDown', navigated: true, dialogOpened: false, focusMoved: true },
  ]);

  assert.deepEqual(inputs.map(item => [item.kind, item.selector]), [['context-change-on-input', 'select.version']]);
});

test('2.1.1: controls no key reaches, one finding per shape with a count', () => {
  const findings = unreachableFindings([
    { shape: 'div.tab[role="tab"]', role: 'tab', name: 'npm' },
    { shape: 'div.tab[role="tab"]', role: 'tab', name: 'yarn' },
    { shape: 'span.close', role: 'onclick', name: '' },
  ]);

  assert.deepEqual(findings.map(item => [item.kind, item.selector, item.measured.count]), [
    ['control-not-focusable', 'div.tab[role="tab"]', 2], ['control-not-focusable', 'span.close', 1]]);
});

test('1.4.10: a page wider than 320 px names its widest offender; at 200% a sideways scroll is no finding', () => {
  const offenders = [{ selector: 'a "Contact"', right: 330 }, { selector: 'a.status', right: 325 }];
  const [finding] = pageReflowFindings({ condition: 'reflow-320', viewport: { width: 320, scrollWidth: 330 }, offenders });

  assert.equal(finding.kind, 'page-scrolls-sideways');
  assert.equal(finding.selector, 'a "Contact"');
  assert.deepEqual(finding.measured, { scrollWidth: 330, width: 320, offenders: 'a "Contact" | a.status' });
  assert.deepEqual(pageReflowFindings({ condition: 'reflow-320', viewport: { width: 320, scrollWidth: 321 }, offenders }), [], 'a pixel of rounding');
  assert.deepEqual(pageReflowFindings({ condition: 'zoom-200', viewport: { width: 640, scrollWidth: 900 }, offenders }), []);
  assert.deepEqual(pageReflowFindings({ condition: 'reflow-320', viewport: { width: 320, scrollWidth: 616 }, offenders: [], exempt: 1 }), [],
    'a data table alone may scroll the page sideways');
  assert.equal(pageReflowFindings({ condition: 'reflow-320', viewport: { width: 320, scrollWidth: 616 }, offenders: [] })[0].selector, 'html',
    'a sideways scroll nothing measured explains is named by the page');
});

test('1.3.4: the main content missing in one orientation', () => {
  assert.deepEqual(orientationFindings({ portrait: { width: 390, height: 900 }, landscape: { width: 0, height: 0 } }).map(item => item.step), ['landscape']);
});

test('1.4.11: a text field whose edge and fill both stand under 3:1 from the page; either one at 3:1 sets it apart', () => {
  const white = [255, 255, 255];

  assert.deepEqual(boundaryFindings({ selector: 'input', boundary: { ratio: 3.1 }, fill: { ratio: 1 }, around: white }), []);
  assert.deepEqual(boundaryFindings({ selector: 'input', boundary: { ratio: 1.2 }, fill: { ratio: 3.4 }, around: white }), []);

  const [finding] = boundaryFindings({ selector: 'input', boundary: { ratio: 1.996 }, fill: { ratio: 1.05 }, around: white });

  assert.equal(finding.kind, 'control-boundary-contrast');
  assert.deepEqual(finding.measured, { boundary: 1.99, fill: 1.05, around: 'rgb(255, 255, 255)' });
});

test('1.4.11 measures every field stop, a plain one named inside its ancestor too, and nothing else', () => {
  for (const shape of ['input', 'input.search', 'textarea', 'select.ht-select', 'input[role="combobox"]',
    'label.option-label input', 'span.slider input', 'div.form textarea']) {
    assert.equal(isFieldShape(shape), true, shape);
  }
  // An ancestor's or an element's class named like a field, a custom element, and a role word are not fields.
  for (const shape of ['div.input button', 'div.select', 'input-group', 'a.link', 'div.copy button', 'button[role="input"]']) {
    assert.equal(isFieldShape(shape), false, shape);
  }
});

test('1.4.11 judges a field\'s own box only when the tree gives it a field\'s role, never a toggle\'s or a choice\'s', () => {
  for (const [shape, role] of [['input', 'textbox'], ['input.search', 'searchbox'], ['select.ht-select', 'combobox'],
    ['input[role="combobox"]', 'combobox'], ['select', 'listbox'], ['input', 'spinbutton'], ['div.form textarea', 'textbox']]) {
    assert.equal(isFieldStop({ shape, role }), true, `${shape} as ${role}`);
  }
  // A styled toggle, radio button or range draws its look in a sibling, so its own box reads as a field with no edge;
  // a role read as nothing is no field either, and a field's role on a shape that is no field is the shape's call.
  for (const [shape, role] of [['span.slider input', 'switch'], ['span.slider input', 'checkbox'], ['label.option-label input', 'radio'],
    ['input.range', 'slider'], ['input', ''], ['div[role="textbox"]', 'textbox']]) {
    assert.equal(isFieldStop({ shape, role }), false, `${shape} as ${role || 'no role'}`);
  }
});

test('1.4.1 in forced colors: a state that differed only in colors forced colors replaces', () => {
  const style = values => ({ 'background-color': 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', 'font-weight': '400', ...values });
  const lost = stateLostFindings({
    selector: 'a[aria-current="true"]', state: '[aria-current="true"]',
    element: { normal: style({ color: 'rgb(20, 90, 200)' }), forced: style({ color: 'LinkText' }) },
    sibling: { normal: style(), forced: style({ color: 'LinkText' }) },
  });

  assert.deepEqual(lost.map(item => [item.kind, item.severity, item.measured.normally]), [['state-lost-in-forced-colors', 'moderate', 'color']]);
  assert.deepEqual(stateLostFindings({
    selector: 'a.nav[aria-current="page"]', state: '[aria-current="page"]',
    element: { normal: style({ 'font-weight': '700' }), forced: style({ 'font-weight': '700' }) },
    sibling: { normal: style(), forced: style() },
  }), [], 'a weight forced colors keeps still shows the state');

  // The common case: the current item is shown by a background fill. Forced colors paints it with Canvas and keeps
  // its alpha, so the strings differ while both items look the same.
  assert.deepEqual(kinds(stateLostFindings({
    selector: 'a[aria-current="page"]', state: '[aria-current="page"]',
    element: { normal: style({ 'background-color': 'rgb(26, 86, 219)', color: 'rgb(255, 255, 255)' }),
      forced: style({ 'background-color': 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', behind: 'rgb(255, 255, 255)' }) },
    sibling: { normal: style({ 'background-color': 'rgba(0, 0, 0, 0)' }),
      forced: style({ 'background-color': 'rgba(255, 255, 255, 0)', color: 'rgb(0, 0, 0)', behind: 'rgb(255, 255, 255)' }) },
  })), ['state-lost-in-forced-colors'], 'a transparent background paints what is behind it');
  assert.deepEqual(kinds(stateLostFindings({
    selector: 'a[aria-current="page"]', state: '[aria-current="page"]',
    element: { normal: style({ 'border-left-color': 'rgb(26, 86, 219)', 'border-left-width': '3px' }),
      forced: style({ 'border-left-color': 'rgb(0, 0, 0)', 'border-left-width': '3px' }) },
    sibling: { normal: style({ 'border-left-color': 'rgb(200, 200, 200)', 'border-left-width': '0px' }),
      forced: style({ 'border-left-color': 'rgb(0, 0, 0)', 'border-left-width': '0px' }) },
  })), [], 'a border forced colors keeps still shows the state');
  assert.deepEqual(kinds(stateLostFindings({
    selector: 'a[aria-current="page"]', state: '[aria-current="page"]',
    element: { normal: style({ 'border-left-color': 'rgb(26, 86, 219)' }), forced: style({ 'border-left-color': 'rgb(0, 0, 0)' }) },
    sibling: { normal: style({ 'border-left-color': 'rgb(200, 200, 200)' }), forced: style({ 'border-left-color': 'rgb(255, 255, 255)' }) },
  })), [], 'with no border width the colors differ in the strings only, so the item never looked different');
});

test('2.4.7: the focus capture covers a ring that stands past the margin, and a ring an ancestor draws', () => {
  const box = { x: 100, y: 40, width: 171, height: 24 };
  const solid = (width, offset) => ({ style: 'solid', width, offset });
  const none = { style: 'none', width: 0, offset: 0 };

  assert.equal(outlineReach(solid(2, 4)), 6, 'an outline 4 px off and 2 px wide reaches 6 px past the box');
  assert.equal(outlineReach(solid(2, -4)), 0, 'an inset outline reaches no further than the box');
  assert.equal(outlineReach({ style: 'none', width: 3, offset: 0 }), 0, 'an outline that does not show reaches nothing');
  assert.equal(outlineReach({ style: 'hidden', width: 3, offset: 2 }), 0);
  assert.equal(outlineReach(solid(0, 4)), 0);
  assert.equal(shadowReach('rgb(255, 255, 255) 0px 0px 0px 2px, rgb(26, 66, 232) 0px 0px 0px 6px'), 6,
    'a ring drawn with shadows: the furthest layer');
  assert.equal(shadowReach('rgba(0, 0, 0, 0.1) 0px 4px 8px 0px'), 12, 'an offset and a blur reach out too');
  assert.equal(shadowReach('rgb(26, 66, 232) 0px 0px 0px 2px inset'), 0, 'an inset shadow draws inside the box');
  assert.equal(shadowReach('none'), 0);
  assert.deepEqual(focusExtent({ box, outline: solid(2, 4) }), { x: 94, y: 34, width: 183, height: 36 },
    'the logo\'s ring, 4 to 6 px out: inside the area once it is grown by the margin');
  assert.deepEqual(focusExtent({ box, outline: none, shadow: 'rgb(26, 66, 232) 0px 0px 0px 6px' }),
    { x: 94, y: 34, width: 183, height: 36 }, 'a shadow ring reaches as far as an outline');
  assert.deepEqual(focusExtent({ box, outline: none }), box, 'no ring: the box itself, as before');

  const card = { box: { x: 16, y: 400, width: 806, height: 395 }, outline: solid(2, 2) };

  assert.deepEqual(focusExtent({ box: { x: 62, y: 477, width: 324, height: 51 }, outline: none }, [card]),
    { x: 12, y: 396, width: 814, height: 403 }, 'a title link whose card draws the ring: the card and its ring');
});

test('2.4.7: a ring the focus drew on another part counts; a color, a popup or a ring always there does not', () => {
  const box = { x: 16, y: 400, width: 806, height: 395 };
  const ring = { style: 'solid', width: 2, offset: 2, color: 'rgb(26, 66, 232)' };
  const none = { style: 'none', width: 2, offset: 0, color: 'rgb(0, 0, 0)' };
  const part = (outline, shadow = 'none', at = box) => ({ box: at, outline, shadow });

  assert.deepEqual(changedRings([part(ring)], [part(none)]), [part(ring)], 'a card ringed only while its link has the focus');
  assert.deepEqual(changedRings([part(none, 'rgb(26, 66, 232) 0px 0px 0px 2px')], [part(none)]).length, 1,
    'a ring drawn with a shadow counts too');
  assert.deepEqual(changedRings([part({ ...none, color: 'rgb(255, 0, 0)' })], [part(none)]), [],
    'a wrapper whose text color changes through :focus-within draws no ring');
  assert.deepEqual(changedRings([part(ring)], [part(ring)]), [], 'a ring the part always has is not the indicator');
  assert.deepEqual(changedRings([part(none, 'rgba(0, 0, 0, 0.08) 0px 24px 60px 0px', { ...box, height: 120 })],
    [part(none, 'none', { ...box, height: 0 })]), [], 'a popup that opens with the focus is not a ring');
  assert.deepEqual(changedRings([null, part(ring)], [null, part(none)]), [part(ring)], 'a part not rendered is skipped');

  const lifted = part(none, 'rgb(26, 66, 232) 0px 0px 0px 6px', { ...box, y: box.y - 2 });

  assert.deepEqual(changedRings([lifted], [part(none)]), [lifted], 'a card that lifts 2 px as it is ringed is still ringed');
  assert.deepEqual(changedRings([part(none, 'rgba(0, 0, 0, 0.08) 0px 24px 60px 0px', { ...box, height: box.height + 200 })],
    [part(none)]), [], 'a wrapper that grows by a popup opening inside it is not a ring');

  const overlay = { ...part(ring, 'none', { x: 17, y: 401, width: 804, height: 393 }), pseudo: {} };

  assert.deepEqual(changedRings([overlay], [null]), [overlay], 'an overlay drawn only with the focus is the ring itself');
});

test('2.4.7: an absolutely placed pseudo-element is placed from its containing block', () => {
  assert.deepEqual(pseudoRingBox({ x: 16, y: 400, clientLeft: 1, clientTop: 1 }, { left: '0px', top: '0px', width: '804px', height: '393px' }),
    { x: 17, y: 401, width: 804, height: 393 }, 'a link\'s overlay stretched over its card, inside the card\'s border');
  assert.deepEqual(pseudoRingBox(null, { left: '10px', top: '20px', width: '30px', height: '40px' }),
    { x: 10, y: 20, width: 30, height: 40 }, 'a fixed one: the viewport');
  assert.deepEqual(pseudoRingBox({ x: 5, y: 5, clientLeft: 0, clientTop: 0 }, { left: 'auto', top: 'auto', width: '1px', height: '1px' }),
    { x: 5, y: 5, width: 1, height: 1 }, 'an offset that is not a length places it at the corner');
});

test('1.4.11: a field\'s 1 px edge is read where the capture holds it, wherever its box starts', () => {
  // The footer field of the audit: its top at 618.67 on a black band, a blue-200 underline on its last row. The area
  // grown 4 px around it starts at 614.67, and the capture starts at pixel 614.
  const area = { x: 20.4, y: 614.67 };
  const box = { x: 24.4, y: 618.67, width: 40, height: 20 };
  const width = 50;
  const height = 30;
  const data = [];
  // The underline paints the page row 618.67 + 20 - 1 rounds to, 638; the capture's row 0 is page row 614.
  const line = Math.round(box.y + box.height) - 1 - 614;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const under = y === line && x >= 5 && x < 44;

      data.push(...(under ? [108, 161, 248] : [3, 4, 4]), 255);
    }
  }

  const image = { width, height, data };

  assert.deepEqual(boxInCapture(box, area), { x: 24.4 - 20, y: 618.67 - 614, width: 40, height: 20 });
  assert.ok(boundaryOf(image, boxInCapture(box, area)).boundary.ratio > 3, 'placed from pixel 614, the edge band holds the underline');
  assert.ok(boundaryOf(image, { x: box.x - area.x, y: box.y - area.y, width: 40, height: 20 }).boundary.ratio < 1.1,
    'placed from 614.67, the band missed it: the audit\'s 1.04:1');
  assert.deepEqual(pixelBox({ x: 4.4, y: 4.67, width: 40, height: 20 }), { x: 4, y: 4, width: 41, height: 21 });
});
