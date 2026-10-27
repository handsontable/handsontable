import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('SheetsBar plugin state across sheet switches', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  const rows = () => [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];

  /**
   * Creates a grid with a sheets bar.
   *
   * @param {object} settings Grid settings.
   * @param {Array} sheets The sheets.
   * @returns {object} The SheetsBar plugin.
   */
  function build(settings, sheets) {
    hot = new Handsontable(container, {
      ...settings,
      sheetsBar: { sheets },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  describe('CollapsibleColumns', () => {
    const collapsibleSettings = {
      nestedHeaders: [[{ label: 'G', colspan: 2 }, 'c'], ['a', 'b', 'c']],
      collapsibleColumns: true,
    };

    it('keeps a collapsed column group across a round trip', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(false);
      expect(hot.getPlugin('nestedHeaders').getStateManager().exportCollapsedGroups()).toEqual([]);

      bar.setActiveSheet('A');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(true);
      expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]);
      expect(hot.getPlugin('nestedHeaders').getStateManager().exportCollapsedGroups())
        .toEqual([{ headerLevel: 0, authoredColumnIndex: 0 }]);
    });

    it('runs no collapse hooks on a switch', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const hooks = jest.fn();

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      ['beforeColumnCollapse', 'afterColumnCollapse', 'beforeColumnExpand', 'afterColumnExpand']
        .forEach(hook => hot.addHook(hook, () => hooks(hook)));
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');

      expect(hooks.mock.calls).toEqual([]);
    });

    it('keeps the group expanded once the user expanded it', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const collapsible = hot.getPlugin('collapsibleColumns');

      collapsible.collapseSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');
      collapsible.expandSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(false);
      expect(collapsible.getCollapsedColumns()).toEqual([]);
    });
  });

});
