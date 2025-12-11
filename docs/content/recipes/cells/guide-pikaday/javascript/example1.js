import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';
import { editorFactory } from 'handsontable/editors/baseEditor';
import { rendererFactory } from 'handsontable/renderers';

// Register all Handsontable's modules.
registerAllModules();

const DATE_FORMAT_US = 'MM/DD/YYYY';
const DEFAULT_DATE_FORMAT = DATE_FORMAT_US;
const copyStyleFromElements = (source, target, keys = [], keysStartsWith = []) => {
  const computedStyle = getComputedStyle(source);

  Array.from(computedStyle)
    .filter((key) => {
      if (keys.length === 0 && keysStartsWith.length === 0) {
        return true;
      }

      if (keys.length > 0) {
        if (keys.includes(key)) {
          return true;
        }
      }

      if (keysStartsWith.length > 0) {
        if (keysStartsWith.some((startsWith) => key.startsWith(startsWith))) {
          return true;
        }
      }

      return false;
    })
    .forEach((key) =>
      target.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key))
    );
};

/* start:skip-in-preview */
const inputData = [
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
  {
    id: 954632,
    itemName: 'Oxygen Unit',
    itemNo: 'FK-87',
    leadEngineer: 'Dr. Grace Augustine',
    cost: 600000,
    inStock: true,
    category: 'Life Support',
    itemQuality: 85,
    origin: '🇺🇸 USA',
    quantity: 15,
    valueStock: 9000000,
    repairable: true,
    supplierName: 'OxyGenius',
    restockDate: '2026-03-02',
    operationalStatus: 'Awaiting Parts',
  },
  {
    id: 734944,
    itemName: 'Processing Rig',
    itemNo: 'LK-13',
    leadEngineer: 'Jake Sully',
    cost: 350000,
    inStock: true,
    category: 'Mining',
    itemQuality: 81,
    origin: '🇦🇺 Australia',
    quantity: 25,
    valueStock: 8750000,
    repairable: true,
    supplierName: 'RigTech',
    restockDate: '2026-04-15',
    operationalStatus: 'Ready for Testing',
  },
  {
    id: 834662,
    itemName: 'Navigation Module',
    itemNo: 'XP-24',
    leadEngineer: 'Dr. Ellie Arroway',
    cost: 450000,
    inStock: true,
    category: 'Navigation',
    itemQuality: 89,
    origin: '🇫🇷 France',
    quantity: 8,
    valueStock: 3600000,
    repairable: false,
    supplierName: 'NavSolutions',
    restockDate: '2026-05-30',
    operationalStatus: 'In Maintenance',
  },
  {
    id: 714329,
    itemName: 'Surveyor Arm',
    itemNo: 'QA-86',
    leadEngineer: 'Mark Watney',
    cost: 100000,
    inStock: true,
    category: 'Exploration',
    itemQuality: 78,
    origin: '🇺🇸 USA',
    quantity: 40,
    valueStock: 4000000,
    repairable: true,
    supplierName: 'ExploreTech',
    restockDate: '2026-07-12',
    operationalStatus: 'Decommissioned',
  },
  {
    id: 291439,
    itemName: 'Habitat Dome',
    itemNo: 'UJ-24',
    leadEngineer: 'Jane Doe',
    cost: 1100000,
    inStock: true,
    category: 'Shelter',
    itemQuality: 92,
    origin: '🇬🇧 UK',
    quantity: 4,
    valueStock: 4400000,
    repairable: false,
    supplierName: 'DomeInnovate',
    restockDate: '2026-02-01',
    operationalStatus: 'Operational',
  },
  {
    id: 485199,
    itemName: 'Power Generator',
    itemNo: 'PG-11',
    leadEngineer: 'John Smith',
    cost: 500000,
    inStock: true,
    category: 'Energy',
    itemQuality: 85,
    origin: '🇨🇳 China',
    quantity: 7,
    valueStock: 3500000,
    repairable: true,
    supplierName: 'PowerCo',
    restockDate: '2026-03-10',
    operationalStatus: 'Operational',
  },
  {
    id: 271418,
    itemName: 'Life Support System',
    itemNo: 'LS-22',
    leadEngineer: 'Mike Johnson',
    cost: 800000,
    inStock: false,
    category: 'Life Support',
    itemQuality: 80,
    origin: '🇯🇵 Japan',
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: 'LifeTech',
    restockDate: '2026-04-20',
    operationalStatus: 'Awaiting Parts',
  },
  {
    id: 390776,
    itemName: 'Mars Rover',
    itemNo: 'MR-33',
    leadEngineer: 'Anna Davis',
    cost: 2000000,
    inStock: true,
    category: 'Exploration',
    itemQuality: 90,
    origin: '🇮🇳 India',
    quantity: 5,
    valueStock: 10000000,
    repairable: false,
    supplierName: 'RoverWorks',
    restockDate: '2026-05-15',
    operationalStatus: 'Operational',
  },
  {
    id: 672342,
    itemName: 'Hydroponics Module',
    itemNo: 'HM-44',
    leadEngineer: 'Robert Brown',
    cost: 450000,
    inStock: true,
    category: 'Life Support',
    itemQuality: 88,
    origin: '🇦🇺 Australia',
    quantity: 6,
    valueStock: 2700000,
    repairable: true,
    supplierName: 'GreenGrow',
    restockDate: '2026-06-25',
    operationalStatus: 'Operational',
  },
  {
    id: 907454,
    itemName: 'Satellite Dish',
    itemNo: 'SD-55',
    leadEngineer: 'Emily Wilson',
    cost: 300000,
    inStock: false,
    category: 'Communication',
    itemQuality: 70,
    origin: '🇺🇸 USA',
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: 'CommTech',
    restockDate: '2026-07-05',
    operationalStatus: 'Decommissioned',
  },
  {
    id: 841637,
    itemName: 'Thermal Regulator',
    itemNo: 'TR-66',
    leadEngineer: 'Olivia Taylor',
    cost: 650000,
    inStock: true,
    category: 'Energy',
    itemQuality: 82,
    origin: '🇷🇺 Russia',
    quantity: 8,
    valueStock: 5200000,
    repairable: false,
    supplierName: 'ThermoTech',
    restockDate: '2026-08-15',
    operationalStatus: 'Operational',
  },
  {
    id: 947335,
    itemName: 'Landing Gear',
    itemNo: 'LG-77',
    leadEngineer: 'David Lee',
    cost: 250000,
    inStock: true,
    category: 'Lander',
    itemQuality: 75,
    origin: '🇫🇷 France',
    quantity: 10,
    valueStock: 2500000,
    repairable: false,
    supplierName: 'LandingWorks',
    restockDate: '2026-09-20',
    operationalStatus: 'Operational',
  },
  {
    id: 629849,
    itemName: 'Radiation Shield',
    itemNo: 'RS-88',
    leadEngineer: 'Sophia Martinez',
    cost: 900000,
    inStock: true,
    category: 'Equipment',
    itemQuality: 95,
    origin: '🇧🇷 Brazil',
    quantity: 3,
    valueStock: 2700000,
    repairable: false,
    supplierName: 'ShieldPro',
    restockDate: '2026-10-30',
    operationalStatus: 'Operational',
  },
  {
    id: 519304,
    itemName: 'Fuel Cell',
    itemNo: 'FC-99',
    leadEngineer: 'James Anderson',
    cost: 550000,
    inStock: true,
    category: 'Propulsion',
    itemQuality: 89,
    origin: '🇨🇦 Canada',
    quantity: 5,
    valueStock: 2750000,
    repairable: true,
    supplierName: 'FuelWorks',
    restockDate: '2026-11-22',
    operationalStatus: 'Operational',
  },
];

