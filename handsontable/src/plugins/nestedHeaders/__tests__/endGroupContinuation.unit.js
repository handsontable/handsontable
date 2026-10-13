import Handsontable from 'handsontable/base';
import { NestedHeaders, HiddenColumns, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(NestedHeaders);
registerPlugin(HiddenColumns);

describe('NestedHeaders – continuation of a group on the fixedColumnsEnd clones', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Creates a grid of 12 columns whose group Q1 (columns 5 to 10) reaches into the end band (columns 8 to 11).
   *
   * @param {object} group Extra properties of the Q1 group.
   * @param {object} settings Extra grid settings.
   */
  function createGrid(group = {}, settings = {}) {
    const labels = Array.from({ length: 12 }, (_, c) => `c${c}`);
    const rowspan = group.rowspan ?? 1;

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [Array.from({ length: 12 }, (_, c) => `R1C${c}`)],
      width: 500,
      height: 200,
      colWidths: 72,
      colHeaders: true,
      fixedColumnsEnd: 4,
      nestedHeaders: [
        [{ label: 'A', colspan: 5 }, { label: 'Q1', colspan: 6, ...group }, 'Z'],
        rowspan > 1 ? labels.map((label, c) => (c >= 5 && c <= 10 ? '' : label)) : labels,
      ],
      ...settings,
    });
  }

  /**
   * The cells of the first header level of the end clones that carry a label, as `[text, th]` pairs.
   *
   * @param {string} cloneName The overlay name, `inlineEndOverlay` or `topInlineEndCornerOverlay`.
   * @returns {Array}
   */
  function labeledCells(cloneName) {
    const thead = hot.view._wt.wtOverlays[cloneName]?.clone?.wtTable.THEAD;

    return Array.from(thead?.querySelectorAll('tr:first-child th') ?? [])
      .filter(th => th.querySelector('.colHeader') && !th.classList.contains('hiddenHeader'))
      .map(th => [th.querySelector('.colHeader').textContent.trim(), th]);
  }

  it('should draw the continuation cell with the headerClassName of its group', () => {
    createGrid({ headerClassName: 'htRight' });

    const cell = labeledCells('topInlineEndCornerOverlay').find(([text]) => text === 'Q1');

    expect(cell).toBeDefined();
    expect(cell[1].querySelector('div.relative').classList.contains('htRight')).toBe(true);
  });

  it('should keep the hidden-column indicator on the continuation cell of a group with a rowspan', () => {
    createGrid({ rowspan: 2 }, { hiddenColumns: { columns: [7], indicators: true } });

    const cell = labeledCells('topInlineEndCornerOverlay').find(([text]) => text === 'Q1');

    expect(cell).toBeDefined();
    expect(cell[1].classList.contains('afterHiddenColumn')).toBe(true);
  });
});
