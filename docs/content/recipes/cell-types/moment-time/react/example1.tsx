import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import moment from 'moment';

registerAllModules();

const cellTimeTypeDefinition = {
  renderer: getRenderer('text'),
  validator(this: any, value: string | number, callback: (valid: boolean) => void) {
    const timeFormat: string = this.timeFormat ?? 'h:mm:ss a';
    let valid = true;

    if (value === null) {
      value = '';
    }

    value = /^\d{3,}$/.test(String(value)) ? parseInt(String(value), 10) : value;

    const twoDigitValue = /^\d{1,2}$/.test(String(value));

    if (twoDigitValue) {
      value = `${value}:00`;
    }

    const date = moment(
      value,
      [
        'YYYY-MM-DDTHH:mm:ss.SSSZ',
        'X',
        'x',
      ],
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
  time: string;
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
    time: '09:30',
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
    time: '14:15',
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
    time: '08:00',
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
    time: '16:45',
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
    time: '11:20',
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
    time: '23:00',
    operationalStatus: 'Operational',
  },
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Item Name', 'Category', 'Lead Engineer', 'Arrival Time', 'Cost']}
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
        data="time"
        type="moment-time"
        width={150}
        timeFormat="HH:mm"
        correctFormat={true}
      />
      <HotColumn
        data="cost"
        type="numeric"
        width={120}
        className="htRight"
        numericFormat={{ pattern: '$0,0.00', culture: 'en-US' }}
      />
    </HotTable>
  );
};

export default ExampleComponent;
