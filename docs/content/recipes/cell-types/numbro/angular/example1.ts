/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import numbro from 'numbro';
import languages from 'numbro/dist/languages.min.js';
import { rendererFactory, getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { getValidator } from 'handsontable/validators';
import { registerCellType } from 'handsontable/cellTypes';

Object.values(languages).forEach((language: any) => numbro.registerLanguage(language));

function isNumeric(value: any): boolean {
  const type = typeof value;

  if (type === 'number') {
    return !isNaN(value) && isFinite(value);
  } else if (type === 'string') {
    if (value.length === 0) {
      return false;
    } else if (value.length === 1) {
      return /\d/.test(value);
    }

    const delimiter = Array.from(new Set(['.']))
      .map((d) => `\\${d}`)
      .join('|');

    return new RegExp(
      `^[+-]?(((${delimiter})?\\d+((${delimiter})\\d+)?(e[+-]?\\d+)?)|(0x[a-f\\d]+))$`,
      'i'
    ).test(value.trim());
  } else if (type === 'object') {
    return !!value && typeof value.valueOf() === 'number' && !(value instanceof Date);
  }

  return false;
}

const cellTypeDefinition = {
  CELL_TYPE: 'numbro',
  renderer: rendererFactory(({ hotInstance, td, row, col, prop, value, cellProperties }: any) => {
    if (isNumeric(value)) {
      let classArr: string[] = [];

      if (Array.isArray(cellProperties.className)) {
        classArr = cellProperties.className;
      } else {
        const className = cellProperties.className ?? '';

        if (className.length) {
          classArr = className.split(' ');
        }
      }

      const numericFormat = cellProperties.numericFormat;
      const cellCulture = (numericFormat && numericFormat.culture) || 'en-US';
      const cellFormatPattern = numericFormat && numericFormat.pattern;

      if (cellCulture && !numbro.languages()[cellCulture]) {
        const shortTag = cellCulture.replace('-', '');
        const langData = (numbro as any).allLanguages
          ? (numbro as any).allLanguages[cellCulture]
          : (numbro as any)[shortTag];

        if (langData) {
          numbro.registerLanguage(langData);
        }
      }

      numbro.setLanguage(cellCulture);
      value = numbro(value).format(cellFormatPattern ?? '0');

      if (
        classArr.indexOf('htLeft') < 0 &&
        classArr.indexOf('htCenter') < 0 &&
        classArr.indexOf('htRight') < 0 &&
        classArr.indexOf('htJustify') < 0
      ) {
        classArr.push('htRight');
      }

      if (classArr.indexOf('htNumeric') < 0) {
        classArr.push('htNumeric');
      }

      cellProperties.className = classArr.join(' ');
      td.dir = 'ltr';
    }

    getRenderer('text')(hotInstance, td, row, col, prop, value, cellProperties);
  }),
  validator: getValidator('numeric'),
  editor: getEditor('numeric'),
};

registerCellType('numbro', cellTypeDefinition);

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-numbro',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = [
    {
      itemName: 'Lunar Core',
      category: 'Lander',
      leadEngineer: 'Ellen Ripley',
      quantity: 2,
      cost: 350000,
    },
    {
      itemName: 'Zero Thrusters',
      category: 'Propulsion',
      leadEngineer: 'Sam Bell',
      quantity: 0,
      cost: 450000,
    },
    {
      itemName: 'EVA Suits',
      category: 'Equipment',
      leadEngineer: 'Alex Rogan',
      quantity: 50,
      cost: 150000,
    },
    {
      itemName: 'Solar Panels',
      category: 'Energy',
      leadEngineer: 'Dave Bowman',
      quantity: 10,
      cost: 75000,
    },
    {
      itemName: 'Comm Array',
      category: 'Communication',
      leadEngineer: 'Louise Banks',
      quantity: 0,
      cost: 125000,
    },
    {
      itemName: 'Habitat Dome',
      category: 'Shelter',
      leadEngineer: 'Dr. Ryan Stone',
      quantity: 3,
      cost: 1000000,
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Quantity', 'Cost'],
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
        data: 'quantity',
        type: 'numbro' as any,
        width: 150,
        className: 'htRight',
        numericFormat: {
          pattern: '0,0',
          culture: 'en-US',
        },
      } as any,
      {
        data: 'cost',
        type: 'numbro' as any,
        width: 120,
        className: 'htRight',
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US',
        },
      } as any,
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