const data = inputData.map((item) => ({
  ...item,
  restockDate: moment(new Date(item.restockDate)).format(DATE_FORMAT_US),
}));

/* end:skip-in-preview */
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1');
const cellDefinition = {
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    td.innerText = moment(new Date(value), cellProperties.renderFormat).format(cellProperties.renderFormat);

    return td;
  }),
  editor: editorFactory({
    position: 'portal',
    shortcuts: [
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pickaday.adjustDate('subtract', 1);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowRight']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pickaday.adjustDate('add', 1);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowUp']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pickaday.adjustDate('subtract', 7);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowDown']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pickaday.adjustDate('add', 7);
          _event.preventDefault();
        },
      },
    ],
    init(editor) {
      editor.parentDestroyed = false;
      // create the input element on init. This is a text input that color picker will be attached to.
      editor.input = editor.hot.rootDocument.createElement('INPUT');
      // editor.showDatepicker = (editor, event) => {
      editor.datePicker = editor.container;
      /**
       * Prevent recognizing clicking on datepicker as clicking outside of table.
       */
      editor.hot.rootDocument.addEventListener('mousedown', (event) => {
        if (event.target && event.target.classList.contains('pika-day')) {
          editor.hideDatepicker(editor);
        }
      });
      // TODO: fix this https://github.com/handsontable/dev-handsontable/issues/3004
      // @ts-ignore
      // editor.hot.rootPortalElement.appendChild(editor.datePicker);
    },
    // afterInit(editor) {
    //   editor.pickaday = new Pikaday(editor.getDatePickerConfig(editor));
    // },
    getDatePickerConfig(editor) {
      const htInput = editor.input;
      const options = {};

      if (editor.cellProperties && editor.cellProperties.datePickerConfig) {
        Object.assign(options, editor.cellProperties.datePickerConfig);
      }

      const origOnSelect = options.onSelect;
      const origOnClose = options.onClose;

      options.field = htInput;
      options.trigger = htInput;
      options.container = editor.datePicker;
      options.bound = false;
      options.keyboardInput = false;
      options.format = options.format ?? editor.getDateFormat(editor);
      options.reposition = options.reposition || false;
      // Set the RTL to `false`. Due to the https://github.com/Pikaday/Pikaday/issues/647 bug, the layout direction
      // of the date picker is controlled by juggling the "dir" attribute of the root date picker element.
      options.isRTL = false;
      options.onSelect = function (date) {
        let dateStr;

        if (!isNaN(date.getTime())) {
          dateStr = moment(date).format(editor.getDateFormat(editor));
        }

        editor.setValue(dateStr);

        if (origOnSelect) {
          origOnSelect.call(editor.pickaday, date);
        }

        if (Handsontable.helper.isMobileBrowser()) {
          editor.hideDatepicker(editor);
        }
      };
      options.onClose = () => {
        if (!editor.parentDestroyed) {
          editor.finishEditing(false);
        }

        if (origOnClose) {
          origOnClose();
        }
      };

      return options;
    },
    hideDatepicker(editor) {
      editor.pickaday.hide();
    },
    showDatepicker(editor, event) {
      const dateFormat = editor.getDateFormat(editor);
      // TODO: view is not exported in the handsontable library d.ts, so we need to use @ts-ignore
      // @ts-ignore
      const isMouseDown = editor.hot.view.isMouseDown();
      const isMeta = event && 'keyCode' in event ? Handsontable.helper.isFunctionKey(event.keyCode) : false;

      let dateStr;

      editor.datePicker.style.display = 'block';
      editor.pickaday = new Pikaday(editor.getDatePickerConfig(editor));

      // TODO: useMoment is not exported in the pikaday library d.ts, so we need to use @ts-ignore
      // @ts-ignore
      if (typeof editor.pickaday.useMoment === 'function') {
        // @ts-ignore
        editor.pickaday.useMoment(moment);
      }

      // TODO: _onInputFocus is not exported in the pikaday library d.ts, so we need to use @ts-ignore
      // @ts-ignore
      editor.pickaday._onInputFocus = function () {};

      if (editor.originalValue) {
        dateStr = editor.originalValue;

        if (moment(dateStr, dateFormat, true).isValid()) {
          editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
        }

        // workaround for date/time cells - pikaday resets the cell value to 12:00 AM by default, this will overwrite the value.
        if (editor.getValue() !== editor.originalValue) {
          editor.setValue(editor.originalValue);
        }

        if (!isMeta && !isMouseDown) {
          editor.setValue('');
        }
      } else if (editor.cellProperties.defaultDate) {
        dateStr = editor.cellProperties.defaultDate;

        if (moment(dateStr, dateFormat, true).isValid()) {
          editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
        }

        if (!isMeta && !isMouseDown) {
          editor.setValue('');
        }
      } else {
        // if a default date is not defined, set a soft-default-date: display the current day and month in the
        // datepicker, but don't fill the editor input
        editor.pickaday.gotoToday();
      }
    },
    afterClose(editor) {
      if (editor.pickaday.destroy) {
        editor.pickaday.destroy();
      }
    },
    afterOpen(editor, event) {
      copyStyleFromElements(
        editor.TD,
        editor.input,
        [
          'width',
          'height',
          'background',
          'font-family',
          'font-size',
          'font-weight',
          'line-height',
          'color',
          'box-sizing',
        ],
        ['border-', 'padding-', 'margin-']
      );
      editor.showDatepicker(editor, event);
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    },
    getDateFormat(editor) {
      return editor.cellProperties.dateFormat ?? DEFAULT_DATE_FORMAT;
    },
  }),
};

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  height: 600,
  colHeaders: ['ID', 'Item Name', 'Restock Date UE', 'Restock Date US', 'Custom Editor'],
  autoRowSize: true,
  rowHeaders: true,
  columns: [
    { data: 'id', type: 'numeric', width: 150 },
    {
      data: 'itemName',
      type: 'text',
      width: 150,
    },
    {
      data: 'restockDate',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US,
      dateFormat: DATE_FORMAT_US,
      correctFormat: true,
      defaultDate: '01/01/2020',
      // datePicker additional options
      // (see https://github.com/dbushell/Pikaday#configuration)
      datePickerConfig: {
        // First day of the week (0: Sunday, 1: Monday, etc)
        firstDay: 0,
        showWeekNumber: true,
        disableDayFn(date) {
          // Disable Sunday and Saturday
          return date.getDay() === 0 || date.getDay() === 6;
        },
      },
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
