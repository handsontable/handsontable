import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';
import { getEditor } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import moment from 'moment';

// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */
const data = [
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
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1')!;
const cellTimeTypeDefinition = {
  renderer: getRenderer('text'),
  validator: function(value, callback) {
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

    const date = moment(value, [
      'YYYY-MM-DDTHH:mm:ss.SSSZ',
      'X', // Unix timestamp
      'x' // Unix ms timestamp
    ], true).isValid() ?
      moment(value) : moment(value, timeFormat);
    let isValidTime = date.isValid();

    // is it in the specified format
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

// Define configuration options for the Handsontable
const hotOptions: Handsontable.GridSettings = {
  data,
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
      type: 'moment-time',
      width: 150,
      timeFormat: 'HH:mm',
      correctFormat: true,
    },
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
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
