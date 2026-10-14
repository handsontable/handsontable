import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { HiddenColumns } from '../hiddenColumns';

describe('HiddenColumns#getIndicatorExtraWidth', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(HiddenColumns);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  function create(settings) {
    hot = new Handsontable(container, {
      data: [['a', 'b', 'c', 'd', 'e', 'f']],
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot.getPlugin('hiddenColumns');
  }

  it('should report the indicator width for a column next to a hidden column, on either side', () => {
    const plugin = create({ hiddenColumns: { columns: [2], indicators: true } });

    expect(plugin.getIndicatorExtraWidth(0)).toBe(0);
    expect(plugin.getIndicatorExtraWidth(1)).toBe(15);
    expect(plugin.getIndicatorExtraWidth(3)).toBe(15);
    expect(plugin.getIndicatorExtraWidth(4)).toBe(0);
  });

  it('should report no indicator width when the indicators are off', () => {
    const plugin = create({ hiddenColumns: { columns: [2], indicators: false } });

    expect(plugin.getIndicatorExtraWidth(1)).toBe(0);
  });

  it('should report no indicator width when the grid renders no column headers', () => {
    const plugin = create({ colHeaders: false, hiddenColumns: { columns: [2], indicators: true } });

    expect(plugin.getIndicatorExtraWidth(1)).toBe(0);
  });

  it('should report no indicator width when the plugin is disabled', () => {
    const plugin = create({ hiddenColumns: { columns: [2], indicators: true } });

    hot.updateSettings({ hiddenColumns: false });

    expect(plugin.getIndicatorExtraWidth(1)).toBe(0);
  });

  it('should not ask whether the grid renders column headers for a column with no hidden neighbor', () => {
    const plugin = create({ hiddenColumns: { columns: [2], indicators: true } });
    const hasColHeaders = jest.spyOn(hot, 'hasColHeaders');

    plugin.getIndicatorExtraWidth(5);

    expect(hasColHeaders).not.toHaveBeenCalled();
  });
});
