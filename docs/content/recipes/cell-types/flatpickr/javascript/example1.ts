import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { format, isDate } from 'date-fns';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { CellProperties } from 'handsontable/settings';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';

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
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1')!;

interface FlatpickrEditorInstance {
  input: HTMLInputElement;
  flatpickr: flatpickr.Instance;
  preventCloseElement: HTMLElement;
  _darkThemeLink: HTMLLinkElement;
}

const cellDefinition: Pick<
  CellProperties,
  'renderer' | 'validator' | 'editor'
> = {
  validator: (value, callback) => {
    callback(isDate(new Date(value)));
  },
  renderer: rendererFactory(({ td, value, cellProperties }) => {
    td.innerText = value ? format(new Date(value), cellProperties.renderFormat) : '';
  }),
  editor: editorFactory<FlatpickrEditorInstance>({
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('INPUT') as HTMLInputElement;
      editor.input.classList.add('flatpickr-editor');

      editor.flatpickr = flatpickr(editor.input, {
        dateFormat: 'Y-m-d',
        disableMobile: true,
        onClose: () => {
          editor.finishEditing();
        },
      });

      editor.preventCloseElement = editor.flatpickr.calendarContainer;

      /**
       * Prepare dark theme stylesheet for dynamic loading.
       */
      editor._darkThemeLink = editor.hot.rootDocument.createElement('LINK') as HTMLLinkElement;
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
        editor.flatpickr.set(key as keyof flatpickr.Options.Options, cellProperties.flatpickrSettings[key]);
      }
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
      editor.flatpickr.setDate(value ? new Date(value) : new Date());
    },
  }),
};

// Define configuration options for the Handsontable
const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Product', 'Version', 'Release (EU)', 'Release (US)', 'Status'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'product', type: 'text', width: 200 },
    { data: 'version', type: 'text', width: 80 },
    {
      data: 'releaseDate',
      width: 130,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_EU,
      flatpickrSettings: {
        locale: {
          firstDayOfWeek: 1,
        },
      },
    },
    {
      data: 'releaseDate',
      width: 130,
      allowInvalid: false,
      ...cellDefinition,
      renderFormat: DATE_FORMAT_US,
      flatpickrSettings: {
        locale: {
          firstDayOfWeek: 0,
        },
      },
    },
    { data: 'status', type: 'text', width: 130 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
