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

    describe('collapsing a group after a child column is hidden (DEV-294)', () => {
      // Clicks the collapsible indicator found in a given (0-based, from the top) header row.
      function clickIndicatorInRow(rowIndex) {
        const tr = getMaster().find('thead tr')[rowIndex];
        const indicator = tr ? tr.querySelector('.collapsibleIndicator') : null;

        if (indicator) {
          $(indicator).simulate('mousedown').simulate('mouseup').simulate('click');
        }

        return !!indicator;
      }

      // Image #6: with both sub-groups collapsed and B-left's visible representative hidden,
      // collapsing the parent must not hide the last visible column - the group has to stay
      // recoverable (a collapsible indicator must remain so it can be expanded again).
      it('should keep the parent group recoverable when its only visible column would be removed', async() => {
        handsontable({
          data: createSpreadsheetData(12, 6),
          colHeaders: true,
          width: 400,
          height: 300,
          nestedHeaders: [
            ['A', { label: 'Group B', colspan: 4 }, 'C'],
            ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
            ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
          ],
          collapsibleColumns: true,
          hiddenColumns: { columns: [], indicators: true },
        });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 }); // collapse B-left
        await render();
        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 3 }); // collapse B-right
        await render();
        getPlugin('hiddenColumns').hideColumn(1); // hide B1 (the only visible column of B-left)
        await render();

        // Now A, B3 and C are visible (body: A1, D1, F1). Collapse the parent Group B via its indicator.
        clickIndicatorInRow(0);
        await render();

        // The B3 column must stay visible - the group must not collapse into nothing.
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(3);
        // A collapsible indicator must remain in the headers so the group can be expanded again.
        expect(getTopClone().find('thead .collapsibleIndicator').length).toBeGreaterThan(0);
      });

      // Across many orderings of collapse/expand (child and parent) interleaved with hiding and
      // showing columns, the rendered header must stay aligned with the body - the top header row's
      // total width must equal the body row's total width. A wider header row is the misalignment
      // the client reported (a group spilling over the next column).
      it('should keep the header row aligned with the body for collapse/hide/expand orderings', async() => {
        const cw = el => Math.round(el.getBoundingClientRect().width);
        const ops = {
          collapseBLeft: () => getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 }),
          collapseBRight: () => getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 3 }),
          collapseParent: () => getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 }),
          expandBLeft: () => getPlugin('collapsibleColumns').expandSection({ row: -2, col: 1 }),
          expandBRight: () => getPlugin('collapsibleColumns').expandSection({ row: -2, col: 3 }),
          expandParent: () => getPlugin('collapsibleColumns').expandSection({ row: -3, col: 1 }),
          hide1: () => getPlugin('hiddenColumns').hideColumn(1),
          hide2: () => getPlugin('hiddenColumns').hideColumn(2),
          hide3: () => getPlugin('hiddenColumns').hideColumn(3),
          hide4: () => getPlugin('hiddenColumns').hideColumn(4),
          showAll: () => getPlugin('hiddenColumns').showColumns([1, 2, 3, 4]),
        };
        const sequences = [
          ['collapseBLeft', 'collapseBRight', 'hide1', 'collapseParent', 'expandParent', 'showAll'],
          ['hide1', 'hide2', 'collapseParent', 'expandParent'],
          ['collapseParent', 'hide3', 'hide4', 'expandParent'],
          ['hide3', 'hide4', 'collapseParent', 'expandParent', 'showAll'],
          ['collapseBLeft', 'hide3', 'hide4', 'expandBLeft'],
          ['collapseBLeft', 'collapseBRight', 'collapseParent', 'expandParent', 'expandBRight', 'expandBLeft'],
          ['hide1', 'hide2', 'hide3', 'hide4', 'collapseParent'],
          ['collapseBLeft', 'collapseBRight', 'hide1', 'hide3', 'expandBLeft', 'expandBRight'],
        ];

        for (let s = 0; s < sequences.length; s++) {
          const seq = sequences[s];

          if (s > 0) {
            destroy();
          }

          handsontable({
            data: createSpreadsheetData(12, 6),
            colHeaders: true,
            width: 600,
            height: 300,
            nestedHeaders: [
              ['A', { label: 'Group B', colspan: 4 }, 'C'],
              ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
              ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
            ],
            collapsibleColumns: true,
            hiddenColumns: { columns: [], indicators: true },
          });

          for (let i = 0; i < seq.length; i++) {
            ops[seq[i]]();
            await render(); // eslint-disable-line no-await-in-loop

            const bodyTotal = Array.from(getMaster().find('tbody tr:eq(0) td'))
              .reduce((sum, td) => sum + cw(td), 0);
            const headerTotal = Array.from(getMaster().find('thead tr')[0].querySelectorAll('th'))
              .reduce((sum, th) => sum + cw(th), 0);

            expect(headerTotal)
              .withContext(`seq #${s} after [${seq.slice(0, i + 1).join(' > ')}]`)
              .toBe(bodyTotal);
          }
        }
      });
    });

    describe('collapsed group structure with grouping and hiding (DEV-294)', () => {
      // The header total width must always equal the body total width; any drift is the
      // "group spilling over the next column" misalignment the client reported.
      function expectHeaderBodyAligned() {
        const cw = el => Math.round(el.getBoundingClientRect().width);
        const bodyTotal = Array.from(getMaster().find('tbody tr:eq(0) td'))
          .reduce((sum, td) => sum + cw(td), 0);
        const headerTotal = Array.from(getMaster().find('thead tr')[0].querySelectorAll('th'))
          .reduce((sum, th) => sum + cw(th), 0);

        expect(headerTotal).toBe(bodyTotal);
      }

      function buildGrid(extra = {}) {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          width: 800,
          height: 250,
          nestedHeaders: [
            ['A', { label: 'Group B', colspan: 4 }, 'C'],
            ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
            ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
          ],
          collapsibleColumns: true,
          hiddenColumns: { columns: [], indicators: true },
          ...extra,
        });
      }

      it('should render a collapsed sub-group with the correct DOM structure', async() => {
        buildGrid();

        // Collapse B-left: its first child B1 stays, B2 becomes collapse-hidden.
        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="3">Group B</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator collapsed">B-left</th>
              <th class="collapsibleIndicator expanded" colspan="2">B-right</th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B1</th>
              <th class="">B3</th>
              <th class="">B4</th>
              <th class="">C</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
        expectHeaderBodyAligned();
      });

      it('should render a collapsed parent group with the correct DOM structure', async() => {
        buildGrid();

        // Collapse the parent Group B: its first child B-left (2 cols) stays, B-right is hidden.
        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 });
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator collapsed" colspan="2">Group B</th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B-left</th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="">B1</th>
              <th class="">B2</th>
              <th class="">C</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
        expectHeaderBodyAligned();
      });

      // The ghost table snapshots the pre-collapse width of a collapsed representative so expanding
      // does not cause a layout jump. When a group is collapsed at the earliest point in the
      // lifecycle, that snapshot can be empty (no prior uncollapsed measurement), so the collapsed
      // representative falls back to measuring its own colspan-reduced TH. This verifies that
      // fallback still yields a correct, body-aligned width - i.e. there is no width loss for a
      // group that is collapsed right away.
      it('should keep widths aligned for a group collapsed at the earliest point in the lifecycle', async() => {
        buildGrid();

        // Collapse before any other interaction - the closest reachable point to "initially collapsed".
        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        // The collapsed representative (B1, visual col 1) must keep a real, positive width...
        expect(getColWidth(1)).toBeGreaterThan(0);
        // ...and the header total must still equal the body total (no width lost on the collapse
        // representative even when the pre-collapse width snapshot is empty).
        expectHeaderBodyAligned();
      });

      // When the only column a collapse would hide is already hidden by HiddenColumns, the collapse
      // still records itself: `isCollapsed` is set (the indicator shows collapsed) and the collapse
      // "owns" that column, so the group stays collapsed even if HiddenColumns later shows it.
      // The colspan does not change (the column was already out of the colspan).
      it('should mark the sub-group collapsed even when its extra child is already hidden', async() => {
        buildGrid({ hiddenColumns: { columns: [2], indicators: true } });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="3">Group B</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator collapsed">B-left</th>
              <th class="collapsibleIndicator expanded" colspan="2">B-right</th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="beforeHiddenColumn">B1</th>
              <th class="afterHiddenColumn">B3</th>
              <th class="">B4</th>
              <th class="">C</th>
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
        expectHeaderBodyAligned();
      });

      // Round-trip ownership (the bug this fix addresses): once B-left is collapsed with B2 already
      // hidden, the collapse must OWN B2 so that re-showing B2 via HiddenColumns keeps the group
      // collapsed, and only expanding the group reveals it.
      it('should keep the group collapsed when its already-hidden child is shown, and reveal it on expand', async() => {
        buildGrid({ hiddenColumns: { columns: [2], indicators: true } });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        const collapsedTh = () => Array.from(getTopClone().find('thead th')).find((cell) => {
          const header = cell.querySelector('.colHeader');

          return header && header.innerText === 'B-left';
        });

        expect(!!collapsedTh().querySelector('.collapsibleIndicator.collapsed')).toBe(true);

        // Show B2 via HiddenColumns: the collapse still owns it, so it stays hidden and B-left stays collapsed.
        getPlugin('hiddenColumns').showColumn(2);
        await render();

        expect(!!collapsedTh().querySelector('.collapsibleIndicator.collapsed')).toBe(true);
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(5); // A, B1, B3, B4, C - B2 still hidden by collapse
        expectHeaderBodyAligned();

        // Expanding the group releases B2; nothing hides it anymore, so it becomes visible.
        getPlugin('collapsibleColumns').expandSection({ row: -2, col: 1 });
        await render();

        expect(!!collapsedTh().querySelector('.collapsibleIndicator.expanded')).toBe(true);
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(6); // A, B1, B2, B3, B4, C all visible
        expectHeaderBodyAligned();
      });

      // Image #6 class of bug: collapse B-left, then hide its only visible column (B1) via
      // HiddenColumns. B-left then has no visible column, so its header disappears, but the grid
      // must stay aligned and Group B must keep a collapsible indicator (the group is recoverable
      // by re-showing B1).
      it('should stay aligned and recoverable when a collapsed sub-group loses its only visible column', async() => {
        buildGrid();

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();
        getPlugin('hiddenColumns').hideColumn(1); // hide B1, the visible representative of B-left
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">Group B</th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="">A</th>
              <th class="collapsibleIndicator expanded" colspan="2">B-right</th>
              <th class="hiddenHeader"></th>
              <th class="">C</th>
            </tr>
            <tr>
              <th class="beforeHiddenColumn">A</th>
              <th class="">B3</th>
              <th class="">B4</th>
              <th class="">C</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
        `);
        expectHeaderBodyAligned();
        // The group must remain recoverable - a collapsible indicator stays in the headers.
        expect(getTopClone().find('thead .collapsibleIndicator').length).toBeGreaterThan(0);
      });

      it('should move the selection off a column that collapsing a sub-group hides', async() => {
        buildGrid();
        await selectCell(0, 2); // select B2 (the column the collapse will hide)

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();

        // B2 is hidden by the collapse, so the selection moves to the next visible column (B3).
        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      });

      it('should move the selection off the columns that collapsing the parent group hides', async() => {
        buildGrid();
        await selectCell(0, 3); // select B3 (inside the part the parent collapse will hide)

        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 });
        await render();

        // B3 and B4 are hidden, so the selection moves to the next visible column (C).
        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);
      });
    });
  });
});
