import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import multipleSelect from 'multiple-select-vanilla';
import type { MultipleSelectInstance } from 'multiple-select-vanilla';

// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */

type ExtendedEditor<T> = Handsontable.editors.BaseEditor & {
  render: (editor: ExtendedEditor<T>) => void;
  value?: any;
  config?: any;
} & T;

export const editorFactory = <T>({
  init,
  afterOpen,
  afterInit,
  beforeOpen,
  getValue,
  setValue,
  onFocus,
  shortcuts,
  value,
  // valueObject,
  render,
  config,
  ...args
}: {
  value?: T extends { value: any } ? T['value'] : any;
  // valueObject?: T extends { valueObject: any } ? T['valueObject'] : any;
  config?: T extends { config: any } ? T['config'] : any;
  render?: (editor: ExtendedEditor<T>) => void;
  init: (editor: ExtendedEditor<T>) => void;
  afterOpen?: (editor: ExtendedEditor<T>) => void;
  afterInit?: (editor: ExtendedEditor<T>) => void;
  beforeOpen?: (
    editor: ExtendedEditor<T>,
    {
      row,
      col,
      prop,
      td,
      originalValue,
      cellProperties,
    }: {
      row: number;
      col: number;
      prop: string | number;
      td: HTMLTableCellElement;
      originalValue: any;
      cellProperties: Handsontable.CellProperties;
    }
  ) => void;
  getValue?: (editor: ExtendedEditor<T>) => any;
  setValue?: (editor: ExtendedEditor<T>, value: any) => void;
  onFocus?: (editor: ExtendedEditor<T>) => void;
  // TODO Shortcut type is not exported
  shortcuts?: {
    keys: string[][];
    callback: (editor: ExtendedEditor<T>, event: Event) => boolean | void;
    group?: string;
    runOnlyIf?: () => boolean;
    captureCtrl?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    relativeToGroup?: string;
    position?: 'before' | 'after';
    forwardToContext?: any;
    // TODO Context type is not exported
    // forwardToContext?: Handsontable.Context;
  }[];
} & Record<string, any>) => {
  // TODO: This should be a unique id for the editor
  const SHORTCUTS_GROUP = 'ee';

  const registerShortcuts = (editor: ExtendedEditor<T>) => {
    const shortcutManager = editor.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor')!;
    const contextConfig = {
      group: SHORTCUTS_GROUP,
    };

    if (shortcuts) {
      editorContext.addShortcuts(
        shortcuts.map((shortcut) => ({
          ...shortcut,
          callback: (event: KeyboardEvent) => shortcut.callback(editor, event),
        })),
        // @ts-ignore
        contextConfig
      );
    }
  };

  return Handsontable.editors.BaseEditor.factory<
    ExtendedEditor<T> & { container: HTMLDivElement; _open: boolean; input: HTMLElement }
  >({
    init(editor) {
      Object.assign(editor, { value, config, render, ...args });
      // create the input element on init. This is a text input that color picker will be attached to.
      editor._open = false;
      editor.container = editor.hot.rootDocument.createElement('DIV') as HTMLDivElement;
      editor.container.style.display = 'none';
      editor.container.classList.add('htSelectEditor');
      editor.hot.rootElement.appendChild(editor.container);
      init(editor);

      if (!editor.input) {
        console.error('input not found');
      }

      editor.container.appendChild(editor.input);

      if (typeof afterInit === 'function') {
        afterInit(editor);
      }
    },
    getValue(editor) {
      if (typeof getValue === 'function') {
        return getValue(editor);
      }

      return editor.value;
    },
    setValue(editor, value) {
      if (typeof setValue === 'function') {
        setValue(editor, value);
      } else {
        editor.value = value;
      }

      if (typeof render === 'function') {
        render(editor);
      }
    },
    open(editor) {
      const rect = editor.getEditedCellRect()!;

      editor.container.style = `display: block; border:none; box-sizing: border-box; margin:0; padding:0px; position: absolute; top: ${rect.top}px; left: ${rect.start}px; width: ${rect.width}px; height: ${rect.height}px;`;
      editor.container.classList.add('ht_editor_visible');

      if (afterOpen) {
        window.requestAnimationFrame(() => {
          afterOpen(editor);
        });
      }

      editor._open = true;
      editor.hot.getShortcutManager().setActiveContextName('editor');
      registerShortcuts(editor);
    },
    focus(editor) {
      if (typeof onFocus === 'function') {
        onFocus(editor);
      } else {
        editor.container
          .querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            // @ts-ignore
          )
          ?.focus();
      }
    },
    close(editor) {
      editor._open = false;
      editor.container.style.display = 'none';
      editor.container.classList.remove('ht_editor_visible');

      const shortcutManager = editor.hot.getShortcutManager();
      const editorContext = shortcutManager.getContext('editor')!;

      editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
    },
    prepare(editor, row, col, prop, td, originalValue, cellProperties) {
      if (typeof beforeOpen === 'function') {
        beforeOpen(editor, {
          row,
          col,
          prop,
          td,
          originalValue,
          cellProperties,
        });
      } else {
        editor.setValue(originalValue);
      }
    },
  });
};

