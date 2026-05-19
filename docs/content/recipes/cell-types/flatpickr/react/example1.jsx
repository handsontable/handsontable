import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { format, isDate } from 'date-fns';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';
import './example1.css';

registerAllModules();

const DATE_FORMAT_US = 'MM/dd/yyyy';
const DATE_FORMAT_EU = 'dd/MM/yyyy';

/* start:skip-in-preview */
const data = [
  {
    product: 'Dashboard Pro',
    category: 'Analytics',
    version: '3.2.0',
    releaseDate: '2025-03-15',
    status: 'Released',
    downloads: 12450,
  },
  {
    product: 'Form Builder',
    category: 'Tools',
    version: '2.1.0',
    releaseDate: '2025-04-22',
    status: 'Released',
    downloads: 8320,
  },
  {
    product: 'Chart Engine',
    category: 'Analytics',
    version: '4.0.0',
    releaseDate: '2025-06-10',
    status: 'Beta',
    downloads: 3100,
  },
  {
    product: 'Auth Module',
    category: 'Security',
    version: '1.5.2',
    releaseDate: '2025-07-01',
    status: 'Released',
    downloads: 15600,
  },
  {
    product: 'File Manager',
    category: 'Storage',
    version: '2.0.0',
    releaseDate: '2025-08-18',
    status: 'Planned',
    downloads: 0,
  },
  {
    product: 'Email Service',
    category: 'Communication',
    version: '3.1.0',
    releaseDate: '2025-09-05',
    status: 'Released',
    downloads: 9870,
  },
  {
    product: 'Search Index',
    category: 'Tools',
    version: '1.2.0',
    releaseDate: '2025-10-12',
    status: 'Beta',
    downloads: 2450,
  },
  {
    product: 'Cache Layer',
    category: 'Infra',
    version: '2.3.1',
    releaseDate: '2025-11-28',
    status: 'Planned',
    downloads: 0,
  },
];
/* end:skip-in-preview */

const flatpickrValidator = (value, callback) => {
  callback(isDate(new Date(value)));
};

const flatpickrRenderer = rendererFactory(({ td, value, cellProperties }) => {
  td.innerText = value ? format(new Date(value), cellProperties.renderFormat) : '';
});

const flatpickrEditor = editorFactory({
  init(editor) {
    editor.input = editor.hot.rootDocument.createElement('INPUT');
    editor.input.classList.add('flatpickr-editor');

    editor.flatpickr = flatpickr(editor.input, {
      dateFormat: 'Y-m-d',
      disableMobile: true,
      onClose: () => {
        editor.finishEditing();
      },
    });

    editor.preventCloseElement = editor.flatpickr.calendarContainer;

    editor._darkThemeLink = editor.hot.rootDocument.createElement('LINK');
    editor._darkThemeLink.rel = 'stylesheet';
    editor._darkThemeLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css';
  },
  afterClose(editor) {
    editor.flatpickr.close();
  },
  afterOpen(editor) {
    const isDark = editor.hot.rootDocument.documentElement.getAttribute('data-theme') === 'dark';
    const head = editor.hot.rootDocument.head;

    if (isDark && !editor._darkThemeLink.parentNode) {
      head.appendChild(editor._darkThemeLink);
    } else if (!isDark && editor._darkThemeLink.parentNode) {
      head.removeChild(editor._darkThemeLink);
    }

    editor.flatpickr.open();
  },
  beforeOpen(editor, { cellProperties }) {
    for (const key in cellProperties.flatpickrSettings) {
      editor.flatpickr.set(key, cellProperties.flatpickrSettings[key]);
    }
  },
  getValue(editor) {
    return editor.input.value;
  },
  setValue(editor, value) {
    editor.input.value = value;
    editor.flatpickr.setDate(value ? new Date(value) : new Date());
  },
});

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Product', 'Version', 'Release (EU)', 'Release (US)', 'Status']}
      autoRowSize={true}
      rowHeaders={true}
      height="auto"
      width="100%"
      autoWrapRow={true}
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="product" type="text" width={200} />
      <HotColumn data="version" type="text" width={80} />
      <HotColumn
        data="releaseDate"
        width={130}
        allowInvalid={false}
        hotRenderer={flatpickrRenderer}
        hotEditor={flatpickrEditor}
        validator={flatpickrValidator}
        renderFormat={DATE_FORMAT_EU}
        flatpickrSettings={{ locale: { firstDayOfWeek: 1 } }}
      />
      <HotColumn
        data="releaseDate"
        width={130}
        allowInvalid={false}
        hotRenderer={flatpickrRenderer}
        hotEditor={flatpickrEditor}
        validator={flatpickrValidator}
        renderFormat={DATE_FORMAT_US}
        flatpickrSettings={{ locale: { firstDayOfWeek: 0 } }}
      />
      <HotColumn data="status" type="text" width={130} />
    </HotTable>
  );
};

export default ExampleComponent;
