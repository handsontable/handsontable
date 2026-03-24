import ExcelJS from 'exceljs';

describe('ExportFile', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('i18n', () => {
    // Phrases are hardcoded intentionally — the test verifies that the plugin
    // resolves translations at runtime against the active locale, not that the
    // locale files are correct (locale files are covered by their own tests).
    const LANGUAGES = [
      {
        code: 'en-US',
        exportMenuLabel: 'Export',
        csvSubmenuLabel: 'To CSV',
        dialogTitle: 'Exporting\u2026',
      },
      {
        code: 'pl-PL',
        exportMenuLabel: 'Eksportuj',
        csvSubmenuLabel: 'Do CSV',
        dialogTitle: 'Eksportowanie\u2026',
      },
      {
        code: 'de-DE',
        exportMenuLabel: 'Exportieren',
        csvSubmenuLabel: 'Als CSV',
        dialogTitle: 'Wird exportiert\u2026',
      },
      {
        code: 'fr-FR',
        exportMenuLabel: 'Exporter',
        csvSubmenuLabel: 'En CSV',
        dialogTitle: 'Exportation\u2026',
      },
    ];

    LANGUAGES.forEach(({ code, exportMenuLabel, csvSubmenuLabel, dialogTitle }) => {
      describe(`language: ${code}`, () => {
        it('should display the translated "Export" parent item in the context menu', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            contextMenu: true,
            exportFile: true,
            language: code,
          });

          await contextMenu(getCell(1, 1));

          const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
            return $(this).text();
          }).get();

          expect(items).toContain(exportMenuLabel);
        });

        it('should display the translated "To CSV" label in the Export submenu', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            contextMenu: true,
            exportFile: true,
            language: code,
          });

          await contextMenu(getCell(1, 1));

          await openContextSubmenuOption(exportMenuLabel);
          await sleep(300);

          const submenuItems = $(`.htContextMenuSub_${exportMenuLabel} tbody td`).map(function() {
            return $(this).text();
          }).get();

          expect(submenuItems).toContain(csvSubmenuLabel);
        });

        it('should display the translated dialog title when the export overlay is shown', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            contextMenu: true,
            loading: true,
            exportFile: { engines: { xlsx: ExcelJS } },
            language: code,
          });

          // Intercept the browser download so no file is written to disk.
          // URL.createObjectURL / revokeObjectURL are stubbed out; the anchor's
          // dispatchEvent is also no-oped so the fake URL is never followed.
          const hotInstance = hot();

          spyOn(hotInstance.rootWindow.URL, 'createObjectURL').and.returnValue('blob:mock');
          spyOn(hotInstance.rootWindow.URL, 'revokeObjectURL');

          const origCreateElement = hotInstance.rootDocument.createElement.bind(hotInstance.rootDocument);

          spyOn(hotInstance.rootDocument, 'createElement').and.callFake((tag) => {
            const el = origCreateElement(tag);

            if (tag === 'a') {
              spyOn(el, 'dispatchEvent'); // suppress the click that triggers the download
            }

            return el;
          });

          // downloadFile() calls dialogPlugin.show() synchronously before scheduling
          // the actual export via requestAnimationFrame. The dialog title can therefore
          // be read from the DOM immediately after the call, before the rAF fires.
          const downloadPromise = getPlugin('exportFile').downloadFileAsync('xlsx', { filename: 'test' });

          const titleEl = getLoadingContainerElement()?.querySelector('.ht-loading__title');

          expect(titleEl?.textContent).toBe(dialogTitle);

          await downloadPromise;
        });
      });
    });
  });
});
