describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan']
      }
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function extractDOMStructure(overlaysTHead, overlaysTBody) {
    const cloneTHeadOverlay = overlaysTHead.find('thead')[0].cloneNode(true);
    const cellsRow = overlaysTBody ? overlaysTBody.find('tbody tr')[0].cloneNode(true).outerHTML : '';

    Array.from(cloneTHeadOverlay.querySelectorAll('th')).forEach((TH) => {
      if (TH.querySelector('.collapsibleIndicator')) {
        TH.classList.add('collapsibleIndicator');
      }
      if (TH.querySelector('.collapsed')) {
        TH.classList.add('collapsed');
      }
      if (TH.querySelector('.expanded')) {
        TH.classList.add('expanded');
      }

      // Simplify header content
      TH.innerText = TH.querySelector('.colHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${cloneTHeadOverlay.outerHTML}${cellsRow ? `<tbody>${cellsRow}</tbody>` : ''}`;
  }

  describe('CollapsibleColumns plugin', () => {
    describe('with HiddenColumns plugin', () => {
      // Regression test for DEV-294: the old hideColumn.js/showColumn.js node modifiers had a
      // "collapsible guard" that silently dropped external hides when any ancestor header had
      // collapsible:true. The new syncVisibilityOnTree approach derives visibility from the
      // column index mapper directly, so HiddenColumns hides always apply regardless of whether
      // collapsibleColumns is active.
      it('should apply HiddenColumns hide under a collapsible header (DEV-294)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          hiddenColumns: true,
        });

        getPlugin('hiddenColumns').hideColumn(2); // Hide C (visual col 2, inside B group)
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">D</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
      });

      it('should apply initial hiddenColumns configuration under a collapsible header', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          hiddenColumns: {
            columns: [2], // Hide C (visual col 2, inside B group)
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">D</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
      });

      it('should collapse a header that has a column hidden via HiddenColumns', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          hiddenColumns: {
            columns: [2], // Hide C (visual col 2, inside B group)
          },
        });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator collapsed">B</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
      });

      it('should keep a HiddenColumns-hidden column hidden after collapse and expand', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          hiddenColumns: {
            columns: [2], // Hide C (visual col 2, inside B group)
          },
        });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();
        getPlugin('collapsibleColumns').expandSection({ row: -2, col: 1 });
        await render();

        // C (col 2) must remain hidden after expand — it was hidden by HiddenColumns, not by collapse
        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">D</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
      });

      it('should keep a column hidden by HiddenColumns after collapsing and expanding its parent header', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          hiddenColumns: true,
        });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        getPlugin('hiddenColumns').hideColumn(3); // Hide D (visual col 3) while B is collapsed
        await render();

        getPlugin('collapsibleColumns').expandSection({ row: -2, col: 1 });
        await render();

        // D (col 3) must remain hidden after expand — it was hidden by HiddenColumns, not by collapse
        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">C</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="afterHiddenColumn">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
      });
    });

    // Reads the rendered `colspan` of the first header TH whose label matches `label`,
    // looking inside the passed overlay clone. Returns 1 when no colspan attribute is set.
    function getHeaderColspan($clone, label) {
      const th = Array.from($clone.find('thead th')).find((cell) => {
        const header = cell.querySelector('.colHeader');

        return header && header.innerText === label;
      });

      if (!th) {
        return null;
      }

      return parseInt(th.getAttribute('colspan'), 10) || 1;
    }

    describe('with ManualColumnMove + HiddenColumns (full client combo, DEV-294)', () => {
      // The reported client case (dev-handsontable #500): NestedHeaders + CollapsibleColumns +
      // ManualColumnMove + HiddenColumns together. With collapsibleColumns enabled, a column hidden
      // inside a group used to leave the group's colspan unreduced (colspan 3 over 2 visible columns),
      // shifting every header to its right off its data column.
      it('should render the correct group colspan with all four plugins active', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          manualColumnMove: true,
          hiddenColumns: {
            columns: [2], // Hide C (visual col 2, inside B group)
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">D</th>
              <th class="">E</th>
              <th class="">F</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
      });

      it('should keep the group colspan correct after moving an outer column', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          manualColumnMove: true,
          hiddenColumns: {
            columns: [2], // Hide C (visual col 2, inside B group)
          },
        });

        // Move the single-column "F" group (visual col 5) to the front.
        getPlugin('manualColumnMove').moveColumn(5, 0);
        await render();

        // Confirm the move actually took effect: F's data now sits in the first visual column.
        expect(getDataAtCell(0, 0)).toBe('F1');
        // The B group still spans its three original columns with one hidden, so its rendered
        // colspan must remain 2 even though the group now sits at a different visual position.
        expect(getHeaderColspan(getTopClone(), 'B')).toBe(2);
        // The body keeps 5 visible columns and the header row stays aligned with it.
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(5);
      });
    });

    describe('with fixedColumnsStart + HiddenColumns (frozen overlay, DEV-294)', () => {
      // The frozen overlay clamps a group's colspan to the frozen region
      // (Math.min(colspan, fixedColumnsStart - renderedColumnIndex)). That clamp must consume the
      // colspan derived from the current visibility, not the original colspan.
      it('should clamp the derived group colspan inside the frozen overlay', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F'],
            ['A', 'B', 'C', 'D', 'E', 'F'],
          ],
          collapsibleColumns: true,
          fixedColumnsStart: 3,
          hiddenColumns: {
            columns: [2], // Hide C (visual col 2, inside B group)
          },
        });

        // Frozen region = visual cols 0,1,2; col 2 is hidden, so 2 renderable frozen columns (A, B).
        // Inside the frozen overlay the B group can only show its first visible child, so colspan 1.
        // Headers live in the top-left corner clone; the frozen body cells live in the left clone.
        expect(getHeaderColspan(getTopInlineStartClone(), 'B')).toBe(1);
        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

        // In the (unfrozen) master the full group still renders at the derived colspan 2.
        expect(getHeaderColspan(getTopClone(), 'B')).toBe(2);
      });
    });

    describe('with nested groups (first child is a group, DEV-294)', () => {
      // A column hidden inside a nested structure (group B nested in group A). The derivation must
      // reduce every ancestor's colspan from one visibility source, regardless of nesting depth.
      it('should derive colspan correctly for a hidden column in a nested group', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          nestedHeaders: [
            [{ label: 'A', colspan: 4 }, 'E'],
            [{ label: 'B', colspan: 2 }, { label: 'C', colspan: 2 }, 'E'],
            ['B1', 'B2', 'C1', 'C2', 'E'],
          ],
          collapsibleColumns: true,
          hiddenColumns: {
            columns: [1], // Hide B2 (visual col 1, inside nested group B inside group A)
          },
        });

        // A spans 4 original columns, one hidden -> colspan 3. B spans 2, one hidden -> colspan 1.
        expect(getHeaderColspan(getTopClone(), 'A')).toBe(3);
        expect(getHeaderColspan(getTopClone(), 'B')).toBe(1);
        expect(getHeaderColspan(getTopClone(), 'C')).toBe(2);
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(4);
      });

      it('should collapse a group whose first child is a group, with a column hidden inside it', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          nestedHeaders: [
            [{ label: 'A', colspan: 4 }, 'E'],
            [{ label: 'B', colspan: 2 }, { label: 'C', colspan: 2 }, 'E'],
            ['B1', 'B2', 'C1', 'C2', 'E'],
          ],
          collapsibleColumns: true,
          hiddenColumns: {
            columns: [1], // Hide B2 (visual col 1, inside nested group B inside group A)
          },
        });

        // Collapse the outer group A (header level 0). Its first child B is itself a group, so A
        // collapses to B's span and hides C (cols 2-3). B2 was already hidden by HiddenColumns.
        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 0 });
        await render();

        // A is collapsed to its first child B, which has one visible leaf (B1) -> colspan 1.
        expect(getHeaderColspan(getTopClone(), 'A')).toBe(1);
        expect(getHeaderColspan(getTopClone(), 'B')).toBe(1);
        // Only B1 (col 0) and E (col 4) remain visible; B2 hidden by HiddenColumns, C1/C2 by collapse.
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(2);
        expect(getDataAtCell(0, 0)).toBe('A1');

        // Expanding A restores C; B2 must stay hidden because HiddenColumns - not collapse - hid it.
        getPlugin('collapsibleColumns').expandSection({ row: -3, col: 0 });
        await render();

        expect(getHeaderColspan(getTopClone(), 'A')).toBe(3);
        expect(getHeaderColspan(getTopClone(), 'B')).toBe(1);
        expect(getHeaderColspan(getTopClone(), 'C')).toBe(2);
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(4);
      });
    });
  });
});
