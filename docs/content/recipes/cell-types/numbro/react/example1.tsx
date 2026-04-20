import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory, getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { getValidator } from 'handsontable/validators';
import { registerCellType } from 'handsontable/cellTypes';
import numbro from 'numbro';
import languages from 'numbro/dist/languages.min.js';

registerAllModules();
Object.values(languages).forEach((language) => numbro.registerLanguage(language as numbro.NumbroLanguage));

function isNumeric(value: unknown): boolean {
  const type = typeof value;

  if (type === 'number') {
    return !isNaN(value as number) && isFinite(value as number);
  } else if (type === 'string') {
    const str = value as string;

    if (str.length === 0) {
      return false;
    } else if (str.length === 1) {
      return /\d/.test(str);
    }

    const delimiter = Array.from(new Set(['.']))
      .map((d) => `\\${d}`)
      .join('|');

    return new RegExp(`^[+-]?(((${delimiter})?\\d+((${delimiter})\\d+)?(e[+-]?\\d+)?)|(0x[a-f\\d]+))$`, 'i').test(
      str.trim()
    );
  } else if (type === 'object') {
    return !!value && typeof (value as object).valueOf() === 'number' && !(value instanceof Date);
  }

  return false;
}

const cellTypeDefinition = {
  renderer: rendererFactory(({ hotInstance, td, row, col, prop, value, cellProperties }) => {
    if (isNumeric(value)) {
      let classArr: string[] = [];

      if (Array.isArray(cellProperties.className)) {
        classArr = cellProperties.className as string[];
      } else {
        const className = (cellProperties.className as string) ?? '';

        if (className.length) {
          classArr = className.split(' ');
        }
      }

      const numericFormat = cellProperties.numericFormat as { culture?: string; pattern?: string } | undefined;
      const cellCulture = (numericFormat && numericFormat.culture) || 'en-US';
      const cellFormatPattern = numericFormat && numericFormat.pattern;

      if (cellCulture && !numbro.languages()[cellCulture]) {
        const shortTag = cellCulture.replace('-', '');
        const langData = (numbro as any).allLanguages ? (numbro as any).allLanguages[cellCulture] : (numbro as any)[shortTag];

        if (langData) {
          numbro.registerLanguage(langData);
        }
      }

      numbro.setLanguage(cellCulture);
      value = numbro(value as number).format(cellFormatPattern ?? '0');

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

/* start:skip-in-preview */
interface InventoryItem {
  id: number;
  itemName: string;
  itemNo: string;
  leadEngineer: string;
  cost: number;
  inStock: boolean;
  category: string;
  itemQuality: number;
  origin: string;
  quantity: number;
  valueStock: number;
  repairable: boolean;
  supplierName: string;
  restockDate: string;
  operationalStatus: string;
}

const data: InventoryItem[] = [
  {
    id: 640329,
    itemName: 'Lunar Core',
    itemNo: 'XJ-12',
    leadEngineer: 'Ellen Ripley',
    cost: 350000,
    inStock: true,
    category: 'Lander',
    itemQuality: 87,
    origin: '🇺🇸 USA',
    quantity: 2,
    valueStock: 700000,
    repairable: false,
    supplierName: 'TechNova',
    restockDate: '2025-08-01',
    operationalStatus: 'Awaiting Parts',
  },
  {
    id: 863104,
    itemName: 'Zero Thrusters',
    itemNo: 'QL-54',
    leadEngineer: 'Sam Bell',
    cost: 450000,
    inStock: false,
    category: 'Propulsion',
    itemQuality: 0,
    origin: '🇩🇪 Germany',
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: 'PropelMax',
    restockDate: '2025-09-15',
    operationalStatus: 'In Maintenance',
  },
  {
    id: 395603,
    itemName: 'EVA Suits',
    itemNo: 'PM-67',
    leadEngineer: 'Alex Rogan',
    cost: 150000,
    inStock: true,
    category: 'Equipment',
    itemQuality: 79,
    origin: '🇮🇹 Italy',
    quantity: 50,
    valueStock: 7500000,
    repairable: true,
    supplierName: 'SuitCraft',
    restockDate: '2025-10-05',
    operationalStatus: 'Ready for Testing',
  },
  {
    id: 679083,
    itemName: 'Solar Panels',
    itemNo: 'BW-09',
    leadEngineer: 'Dave Bowman',
    cost: 75000,
    inStock: true,
    category: 'Energy',
    itemQuality: 95,
    origin: '🇺🇸 USA',
    quantity: 10,
    valueStock: 750000,
    repairable: false,
    supplierName: 'SolarStream',
    restockDate: '2025-11-10',
    operationalStatus: 'Operational',
  },
  {
    id: 912663,
    itemName: 'Comm Array',
    itemNo: 'ZR-56',
    leadEngineer: 'Louise Banks',
    cost: 125000,
    inStock: false,
    category: 'Communication',
    itemQuality: 0,
    origin: '🇯🇵 Japan',
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: 'CommTech',
    restockDate: '2025-12-20',
    operationalStatus: 'Decommissioned',
  },
  {
    id: 315806,
    itemName: 'Habitat Dome',
    itemNo: 'UJ-23',
    leadEngineer: 'Dr. Ryan Stone',
    cost: 1000000,
    inStock: true,
    category: 'Shelter',
    itemQuality: 93,
    origin: '🇨🇦 Canada',
    quantity: 3,
    valueStock: 3000000,
    repairable: false,
    supplierName: 'DomeInnovate',
    restockDate: '2026-01-25',
    operationalStatus: 'Operational',
  },
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Item Name', 'Category', 'Lead Engineer', 'Quantity', 'Cost']}
      autoRowSize={true}
      rowHeaders={true}
      height="auto"
      width="100%"
      autoWrapRow={true}
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="itemName" type="text" width={130} />
      <HotColumn data="category" type="text" width={120} />
      <HotColumn data="leadEngineer" type="text" width={150} />
      <HotColumn
        data="quantity"
        type="numbro"
        width={150}
        className="htRight"
        numericFormat={{ pattern: '0,0', culture: 'en-US' }}
      />
      <HotColumn
        data="cost"
        type="numbro"
        width={120}
        className="htRight"
        numericFormat={{ pattern: '$0,0.00', culture: 'en-US' }}
      />
    </HotTable>
  );
};

export default ExampleComponent;
