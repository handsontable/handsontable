import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
// CSS must be imported for the color picker to work in production
// import "@melloware/coloris/dist/coloris.css";
import Coloris from '@melloware/coloris';

Coloris.init();
// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */
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

export const data = inputData.map(el => ({
  ...el,
  // eslint-disable-next-line no-mixed-operators
  color: `#${
    // eslint-disable-next-line no-mixed-operators
    Math.round(0x1000000 + 0xffffff * Math.random())
      .toString(16)
      .slice(1)
      .toUpperCase()
  }`,
}));
/* end:skip-in-preview */
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1');
const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.style.backgroundColor = `${value}`;
    td.innerHTML = `<b>${value}</b>`;

    return td;
  }),
  validator: (value, callback) => {
    callback(value.length === 7 && value[0] === '#'); // validate color format
  },
  editor: Handsontable.editors.BaseEditor.factory({
    init(editor) {
      // create the input element on init. This is a text input that color picker will be attached to.
      editor.wrapper = editor.hot.rootDocument.createElement('DIV');
      editor.wrapper.style.display = 'none';
      editor.wrapper.classList.add('htSelectEditor');
      editor.input = editor.hot.rootDocument.createElement('INPUT');
      editor.input.setAttribute('data-coloris', '');
      editor.input.style = 'width: 100%; height: 100%; padding: 0;margin: 0;border: none; opacity: 0;';
      editor.hot.rootElement.appendChild(editor.wrapper);
      editor.wrapper.appendChild(editor.input);
      Coloris({ el: editor.input, closeButton: true, closeLabel: 'Apply Colour', alpha: false, wrap: false });
      editor.input.addEventListener('close', () => {
        editor.finishEditing(); // close the color picker and save value on pressing "Apply Colour"
      });
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    },
    open(editor) {
      const rect = editor.getEditedCellRect();

      // eslint-disable-next-line max-len
      editor.wrapper.style = `display: block; border:none; padding:0; position: absolute; top: ${rect.top}px; left: ${rect.start}px; width: ${rect.width}px; height: ${rect.height}px;`;
      editor.input.click(); // open the color picker
    },
    focus(editor) {
      editor.input.focus();
    },
    close(editor) {
      editor.wrapper.style.display = 'none';
    },
  }),
};

// Define configuration options for the Handsontable
const hotOptions = {
  themeName: 'ht-theme-main',
  data,
  colHeaders: ['ID', 'Item Name', 'Item Color'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    {
      data: 'itemName',
      type: 'text',
    },
    {
      data: 'color',
      ...cellDefinition,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
