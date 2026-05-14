/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable';
import moment from 'moment';
import { getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';

const cellTimeTypeDefinition = {
  CELL_TYPE: 'moment-time',
  renderer: getRenderer('text'),
  validator(this: any, value: any, callback: (valid: boolean) => void): void {
    const timeFormat = this.timeFormat ?? 'h:mm:ss a';
    let valid = true;

    if (value === null) {
      value = '';
    }

    value = /^\d{3,}$/.test(value) ? parseInt(value, 10) : value;

    const twoDigitValue = /^\d{1,2}$/.test(value);

    if (twoDigitValue) {
      value += ':00';
    }

    const date = moment(
      value,
      ['YYYY-MM-DDTHH:mm:ss.SSSZ', 'X', 'x'],
      true
    ).isValid()
      ? moment(value)
      : moment(value, timeFormat);

    let isValidTime = date.isValid();
    let isValidFormat = moment(value, timeFormat, true).isValid() && !twoDigitValue;

    if (this.allowEmpty && value === '') {
      isValidTime = true;
      isValidFormat = true;
    }

    if (!isValidTime) {
      valid = false;
    }

    if (!isValidTime && isValidFormat) {
      valid = true;
    }

    if (isValidTime && !isValidFormat) {
      if (this.correctFormat === true) {
        const correctedValue = date.format(timeFormat);

        this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'timeValidator');
        valid = true;
      } else {
        valid = false;
      }
    }

    callback(valid);
  },
  editor: getEditor('text'),
};

registerCellType('moment-time', cellTimeTypeDefinition);

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-moment-time',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = [
    {
      itemName: 'Lunar Core',
      category: 'Lander',
      leadEngineer: 'Ellen Ripley',
      time: '09:30',
      cost: 350000,
    },
    {
      itemName: 'Zero Thrusters',
      category: 'Propulsion',
      leadEngineer: 'Sam Bell',
      time: '14:15',
      cost: 450000,
    },
    {
      itemName: 'EVA Suits',
      category: 'Equipment',
      leadEngineer: 'Alex Rogan',
      time: '08:00',
      cost: 150000,
    },
    {
      itemName: 'Solar Panels',
      category: 'Energy',
      leadEngineer: 'Dave Bowman',
      time: '16:45',
      cost: 75000,
    },
    {
      itemName: 'Comm Array',
      category: 'Communication',
      leadEngineer: 'Louise Banks',
      time: '11:20',
      cost: 125000,
    },
    {
      itemName: 'Habitat Dome',
      category: 'Shelter',
      leadEngineer: 'Dr. Ryan Stone',
      time: '23:00',
      cost: 1000000,
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Arrival Time', 'Cost'],
    autoRowSize: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
    headerClassName: 'htLeft',
    columns: [
      { data: 'itemName', type: 'text', width: 130 },
      { data: 'category', type: 'text', width: 120 },
      { data: 'leadEngineer', type: 'text', width: 150 },
      {
        data: 'time',
        type: 'moment-time' as any,
        width: 150,
        timeFormat: 'HH:mm',
        correctFormat: true,
      } as any,
      {
        data: 'cost',
        type: 'numeric',
        width: 120,
        className: 'htRight',
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US',
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
