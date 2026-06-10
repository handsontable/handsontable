import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';
import Handsontable from 'handsontable/base';
import './example1.css';

registerAllModules();

const correctFormat = (value, dateFormat) => {
  const dateFromDate = moment(value);
  const dateFromMoment = moment(value, dateFormat);
  const isAlphanumeric = value.search(/[A-Za-z]/g) > -1;
  let date;

  if (
    (dateFromDate.isValid() && dateFromDate.format('x') === dateFromMoment.format('x')) ||
    !dateFromMoment.isValid() ||
    isAlphanumeric
  ) {
    date = dateFromDate;
  } else {
    date = dateFromMoment;
  }

  return date.format(dateFormat);
};

const cellDateTypeDefinition = {
  renderer: getRenderer('text'),
  validator(value, callback) {
    let valid = true;

    if (value === null || value === undefined) {
      value = '';
    }

    let isValidFormat = moment(value, this.dateFormat, true).isValid();
    let isValidDate = moment(new Date(value)).isValid() || isValidFormat;

    if (this.allowEmpty && value === '') {
      isValidDate = true;
      isValidFormat = true;
    }

    if (!isValidDate) {
      valid = false;
    }

    if (!isValidDate && isValidFormat) {
      valid = true;
    }

    if (isValidDate && !isValidFormat) {
      if (this.correctFormat === true) {
        const correctedValue = correctFormat(value, this.dateFormat);

        this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'dateValidator');
        valid = true;
      } else {
        valid = false;
      }
    }

    callback(valid);
  },
  editor: editorFactory({
    position: 'portal',
    shortcuts: [
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('subtract', 1);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowRight']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('add', 1);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowUp']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('subtract', 7);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowDown']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('add', 7);
          _event.preventDefault();
        },
      },
    ],
    init(editor) {
      editor.parentDestroyed = false;
      editor.input = editor.hot.rootDocument.createElement('input');
      editor.datePicker = editor.container;
      editor.hot.rootDocument.addEventListener('mousedown', (event) => {
        if (event.target && event.target.classList.contains('pika-day')) {
          editor.hideDatepicker(editor);
        }
      });
    },
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
      options.isRTL = false;
      options.onSelect = function (date) {
        let dateStr;

        if (!isNaN(date.getTime())) {
          dateStr = moment(date).format(editor.getDateFormat(editor));
        }

        editor.setValue(dateStr);

        if (origOnSelect) {
          origOnSelect.call(editor.pikaday, date);
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
      editor.pikaday.hide();
    },
    showDatepicker(editor, event) {
      const dateFormat = editor.getDateFormat(editor);
      // @ts-ignore
      const isMouseDown = editor.hot.view.isMouseDown();
      const isMeta = event && 'keyCode' in event ? Handsontable.helper.isFunctionKey(event.keyCode) : false;
      let dateStr;

      editor.datePicker.style.display = 'block';
      editor.pikaday = new Pikaday(editor.getDatePickerConfig(editor));

      // @ts-ignore
      if (typeof editor.pikaday.useMoment === 'function') {
        // @ts-ignore
        editor.pikaday.useMoment(moment);
      }

      // @ts-ignore
      editor.pikaday._onInputFocus = function () {};

      if (editor.originalValue) {
        dateStr = editor.originalValue;

        if (moment(dateStr, dateFormat, true).isValid()) {
          editor.pikaday.setMoment(moment(dateStr, dateFormat), true);
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
          editor.pikaday.setMoment(moment(dateStr, dateFormat), true);
        }

        if (!isMeta && !isMouseDown) {
          editor.setValue('');
        }
      } else {
        editor.pikaday.gotoToday();
      }
    },
    afterClose(editor) {
      if (editor.pikaday.destroy) {
        editor.pikaday.destroy();
      }
    },
    afterOpen(editor, event) {
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
    getDateFormat(editor) {
      return editor.cellProperties.dateFormat ?? 'DD/MM/YYYY';
    },
  }),
};

registerCellType('moment-date', cellDateTypeDefinition);

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
      colHeaders={['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost']}
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
        data="restockDate"
        type="moment-date"
        width={150}
        dateFormat="YYYY-MM-DD"
        correctFormat={true}
        datePickerConfig={{
          firstDay: 0,
          showWeekNumber: true,
          disableDayFn(date) {
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
