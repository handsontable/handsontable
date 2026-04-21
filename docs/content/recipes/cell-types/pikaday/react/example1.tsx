import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';
import Handsontable from 'handsontable/base';
import './example1.css';

registerAllModules();

const DATE_FORMAT_US = 'MM/DD/YYYY';
const DEFAULT_DATE_FORMAT = DATE_FORMAT_US;

interface PikadayEditorInstance {
  parentDestroyed: boolean;
  input: HTMLInputElement;
  datePicker: HTMLElement;
  pickaday: Pikaday;
}

const pikadayRenderer = rendererFactory(({ td, value, cellProperties }) => {
  td.innerText = value ? moment(new Date(value as string), cellProperties.renderFormat).format(cellProperties.renderFormat) : '';
});

const pikadayEditor = editorFactory<PikadayEditorInstance>({
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
    editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
    editor.datePicker = editor.container;
    editor.hot.rootDocument.addEventListener('mousedown', (event: MouseEvent) => {
      const target = event.target as Element;

      if (target && target.classList.contains('pika-day')) {
        editor.hideDatepicker(editor);
      }
    });
  },
  getDatePickerConfig(editor: any) {
    const htInput = editor.input;
    const options: Record<string, any> = {};

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
    options.isRTL = false;
    options.onSelect = function (date: Date) {
      let dateStr: string | undefined;

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
  hideDatepicker(editor: any) {
    editor.pickaday.hide();
  },
  showDatepicker(editor: any, event: Event) {
    const dateFormat = editor.getDateFormat(editor);
    // @ts-ignore
    const isMouseDown = editor.hot.view.isMouseDown();
    const isMeta =
      event && 'keyCode' in event ? Handsontable.helper.isFunctionKey((event as KeyboardEvent).keyCode) : false;

    let dateStr: string;

    editor.datePicker.style.display = 'block';
    editor.pickaday = new Pikaday(editor.getDatePickerConfig(editor));

    // @ts-ignore
    if (typeof editor.pickaday.useMoment === 'function') {
      // @ts-ignore
      editor.pickaday.useMoment(moment);
    }

    // @ts-ignore
    editor.pickaday._onInputFocus = function () {};

    if (editor.originalValue) {
      dateStr = editor.originalValue;

      if (moment(dateStr, dateFormat, true).isValid()) {
        editor.pickaday.setMoment(moment(dateStr, dateFormat), true);
      }

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
      editor.pickaday.gotoToday();
    }
  },
  afterClose(editor: any) {
    if (editor.pickaday.destroy) {
      editor.pickaday.destroy();
    }
  },
  afterOpen(editor: any, event: Event) {
    const cellRect = editor.TD.getBoundingClientRect();

    editor.input.style.width = `${cellRect.width}px`;
    editor.input.style.height = `${cellRect.height}px`;
    editor.showDatepicker(editor, event);
  },
  getValue(editor) {
    return editor.input.value;
  },
  setValue(editor, value) {
    editor.input.value = value;
  },
  getDateFormat(editor: any): string {
    return editor.cellProperties.dateFormat ?? DEFAULT_DATE_FORMAT;
  },
});

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

const inputData: InventoryItem[] = [
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
    itemName: 'Navigation',
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
];

const data = inputData.map((item) => ({
  ...item,
  restockDate: moment(new Date(item.restockDate)).format(DATE_FORMAT_US),
}));
/* end:skip-in-preview */

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      height="auto"
      colHeaders={['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost']}
      autoRowSize={true}
      rowHeaders={true}
      width="100%"
      autoWrapRow={true}
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="itemName" type="text" width={130} />
      <HotColumn data="category" type="text" width={120} />
      <HotColumn data="leadEngineer" type="text" width={150} />
      <HotColumn
        data="restockDate"
        width={150}
        allowInvalid={false}
        hotRenderer={pikadayRenderer}
        hotEditor={pikadayEditor}
        renderFormat={DATE_FORMAT_US}
        dateFormat={DATE_FORMAT_US}
        correctFormat={true}
        defaultDate="01/01/2020"
        datePickerConfig={{
          firstDay: 0,
          showWeekNumber: true,
          disableDayFn(date: Date) {
            return date.getDay() === 0 || date.getDay() === 6;
          },
        }}
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
