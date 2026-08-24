import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example5')!;

new Handsontable(container, {
  data: [
    ['Wireless mouse', 142],
    ['USB-C cable', 67],
    ['Mechanical keyboard', -5],
    ['Laptop stand', 38],
    ['HDMI adapter', 210],
  ],
  colHeaders: ['Product', 'Stock'],
  rowHeaders: true,
  comments: true,
  columns: [
    {},
    {
      type: 'numeric',
      validator(value: any, callback: (valid: boolean) => void) {
        callback(Number.isInteger(value) && value >= 0);
      },
    },
  ],
  // Attach a comment when a cell fails validation, and remove it once the cell is valid.
  afterValidate(isValid, value, row, prop) {
    const column = this.propToCol(prop);
    const comments = this.getPlugin('comments');

    if (!isValid) {
      comments.setCommentAtCell(row, column, `"${value}" is not valid. Enter a whole number of 0 or more.`);
    } else {
      comments.removeCommentAtCell(row, column);
    }
  },
  // Validate every cell on load so the pre-existing invalid value is flagged right away.
  afterInit() {
    this.validateCells();
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
