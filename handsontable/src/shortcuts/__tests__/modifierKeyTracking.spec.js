describe('ShortcutManager modifier-key tracking across instances (#12707)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.iframeHot) {
      this.iframeHot.destroy();
      this.iframeHot = null;
    }

    if (this.$iframe) {
      this.$iframe.remove();
      this.$iframe = null;
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  /**
   * Spawns a second Handsontable instance inside its own iframe document and returns the instance
   * together with the iframe document. Tracks the iframe on the spec context for teardown.
   *
   * @returns {Promise<{ iframeHot: object, doc: Document }>}
   */
  async function createGridInIframe() {
    const $iframe = $('<iframe width="300px" height="200px"/>').appendTo(spec().$container);

    spec().$iframe = $iframe;

    const doc = $iframe[0].contentDocument;

    doc.open('text/html', 'replace');
    doc.write(`
      <!doctype html>
      <head>
        ${getE2eNormalizeStylesheetLinkTagHtml()}
        ${getE2eThemeStylesheetLinkTagsHtml()}
      </head>`);
    doc.close();

    const $iframeContainer = $('<div/>').appendTo(doc.body);

    await sleep(50);

    $iframeContainer.handsontable({ data: createSpreadsheetData(5, 5) });

    const iframeHot = $iframeContainer.handsontable('getInstance');

    spec().iframeHot = iframeHot;

    return { iframeHot, doc };
  }

  it('should observe a Ctrl/Cmd keypress for a grid that is not the first instance (separate iframe)', async() => {
    // The first instance lives in the main document and owns the legacy modifier listeners.
    handsontable({ data: createSpreadsheetData(5, 5) });

    const { iframeHot, doc } = await createGridInIframe();

    await keyDown('control/meta', { target: doc.documentElement });

    expect(iframeHot.getShortcutManager().isCtrlPressed()).toBe(true);

    await keyUp('control/meta', { target: doc.documentElement });
  });

  it('should extend the selection on Ctrl/Cmd+click in a grid that is not the first instance (separate iframe)', async() => {
    handsontable({ data: createSpreadsheetData(5, 5) });

    const { iframeHot, doc } = await createGridInIframe();

    // Establish an initial selection in the iframe grid.
    await iframeHot.selectCell(3, 3);

    // Hold Ctrl/Cmd while the modifier keydown is delivered to the iframe document, then click
    // another cell. The additive decision is made from the tracked modifier state, not the mouse
    // event, so the iframe instance must observe the keydown delivered to its own document.
    await keyDown('control/meta', { target: doc.documentElement });
    await mouseDown(iframeHot.getCell(0, 0));
    await mouseUp(iframeHot.getCell(0, 0));
    await keyUp('control/meta', { target: doc.documentElement });

    // Additive selection: the Ctrl/Cmd+click adds a range instead of replacing it.
    expect(iframeHot.getSelectedRange()).toEqualCellRange([
      'highlight: 3,3 from: 3,3 to: 3,3',
      'highlight: 0,0 from: 0,0 to: 0,0',
    ]);
  });
});
