import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type { CellMeta, CellProperties } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';
import './example1.css';

registerAllModules();

const STATUS_ROW_CLASSES: Record<string, string> = {
  active: 'ht-demo-row-status-active',
  pending: 'ht-demo-row-status-pending',
  inactive: 'ht-demo-row-status-inactive',
};

function statusToRowClass(status: unknown): string | undefined {
  if (typeof status !== 'string') {
    return undefined;
  }

  return STATUS_ROW_CLASSES[status];
}

/* start:skip-in-preview */
const data = [
  { task: 'Invoice export', owner: 'A. Lee', status: 'active' },
  { task: 'SSO rollout', owner: 'M. Costa', status: 'pending' },
  { task: 'Legacy reports', owner: 'J. Park', status: 'inactive' },
  { task: 'API docs', owner: 'R. Singh', status: 'active' },
  { task: 'Mobile parity', owner: 'T. Nguyen', status: 'pending' },
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  return (
    <HotTable
      id="example1"
      data={data}
      licenseKey="non-commercial-and-evaluation"
      rowHeaders={true}
      colHeaders={['Task', 'Owner', 'Status']}
      height="auto"
      width="100%"
      columns={[
        { data: 'task', type: 'text', width: 220 },
        { data: 'owner', type: 'text', width: 120 },
        {
          data: 'status',
          type: 'dropdown',
          width: 120,
          source: ['active', 'pending', 'inactive'],
          strict: true,
          allowInvalid: false,
        },
      ]}
      cells={function (
        this: CellProperties,
        row: number,
        _column: number,
        _prop: string | number,
      ): CellMeta {
        const hot = this.instance;
        const visualRow = hot.toVisualRow(row);

        if (visualRow === null || visualRow < 0) {
          return {};
        }

        const status = hot.getDataAtRowProp(visualRow, 'status');
        const rowClass = statusToRowClass(status);

        if (!rowClass) {
          return {};
        }

        return { className: rowClass };
      }}
      afterValidate={function (
        this: Handsontable,
        isValid: boolean,
        _value: Handsontable.CellValue,
        row: number,
        prop: string | number,
      ): void {
        if (isValid) {
          return;
        }

        const col = this.propToCol(prop);
        const td = this.getCell(row, col);

        if (!td) {
          return;
        }

        td.classList.add('ht-demo-invalid-flash');
        setTimeout(() => td.classList.remove('ht-demo-invalid-flash'), 800);
      }}
    />
  );
};

export default ExampleComponent;
