/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';
import { CellChange, CellProperties } from 'handsontable/settings';
import { HotInstance } from 'handsontable';
import moment from 'moment';

// The built-in `date` cell type stores every value in the ISO 8601 format.
const ISO_FORMAT = 'YYYY-MM-DD';

// Converts a loosely written date into ISO.
const toISODate = (value: string, inputFormat: string): string => {
  // The column's own format wins, parsed strictly so a near-miss does not silently shift.
  const fromInputFormat = moment(value, inputFormat, true);

  if (fromInputFormat.isValid()) {
    return fromInputFormat.format(ISO_FORMAT);
  }

  // Fall back to the browser's parsing for values that format cannot describe, such as
  // "March 14, 2025". Handing Moment a Date avoids its string-parsing deprecation warning.
  const nativeDate = new Date(value);

  return Number.isNaN(nativeDate.getTime()) ? value : moment(nativeDate).format(ISO_FORMAT);
};

// The custom cell properties this cell type reads, on top of the built-in ones.
type MomentDateCellProperties = CellProperties & {
  renderFormat?: string;
  inputFormat?: string;
  correctFormat?: boolean;
};

const cellDateTypeDefinition = {
  // Inherit the built-in date editor (a native date input), its ISO validator, and the source-data
  // check that warns when the underlying data is not ISO.
  ...DateCellType,

  // Display the ISO source value in the column's own Moment format. `valueFormatter` runs before the
  // renderer, so the inherited renderer receives the formatted string and no custom renderer is needed.
  valueFormatter: (value: unknown, cellProperties: MomentDateCellProperties) => {
    if (typeof value !== 'string' || value === '') {
      return value;
    }

    const date = moment(value, ISO_FORMAT, true);

    return date.isValid() ? date.format(cellProperties.renderFormat ?? ISO_FORMAT) : value;
  },
};

// Rewrites a non-ISO value into ISO before it reaches the cell. This runs ahead of both the editor
// and the validator, which is what keeps the built-in ISO-only editor from warning about the raw
// value. It also covers pasted and programmatically written values, which never touch the editor.
function correctDatesBeforeChange(this: HotInstance, changes: (CellChange | null)[]): void {
  changes.forEach((change) => {
    if (!change) {
      return;
    }

    const [visualRow, prop, , newValue] = change;
    const cellMeta = this.getCellMeta<MomentDateCellProperties>(
      visualRow,
      this.propToCol(prop as string) as number
    );

    if (
      cellMeta['type'] !== 'moment-date' ||
      cellMeta.correctFormat !== true ||
      typeof newValue !== 'string' ||
      newValue === ''
    ) {
      return;
    }

    if (!moment(newValue, ISO_FORMAT, true).isValid()) {
      change[3] = toISODate(newValue, cellMeta.inputFormat ?? ISO_FORMAT);
    }
  });
}

registerCellType('moment-date', cellDateTypeDefinition);

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-moment-date',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = [
    {
      itemName: 'Lunar Core',
      category: 'Lander',
      leadEngineer: 'Ellen Ripley',
      restockDate: '2025-08-01',
      cost: 350000,
    },
    {
      itemName: 'Zero Thrusters',
      category: 'Propulsion',
      leadEngineer: 'Sam Bell',
      restockDate: '2025-09-15',
      cost: 450000,
    },
    {
      itemName: 'EVA Suits',
      category: 'Equipment',
      leadEngineer: 'Alex Rogan',
      restockDate: '2025-10-05',
      cost: 150000,
    },
    {
      itemName: 'Solar Panels',
      category: 'Energy',
      leadEngineer: 'Dave Bowman',
      restockDate: '2025-11-10',
      cost: 75000,
    },
    {
      itemName: 'Comm Array',
      category: 'Communication',
      leadEngineer: 'Louise Banks',
      restockDate: '2025-12-20',
      cost: 125000,
    },
    {
      itemName: 'Habitat Dome',
      category: 'Shelter',
      leadEngineer: 'Dr. Ryan Stone',
      restockDate: '2026-01-25',
      cost: 1000000,
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost'],
    autoRowSize: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
    headerClassName: 'htLeft',
    beforeChange: correctDatesBeforeChange,
    columns: [
      { data: 'itemName', type: 'text', width: 130 },
      { data: 'category', type: 'text', width: 120 },
      { data: 'leadEngineer', type: 'text', width: 150 },
      {
        data: 'restockDate',
        type: 'moment-date',
        width: 150,
        // Display format, applied by `valueFormatter`. The stored value stays ISO.
        renderFormat: 'MMM D, YYYY',
        // Format tried first when correcting a pasted value.
        inputFormat: 'MM/DD/YYYY',
        correctFormat: true,
      },
      {
        data: 'cost',
        type: 'numeric',
        width: 120,
        className: 'htRight',
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
    ],
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
