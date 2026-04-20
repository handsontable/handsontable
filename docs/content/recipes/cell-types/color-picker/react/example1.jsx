import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';
import './example1.css';

registerAllModules();

const colorPickerRenderer = rendererFactory(({ td, value }) => {
  td.innerHTML = `<span class="color-picker-cell"><span class="color-picker-swatch" style="background:${value}"></span></span>`;
});

const colorPickerValidator = (value, callback) => {
  callback(value.length === 7 && value[0] === '#');
};

const colorPickerEditor = editorFactory({
  init(editor) {
    editor.input = editor.hot.rootDocument.createElement('INPUT');
    editor.input.setAttribute('aria-label', 'Open color picker');
    editor.input.classList.add('color-picker-editor');
  },
  afterInit(editor) {
    const button = editor.hot.rootDocument.createElement('button');
    button.textContent = 'Open color picker';
    button.classList.add('color-picker-button');
    editor.input.after(button);

    editor.pickr = Pickr.create({
      el: button,
      theme: 'nano',
      default: editor.input.value || '#000000',
      autoReposition: false,
      padding: 0,
      components: {
        preview: true,
        hue: true,
      },
    });

    editor.pickr._root.root.style.height = '0';
    editor.pickr._root.root.style.overflow = 'hidden';

    editor.preventCloseElement = editor.pickr._root.app;

    editor.pickr.on('change', (color) => {
      if (color) {
        const hex = color.toHEXA().toString();
        editor.input.value = hex;
      }
    });

    editor.pickr.on('hide', () => {
      if (Date.now() - editor._openedAt < 400) {
        editor.pickr.show();

        return;
      }
      editor.finishEditing();
    });
  },
  afterOpen(editor) {
    editor._openedAt = Date.now();
    editor.pickr.setColor(editor.input.value || '#000000');
    editor.pickr.show();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cellRect = editor.TD.getBoundingClientRect();

        editor.pickr._root.app.style.top = `${cellRect.bottom}px`;
      });
    });
  },
  afterClose(editor) {
    editor.pickr._root.app.classList.remove('visible');
    editor.pickr.hide();
  },
  getValue(editor) {
    return editor.input.value;
  },
  setValue(editor, value) {
    editor.input.value = value;
  },
  shortcuts: [
    {
      keys: [['Tab']],
      callback: (editor) => {
        editor.pickr.hide();
      },
    },
  ],
});

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
];

const data = inputData.map((el) => ({
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

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['ID', 'Item Name', 'Item Color', 'Item No.', 'Cost', 'Value in Stock']}
      autoRowSize={true}
      rowHeaders={true}
      height="auto"
      width="100%"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="id" type="numeric" width={80} headerClassName="htLeft" />
      <HotColumn data="itemName" type="text" width={200} headerClassName="htLeft" />
      <HotColumn
        data="color"
        headerClassName="htLeft"
        hotRenderer={colorPickerRenderer}
        hotEditor={colorPickerEditor}
        validator={colorPickerValidator}
      />
      <HotColumn data="itemNo" type="text" width={100} headerClassName="htLeft" />
      <HotColumn data="cost" type="numeric" width={70} headerClassName="htLeft" />
      <HotColumn data="valueStock" type="numeric" width={130} headerClassName="htRight" />
    </HotTable>
  );
};

export default ExampleComponent;
