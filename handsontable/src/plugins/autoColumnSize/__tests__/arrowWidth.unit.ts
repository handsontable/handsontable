import Handsontable from 'handsontable/base';
import { registerPlugin, AutoColumnSize } from 'handsontable/plugins';
import { registerCellType } from 'handsontable/cellTypes/registry';
import { AutocompleteCellType } from 'handsontable/cellTypes/autocompleteType';

registerPlugin(AutoColumnSize);
registerCellType(AutocompleteCellType);

describe('AutoColumnSize autocomplete arrow (DEV-348)', () => {
  it('should sample an autocomplete column through GhostTable so the measured TD carries the arrow class', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['Long value']],
      columns: [{ type: 'autocomplete', source: ['Long value'] }],
      autoColumnSize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin('autoColumnSize');
    const sampled: HTMLTableCellElement[] = [];
    const origAddColumn = plugin.ghostTable.addColumn.bind(plugin.ghostTable);

    plugin.ghostTable.addColumn = (column: number, samples: Map<string | number, unknown>) => {
      origAddColumn(column, samples);

      const table = plugin.ghostTable.columns[plugin.ghostTable.columns.length - 1]
        .table as HTMLTableElement;

      sampled.push(table.querySelector('td')!);
    };

    plugin.calculateColumnsWidth(0, 0, true);

    expect(sampled.length).toBeGreaterThan(0);
    expect(sampled[0].classList.contains('htAutocomplete')).toBe(true);
    expect(sampled[0].querySelector('.htAutocompleteArrow')).not.toBeNull();

    hot.destroy();
  });
});
