import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { PasteParseHookPage, type HookBehavior } from '../fixtures/pages/PasteParseHookPage';
import { ShadowGridPage } from '../fixtures/pages/ShadowGridPage';

/**
 * The `beforePasteParse` hook of the CopyPaste plugin (DEV-2930). It fires inside `onPaste()`, before
 * anything is sanitized or parsed, and hands the callbacks a writable copy of the clipboard.
 *
 * Every case here is a real paste: a trusted `paste` event from `ControlOrMeta+v`, with the content on
 * the real clipboard. A synthetic event could not carry a read-only `DataTransfer` the way the browser
 * does, which is the whole reason the hook exists. The browser clipboard outlives a test (a test gets a
 * fresh context, not a fresh clipboard), so each case writes a value no other case in this file uses:
 * a paste that silently did nothing would otherwise land a leftover and pass.
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const PRIVATE_FLAVOR = 'application/ht-source-data-json-html';

async function openFixture(
  page: Page,
  theme: string,
  bundle: string,
  behavior: HookBehavior = 'observe',
): Promise<PasteParseHookPage> {
  const grid = new PasteParseHookPage(page, theme, bundle, behavior);

  await grid.goto();

  return grid;
}

test.describe('beforePasteParse', () => {
  test('fires exactly once per paste', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle);

    await grid.cell(3, 0).click();
    await grid.writeClipboardText('ONCE-3301');
    await grid.paste();

    await grid.expectCell(3, 0, 'ONCE-3301');
    // The plugin is reached through several listeners (document and the grid's own element), and
    // only its event registry keeps the paste, and so the hook, from running more than once.
    await expect.poll(async() => (await grid.hookCalls()).length).toBe(1);
    expect(await grid.pasteHookCounts()).toEqual({ beforePaste: 1, afterPaste: 1 });
  });

  test('receives the native paste event and a snapshot of both flavors', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle);

    await grid.cell(0, 0).click();
    await grid.writeClipboardHtml('<table><tr><td>RECV-HTML-4417</td></tr></table>', 'RECV-PLAIN-4417');
    await grid.paste();

    // The html flavor wins over the plain one, so the cell shows which flavor the plugin consumed.
    await grid.expectCell(0, 0, 'RECV-HTML-4417');

    const [call] = await grid.hookCalls();

    expect(call.eventIsNull).toBe(false);
    expect(call.eventIsClipboardEvent).toBe(true);
    expect(call.eventType).toBe('paste');
    expect(call.types).toEqual(expect.arrayContaining(['text/plain', 'text/html']));
    expect(call.plain).toBe('RECV-PLAIN-4417');
    expect(call.html).toContain('RECV-HTML-4417');
  });

  test('lands plain text a callback cleaned when it also clears the html flavor', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'clean-number');

    await grid.cell(1, 1).click();
    // A spreadsheet puts the same regional number in both flavors, and the table wins unless the
    // callback clears it.
    await grid.writeClipboardHtml('<table><tr><td>2 345,67</td></tr></table>', '2 345,67');
    await grid.paste();

    await grid.expectCell(1, 1, '2345.67');
    // The callback saw the regional format, so the change is the callback's and not the clipboard's.
    expect((await grid.hookCalls())[0].plain).toBe('2 345,67');
  });

  test('lands the html table a callback edited', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'edit-html');

    await grid.cell(2, 0).click();
    await grid.writeClipboardHtml('<table><tr><td>ORIG-HTML-6105</td></tr></table>', 'ORIG-PLAIN-6105');
    await grid.paste();

    await grid.expectCell(2, 0, 'HTML-EDITED-5530');
    expect((await grid.hookCalls())[0].html).toContain('ORIG-HTML-6105');
  });

  test('writes nothing and skips beforePaste and afterPaste when a callback returns false', async({
    page,
    theme,
    bundle,
  }) => {
    const grid = await openFixture(page, theme, bundle, 'cancel');

    await grid.cell(2, 2).click();
    await grid.writeClipboardText('CANCELED-7720');
    await grid.paste();

    // Positive control: the hook ran, so the untouched cell below is a cancel and not a missed paste.
    await expect.poll(async() => (await grid.hookCalls()).length).toBe(1);
    await grid.expectCell(2, 2, 'C3');
    expect(await grid.pasteHookCounts()).toEqual({ beforePaste: 0, afterPaste: 0 });
  });

  test.describe('does not fire', () => {
    test('with a cell editor open, and the editor receives the text', async({ page, theme, bundle }) => {
      const grid = await openFixture(page, theme, bundle);

      await grid.openEditor(0, 1);
      await grid.page.keyboard.press('ControlOrMeta+a');
      await grid.writeClipboardText('EDITOR-9120');
      await grid.paste();

      // Positive control: the paste reached the page, and went to the editor input.
      await expect(grid.editor()).toHaveValue('EDITOR-9120');
      expect(await grid.hookCalls()).toEqual([]);

      // Same selection, editor closed: now the hook is live, which shows the counter works.
      await grid.page.keyboard.press('Escape');
      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      await grid.paste();

      await grid.expectCell(0, 1, 'EDITOR-9120');
      await expect.poll(async() => (await grid.hookCalls()).length).toBe(1);
    });

    test('when the grid is not listening', async({ page, theme, bundle }) => {
      const grid = await openFixture(page, theme, bundle);

      await grid.cell(4, 1).click();
      await grid.outsideTextarea.click();
      await expect(grid.outsideTextarea).toBeFocused();
      // The fixture keeps the selection on an outside click, so listening is the only thing that
      // changed, and it is what the plugin's guard reads.
      expect(await grid.isListening()).toBe(false);
      expect(await grid.selected()).toEqual([[4, 1, 4, 1]]);

      await grid.writeClipboardText('UNLISTENED-5043');
      await grid.paste();

      // Positive control: the paste went to the textarea, so the event was delivered.
      await expect(grid.outsideTextarea).toHaveValue('UNLISTENED-5043');
      expect(await grid.hookCalls()).toEqual([]);
      await grid.expectCell(4, 1, 'B5');

      // Listening again, the same paste is handled. A different cell is clicked: a second click on
      // the already selected cell did not hand the paste back to the grid in this fixture.
      await grid.cell(4, 2).click();
      await expect.poll(() => grid.isListening()).toBe(true);
      await grid.paste();

      await grid.expectCell(4, 2, 'UNLISTENED-5043');
      await expect.poll(async() => (await grid.hookCalls()).length).toBe(1);
    });

    test('on the grid that is not the active one', async({ page, theme, bundle }) => {
      const grid = await openFixture(page, theme, bundle);

      await grid.cell(0, 0).click();
      await grid.writeClipboardText('FIRST-GRID-8310');
      await grid.paste();

      await grid.expectCell(0, 0, 'FIRST-GRID-8310');
      await expect.poll(async() => (await grid.hookCalls('a')).length).toBe(1);
      expect(await grid.hookCalls('b')).toEqual([]);
      await expect(grid.cellB(0, 0)).toHaveText('A1');

      // Switch the other way round: the second grid handles the next paste and the first stays at one.
      await grid.cellB(0, 1).click();
      await grid.writeClipboardText('SECOND-GRID-8310');
      await grid.paste();

      await expect(grid.cellB(0, 1)).toHaveText('SECOND-GRID-8310');
      await expect.poll(async() => (await grid.hookCalls('b')).length).toBe(1);
      expect(await grid.hookCalls('a')).toHaveLength(1);
    });
  });

  test.describe('private source-data flavor of an internal copy', () => {
    // Column 3 has `parsePastedValue`, and its rows 0 and 1 hold objects. A cell shows an object as
    // `[object Object]`, so the pasted text alone cannot rebuild it: only the private flavor can.

    test('is dropped when a callback edits the plain text, so the edit lands and not the old object', async({
      page,
      theme,
      bundle,
    }) => {
      const grid = await openFixture(page, theme, bundle, 'replace-text');

      await grid.cell(0, 3).click();
      await grid.copy();
      await grid.cell(2, 3).click();
      await grid.paste();

      await grid.expectCell(2, 3, 'PLAIN-EDITED-7791');
      expect(await grid.sourceCell(2, 3)).toBe('PLAIN-EDITED-7791');
      // The private flavor was on the paste, so dropping it is what the assertion above depends on.
      expect((await grid.hookCalls())[0].types).toContain(PRIVATE_FLAVOR);
    });

    test('restores the copied object when no callback edits anything (control)', async({ page, theme, bundle }) => {
      const grid = await openFixture(page, theme, bundle, 'observe');

      await grid.cell(1, 3).click();
      await grid.copy();
      await grid.cell(3, 3).click();
      await grid.paste();

      expect(await grid.sourceCell(3, 3)).toEqual({ id: 2, value: 'OBJ-2' });
      expect((await grid.hookCalls())[0].types).toContain(PRIVATE_FLAVOR);
    });
  });

  test('still runs the sanitizer on html a callback edited', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'edit-html-xss');

    await grid.cell(1, 0).click();
    await grid.writeClipboardHtml('<table><tr><td>ORIG-XSS-3318</td></tr></table>', 'ORIG-XSS-3318');
    await grid.paste();

    // The sanitizer strips the `<img>` the callback added, so the cell shows what is left of it.
    await grid.expectCell(1, 0, 'SAFE-Z');

    const htmlCalls = (await grid.sanitizerCalls()).filter(([context]) => context === 'CopyPaste.paste');

    expect(htmlCalls.some(([, content]) => content.includes('SAFE-<img'))).toBe(true);
    expect(htmlCalls.some(([, content]) => content.includes('ORIG-XSS-3318'))).toBe(false);
  });

  test('fires with a null event for the paste() method of the plugin', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle);

    await grid.cell(0, 2).click();
    await grid.pasteThroughPlugin('PLUGIN-6620');

    await grid.expectCell(0, 2, 'PLUGIN-6620');

    const calls = await grid.hookCalls();

    expect(calls).toHaveLength(1);
    expect(calls[0].eventIsNull).toBe(true);
    expect(calls[0].eventIsClipboardEvent).toBe(false);
    expect(calls[0].plain).toBe('PLUGIN-6620');
  });

  test('gives every callback the same snapshot', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'two-callbacks');

    await grid.cell(3, 2).click();
    await grid.writeClipboardText('TWO-CALLBACKS-2049');
    await grid.paste();

    // The first callback replaced the text, and the second one read that replacement and appended.
    await grid.expectCell(3, 2, 'FIRST-8842+SECOND-8842');
    expect(await grid.secondCallbackSaw()).toEqual(['FIRST-8842']);
  });
});

/**
 * The plugin gets the event through different listeners in a shadow root and under Lightning Web
 * Security (the `lws-shape` delivery of the shadow fixture reproduces how LWS routes it), and the hook
 * must still fire once there.
 */
for (const delivery of ['normal', 'lws-shape'] as const) {
  test.describe(`beforePasteParse in a shadow root, ${delivery} delivery`, () => {
    test('fires exactly once per paste with the native event', async({ page, theme, bundle }) => {
      const grid = new ShadowGridPage(page, theme, bundle, delivery);
      const pasted = `SHADOW-${delivery.toUpperCase()}-4471`;

      await grid.goto();
      await grid.cell(3, 1).click();
      await grid.writeClipboardText(pasted);
      await grid.page.keyboard.press('ControlOrMeta+v');

      await grid.expectCell(3, 1, pasted);

      const calls = await grid.beforePasteParseCalls();

      expect(calls).toHaveLength(1);
      expect(calls[0].eventType).toBe('paste');
      expect(calls[0].eventIsClipboardEvent).toBe(true);
      expect(calls[0].plain).toBe(pasted);
      // The same paste reached the plugin once, however many listeners saw it.
      expect(await grid.pasteHookCalls()).toBe(1);
    });
  });
}