const components = [
  { value: '1', label: 'Component 1' },
  { value: '2', label: 'Component 2' },
  { value: '3', label: 'Component 3' },
];

const countryListAlpha2 = {
  AF: 'Afghanistan',
  AL: 'Albania',
  DZ: 'Algeria',
  AS: 'American Samoa',
  AD: 'Andorra',
  AO: 'Angola',
  AI: 'Anguilla',
  AQ: 'Antarctica',
  AG: 'Antigua and Barbuda',
  AR: 'Argentina',
  AM: 'Armenia',
  AW: 'Aruba',
  AU: 'Australia',
  AT: 'Austria',
  AZ: 'Azerbaijan',
  BS: 'Bahamas (the)',
  BH: 'Bahrain',
  BD: 'Bangladesh',
  BB: 'Barbados',
  BY: 'Belarus',
  BE: 'Belgium',
  BZ: 'Belize',
  BJ: 'Benin',
  BM: 'Bermuda',
  BT: 'Bhutan',
  BO: 'Bolivia (Plurinational State of)',
  BQ: 'Bonaire, Sint Eustatius and Saba',
  BA: 'Bosnia and Herzegovina',
  BW: 'Botswana',
  BV: 'Bouvet Island',
  BR: 'Brazil',
  IO: 'British Indian Ocean Territory (the)',
  BN: 'Brunei Darussalam',
  BG: 'Bulgaria',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  CV: 'Cabo Verde',
  KH: 'Cambodia',
  CM: 'Cameroon',
  CA: 'Canada',
  KY: 'Cayman Islands (the)',
  CF: 'Central African Republic (the)',
  TD: 'Chad',
  CL: 'Chile',
  CN: 'China',
  CX: 'Christmas Island',
  CC: 'Cocos (Keeling) Islands (the)',
  CO: 'Colombia',
  KM: 'Comoros (the)',
  CD: 'Congo (the Democratic Republic of the)',
  CG: 'Congo (the)',
  CK: 'Cook Islands (the)',
  CR: 'Costa Rica',
  HR: 'Croatia',
  CU: 'Cuba',
  CW: 'Curaçao',
  CY: 'Cyprus',
  CZ: 'Czechia',
  CI: "Côte d'Ivoire",
  DK: 'Denmark',
  DJ: 'Djibouti',
  DM: 'Dominica',
  DO: 'Dominican Republic (the)',
  EC: 'Ecuador',
  EG: 'Egypt',
  SV: 'El Salvador',
  GQ: 'Equatorial Guinea',
  ER: 'Eritrea',
  EE: 'Estonia',
  SZ: 'Eswatini',
  ET: 'Ethiopia',
  FK: 'Falkland Islands (the) [Malvinas]',
  FO: 'Faroe Islands (the)',
  FJ: 'Fiji',
  FI: 'Finland',
  FR: 'France',
  GF: 'French Guiana',
  PF: 'French Polynesia',
  TF: 'French Southern Territories (the)',
  GA: 'Gabon',
  GM: 'Gambia (the)',
  GE: 'Georgia',
  DE: 'Germany',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GR: 'Greece',
  GL: 'Greenland',
  GD: 'Grenada',
  GP: 'Guadeloupe',
  GU: 'Guam',
  GT: 'Guatemala',
  GG: 'Guernsey',
  GN: 'Guinea',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HT: 'Haiti',
  HM: 'Heard Island and McDonald Islands',
  VA: 'Holy See (the)',
  HN: 'Honduras',
  HK: 'Hong Kong',
  HU: 'Hungary',
  IS: 'Iceland',
  IN: 'India',
  ID: 'Indonesia',
  IR: 'Iran (Islamic Republic of)',
  IQ: 'Iraq',
  IE: 'Ireland',
  IM: 'Isle of Man',
  IL: 'Israel',
  IT: 'Italy',
  JM: 'Jamaica',
  JP: 'Japan',
  JE: 'Jersey',
  JO: 'Jordan',
  KZ: 'Kazakhstan',
  KE: 'Kenya',
  KI: 'Kiribati',
  KP: "Korea (the Democratic People's Republic of)",
  KR: 'Korea (the Republic of)',
  KW: 'Kuwait',
  KG: 'Kyrgyzstan',
  LA: "Lao People's Democratic Republic (the)",
  LV: 'Latvia',
  LB: 'Lebanon',
  LS: 'Lesotho',
  LR: 'Liberia',
  LY: 'Libya',
  LI: 'Liechtenstein',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MO: 'Macao',
  MG: 'Madagascar',
  MW: 'Malawi',
  MY: 'Malaysia',
  MV: 'Maldives',
  ML: 'Mali',
  MT: 'Malta',
  MH: 'Marshall Islands (the)',
  MQ: 'Martinique',
  MR: 'Mauritania',
  MU: 'Mauritius',
  YT: 'Mayotte',
  MX: 'Mexico',
  FM: 'Micronesia (Federated States of)',
  MD: 'Moldova (the Republic of)',
  MC: 'Monaco',
  MN: 'Mongolia',
  ME: 'Montenegro',
  MS: 'Montserrat',
  MA: 'Morocco',
  MZ: 'Mozambique',
  MM: 'Myanmar',
  NA: 'Namibia',
  NR: 'Nauru',
  NP: 'Nepal',
  NL: 'Netherlands (the)',
  NC: 'New Caledonia',
  NZ: 'New Zealand',
  NI: 'Nicaragua',
  NE: 'Niger (the)',
  NG: 'Nigeria',
  NU: 'Niue',
  NF: 'Norfolk Island',
  MP: 'Northern Mariana Islands (the)',
  NO: 'Norway',
  OM: 'Oman',
  PK: 'Pakistan',
  PW: 'Palau',
  PS: 'Palestine, State of',
  PA: 'Panama',
  PG: 'Papua New Guinea',
  PY: 'Paraguay',
  PE: 'Peru',
  PH: 'Philippines (the)',
  PN: 'Pitcairn',
  PL: 'Poland',
  PT: 'Portugal',
  PR: 'Puerto Rico',
  QA: 'Qatar',
  MK: 'Republic of North Macedonia',
  RO: 'Romania',
  RU: 'Russian Federation (the)',
  RW: 'Rwanda',
  RE: 'Réunion',
  BL: 'Saint Barthélemy',
  SH: 'Saint Helena, Ascension and Tristan da Cunha',
  KN: 'Saint Kitts and Nevis',
  LC: 'Saint Lucia',
  MF: 'Saint Martin (French part)',
  PM: 'Saint Pierre and Miquelon',
  VC: 'Saint Vincent and the Grenadines',
  WS: 'Samoa',
  SM: 'San Marino',
  ST: 'Sao Tome and Principe',
  SA: 'Saudi Arabia',
  SN: 'Senegal',
  RS: 'Serbia',
  SC: 'Seychelles',
  SL: 'Sierra Leone',
  SG: 'Singapore',
  SX: 'Sint Maarten (Dutch part)',
  SK: 'Slovakia',
  SI: 'Slovenia',
  SB: 'Solomon Islands',
  SO: 'Somalia',
  ZA: 'South Africa',
  GS: 'South Georgia and the South Sandwich Islands',
  SS: 'South Sudan',
  ES: 'Spain',
  LK: 'Sri Lanka',
  SD: 'Sudan (the)',
  SR: 'Suriname',
  SJ: 'Svalbard and Jan Mayen',
  SE: 'Sweden',
  CH: 'Switzerland',
  SY: 'Syrian Arab Republic',
  TW: 'Taiwan',
  TJ: 'Tajikistan',
  TZ: 'Tanzania, United Republic of',
  TH: 'Thailand',
  TL: 'Timor-Leste',
  TG: 'Togo',
  TK: 'Tokelau',
  TO: 'Tonga',
  TT: 'Trinidad and Tobago',
  TN: 'Tunisia',
  TR: 'Turkey',
  TM: 'Turkmenistan',
  TC: 'Turks and Caicos Islands (the)',
  TV: 'Tuvalu',
  UG: 'Uganda',
  UA: 'Ukraine',
  AE: 'United Arab Emirates (the)',
  GB: 'United Kingdom of Great Britain and Northern Ireland (the)',
  UM: 'United States Minor Outlying Islands (the)',
  US: 'United States of America (the)',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VU: 'Vanuatu',
  VE: 'Venezuela (Bolivarian Republic of)',
  VN: 'Viet Nam',
  VG: 'Virgin Islands (British)',
  VI: 'Virgin Islands (U.S.)',
  WF: 'Wallis and Futuna',
  EH: 'Western Sahara',
  YE: 'Yemen',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
  AX: 'Åland Islands',
};

