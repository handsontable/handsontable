import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example2')!;

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7'],
    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8'],
    ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9'],
  ],
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const getButton = document.querySelector('#getButton')!;
const output = document.querySelector('#output')!;

getButton.addEventListener('click', () => {
  const selected = hot.getSelected() || [];
  let data: Handsontable.CellValue[] = [];

  if (selected.length === 1) {
    data = hot.getData(...selected[0]!);
  } else {
    for (let i = 0; i < selected.length; i += 1) {
      data.push(hot.getData(...selected[i]!));
    }
  }

  (output as HTMLElement).innerText = JSON.stringify(data);
});
