import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { registerEditor } from 'handsontable/editors/registry';
import { TextEditor } from 'handsontable/editors/textEditor';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
registerAllModules();
const DATE_FORMAT = 'Y-m-d';
/**
 * TextEditor subclass: Flatpickr attaches to the built-in TEXTAREA in open(),
 * and the instance is destroyed in close() so listeners and DOM do not leak.
 */
class FlatpickrDateEditor extends TextEditor {
    constructor() {
        super(...arguments);
        this.fp = null;
    }
    static get EDITOR_TYPE() {
        return 'datepicker';
    }
    open() {
        super.open();
        const textarea = this.TEXTAREA;
        const raw = this.getValue();
        const defaultDate = raw ? new Date(raw) : new Date();
        this.fp = flatpickr(textarea, {
            appendTo: this.TEXTAREA_PARENT,
            dateFormat: DATE_FORMAT,
            defaultDate,
            allowInput: true,
            onClose: () => {
                this.finishEditing();
            },
        });
        this.fp.open();
    }
    close() {
        if (this.fp) {
            this.fp.destroy();
            this.fp = null;
        }
        super.close();
    }
}
registerEditor('datepicker', FlatpickrDateEditor);
/* start:skip-in-preview */
const data = [
    { task: 'Ship release notes', owner: 'Docs', dueDate: '2026-04-20' },
    { task: 'Fix flaky E2E test', owner: 'QA', dueDate: '2026-04-28' },
    { task: 'Review security audit', owner: 'Security', dueDate: '2026-05-05' },
];
/* end:skip-in-preview */
const container = document.querySelector('#example1');
// eslint-disable-next-line no-unused-vars -- instance kept for recipe preview
const hot = new Handsontable(container, {
    data,
    rowHeaders: true,
    colHeaders: ['Task', 'Owner', 'Due date'],
    height: 'auto',
    width: '100%',
    columns: [
        { data: 'task', type: 'text', width: 220 },
        { data: 'owner', type: 'text', width: 120 },
        {
            data: 'dueDate',
            type: 'text',
            editor: 'datepicker',
            width: 140,
        },
    ],
    licenseKey: 'non-commercial-and-evaluation',
});
