import { test, expect } from '../fixtures/test';
import { ShadowGridPage } from '../fixtures/pages/ShadowGridPage';

/**
 * Shadow DOM embedding (DEV-1619). When the grid lives inside a native shadow
 * root, document-level listeners see events retargeted to the shadow host and
 * `document.activeElement` reports the host instead of the focused element.
 * Before the fix, every in-grid click was misclassified as an outside click:
 * the open editor closed, the selection dropped, and the grid stopped
 * listening. These tests drive the real interactions across the boundary.
 */
test.describe('grid inside a native shadow root', () => {
  let grid: ShadowGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ShadowGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('isolates the internal z-index stack from the host page', async () => {
    const wrapper = grid.page.locator('.ht-root-wrapper');

    await expect(wrapper).toHaveClass(/ht-shadow-dom/);
    await expect(wrapper).toHaveCSS('isolation', 'isolate');
  });

  test('keeps the editor open when its textarea is clicked', async () => {
    await grid.openEditor(1, 0);

    await grid.editor().click();

    await expect(grid.editor()).toBeVisible();
    expect(await grid.isListening()).toBe(true);

    await grid.editor().fill('edited in shadow');
    await grid.editor().press('Enter');
    await grid.expectCell(1, 0, 'edited in shadow');
  });

  test('moves the selection between cells without dropping the keyboard listener', async () => {
    await grid.cell(0, 0).click();
    await grid.cell(2, 1).click();

    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);
    expect(await grid.isListening()).toBe(true);

    await grid.page.keyboard.type('typed');
    await grid.page.keyboard.press('Enter');
    await grid.expectCell(2, 1, 'typed');
  });

  test('copies and pastes between cells with keyboard shortcuts', async () => {
    await grid.cell(0, 0).click();
    await grid.page.keyboard.press('ControlOrMeta+c');

    await grid.cell(4, 2).click();
    await grid.page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(4, 2, 'A1');
    // Under the default delivery mode the events do travel out to the document. This is the
    // positive control for the recorder the `lws-shape` tests below assert stays empty.
    expect(await grid.clipboardEventsSeenAtDocument()).toContain('paste');
    // This is also the mode where all three listeners see the event, so it is where a broken
    // event registry would show up as the plugin pasting more than once.
    expect(await grid.pasteHookCalls()).toBe(1);
  });

  test('does not steal focus back when typing into an input outside the shadow host', async () => {
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.outsideInput.click();
    await grid.page.keyboard.type('typed outside');

    await expect(grid.outsideInput).toHaveValue('typed outside');
    await expect(grid.outsideInput).toBeFocused();
    await grid.expectCell(0, 0, 'A1');
  });

  test('executes a context menu action on the selection that opened it', async () => {
    await grid.cell(1, 0).click({ button: 'right' });

    const menuItem = grid.page.locator('.htContextMenu').getByText('Insert row below', { exact: true });

    await menuItem.click();

    await expect(grid.page.locator('.ht_master .htCore tbody tr')).toHaveCount(6);
  });

  test('deselects when a non-focusable sibling in the same shadow root is clicked', async () => {
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.shadowSibling.click();

    await expect.poll(() => grid.selected()).toBeNull();
  });

  test('passes the clicked element to the outsideClickDeselects callback when focus moves elsewhere', async () => {
    await grid.armOutsideClickRecorder();
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.focusMover.click();

    await expect(grid.outsideInput).toBeFocused();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
    expect(await grid.outsideClickTargets()).toEqual(['focus-mover']);
  });

  test('deselects when a light-DOM element outside the shadow host is clicked', async () => {
    await grid.cell(0, 0).click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.outsideTextarea.click();

    await expect.poll(() => grid.selected()).toBeNull();
  });
});

/**
 * Clipboard events shaped the way Salesforce Lightning Web Security shapes them (DEV-2795,
 * #13388). LWS hands them only to listeners bound at or below the grid's own element, so the
 * two binding points CopyPaste had — the document and the grid's shadow root — both went
 * unused and copy, cut and paste silently did nothing in a Lightning Web Component. It also
 * collapses `composedPath()` to the shadow host chain, which is what makes the plugin resolve
 * the event's source from the retargeted `target` instead. The fixture reproduces both.
 *
 * These tests cover that shape, not LWS itself: a real org also runs the grid behind a sandbox
 * membrane, which no fixture here can stand in for.
 */
test.describe('grid whose clipboard events arrive the way LWS delivers them', () => {
  let grid: ShadowGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ShadowGridPage(page, theme, bundle, 'lws-shape');
    await grid.goto();
  });

  // C3 is copied by no other test in this file. The browser clipboard outlives a test — each
  // test gets a fresh context, not a fresh clipboard — so reusing a value an earlier test
  // copied would let a broken copy still paste that leftover and pass.
  test('copies and pastes between cells with keyboard shortcuts', async () => {
    await grid.cell(2, 2).click();
    await grid.page.keyboard.press('ControlOrMeta+c');

    await grid.cell(4, 0).click();
    await grid.page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(4, 0, 'C3');
    // The paste landed without the document ever seeing the event, so only a listener bound
    // at or below the container can have driven it.
    expect(await grid.clipboardEventsSeenAtDocument()).toEqual([]);
    expect(await grid.pasteHookCalls()).toBe(1);
  });

  test('cuts and pastes between cells with keyboard shortcuts', async () => {
    await grid.cell(0, 1).click();
    await grid.page.keyboard.press('ControlOrMeta+x');

    await grid.expectCell(0, 1, '');

    await grid.cell(3, 0).click();
    await grid.page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(3, 0, 'B1');
    expect(await grid.clipboardEventsSeenAtDocument()).toEqual([]);
    expect(await grid.pasteHookCalls()).toBe(1);
  });
});
