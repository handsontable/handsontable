import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  CollapsibleColumns,
  NestedHeaders,
} from 'handsontable/plugins';

registerPlugin(CollapsibleColumns);
registerPlugin(NestedHeaders);

describe('CollapsibleColumns clearButtons', () => {
  let container: HTMLDivElement;
  let hot: Handsontable | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('turns the plugin off in the update that adds a header level', () => {
    hot = new Handsontable(container, {
      data: [[1, 2, 3]],
      colHeaders: true,
      nestedHeaders: [['A', { label: 'G', colspan: 2 }]],
      collapsibleColumns: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(container.querySelectorAll('.collapsibleIndicator').length).toBeGreaterThan(0);

    expect(() => hot?.updateSettings({
      nestedHeaders: [[{ label: 'Top', colspan: 3 }], ['A', { label: 'G', colspan: 2 }]],
      collapsibleColumns: false,
    })).not.toThrow();
    expect(hot.getPlugin('collapsibleColumns').enabled).toBe(false);
    expect(container.querySelectorAll('.collapsibleIndicator').length).toBe(0);
  });
});