export const coutries = Object.entries(countryListAlpha2)
  .map(([value, label]) => ({ value, label }))
  .slice(0, 198); // 199 is the max number of options that can be displayed in the dropdown

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

export const data = inputData.map((el) => ({
  ...el,
  components: components
    .map((n) => {
      return [Math.random(), n];
    })
    .sort()
    .map((n) => {
      return n[1];
    })
    .slice(0, Math.ceil(Math.random() * components.length)),
  countries: coutries
    .map((n) => {
      return [Math.random(), n];
    })
    .sort()
    .map((n) => {
      return n[1];
    })
    .slice(0, Math.ceil(Math.random() * 5)),
}));

/* end:skip-in-preview */

// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1')!;

const cellDefinition = {
  renderer: Handsontable.renderers.factory(({ td, value }) => {
    td.innerHTML = value.length > 0 ? value.map((el: { label: string }) => el.label).join(', ') : 'No elements';

    return td;
  }),
  editor: editorFactory<{ input: HTMLSelectElement; multiselect: MultipleSelectInstance }>({
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('SELECT') as HTMLSelectElement;
      editor.input.setAttribute('multiple', 'multiple');
      editor.input.setAttribute('data-multi-select', '');
      editor.multiselect = multipleSelect(editor.input) as MultipleSelectInstance;
    },

    beforeOpen(editor, { cellProperties }) {
      editor.input.innerHTML = cellProperties?.selectMultipleOptions
        ?.map((el: { value: string; label: string }) => `<option value="${el.value}">${el.label}</option>`)
        .join('');
      editor.multiselect.refresh();
    },
    afterOpen(editor) {
      editor.multiselect.open();
    },
    getValue(editor) {
      return Array.from(editor.input.options)
        .filter((option) => option.selected)
        .map((option) => ({ value: option.value, label: option.label }));
    },
    setValue(editor, value) {
      // https://github.com/handsontable/handsontable/issues/3510
      value = typeof value === 'string' ? editor.originalValue : value;
      Array.from(editor.input.options).forEach(
        (option) => (option.selected = value.some((el: { value: string }) => el.value === option.value))
      );
      editor.multiselect.refresh();
    },
  }),
};

// Define configuration options for the Handsontable
const hotOptions: Handsontable.GridSettings = {
  themeName: 'ht-theme-main',
  data,
  colHeaders: ['ID', 'Item Name', 'Components', 'Countries'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    {
      data: 'countries',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      selectMultipleOptions: coutries,
    },
    {
      data: 'itemName',
      type: 'text',
    },
    {
      data: 'components',
      width: 150,
      allowInvalid: false,
      ...cellDefinition,
      selectMultipleOptions: components,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
