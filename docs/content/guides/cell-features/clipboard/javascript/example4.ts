import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

type CopyRange = { startRow: number; startCol: number; endRow: number; endCol: number };

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;
let copiedClassNames: string[][] = [];

function collectClassNames(hot: Handsontable, coords: CopyRange[]): string[][] {
  const source = coords[0];
  const classNames: string[][] = [];

  if (!source) {
    return classNames;
  }

  for (let row = source.startRow; row <= source.endRow; row += 1) {
    const rowClassNames: string[] = [];

    for (let col = source.startCol; col <= source.endCol; col += 1) {
      rowClassNames.push((hot.getCellMeta(row, col).className as string | undefined) ?? '');
    }

    classNames.push(rowClassNames);
  }

  return classNames;
}

function applyClassNames(hot: Handsontable, coords: CopyRange[]): void {
  const target = coords[0];

  if (!target) {
    return;
  }

  hot.batch(() => {
    copiedClassNames.forEach((rowClassNames, rowOffset) => {
      rowClassNames.forEach((className, colOffset) => {
        hot.setCellMeta(target.startRow + rowOffset, target.startCol + colOffset, 'className', className);
      });
    });
  });

  hot.render();
}

new Handsontable(container, {
  data: [
    ['Wireless mouse', 142, 'In stock'],
    ['USB-C cable', 67, 'In stock'],
    ['Mechanical keyboard', 0, 'Backordered'],
    ['Laptop stand', 38, 'In stock'],
    ['HDMI adapter', 210, 'In stock'],
  ],
  colHeaders: ['Product', 'Stock', 'Status'],
  rowHeaders: true,
  cell: [
    { row: 0, col: 1, className: 'htRight' },
    { row: 0, col: 2, className: 'htCenter' },
    { row: 2, col: 1, className: 'htRight htDimmed' },
    { row: 2, col: 2, className: 'htCenter htDimmed' },
  ],
  afterCopy(_data, coords) {
    copiedClassNames = collectClassNames(this, coords as CopyRange[]);
  },
  afterCut(_data, coords) {
    copiedClassNames = collectClassNames(this, coords as CopyRange[]);
  },
  afterPaste(_data, coords) {
    applyClassNames(this, coords as CopyRange[]);
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
