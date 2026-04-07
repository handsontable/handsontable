import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
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
  selectionMode: 'multiple',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const dropdown = document.querySelector('#selectionDropdown');
const trigger = document.querySelector('#selectionTrigger');
const menu = document.querySelector('#selectionMenu');
const label = document.querySelector('#selectionLabel');

trigger.addEventListener('click', () => {
  const isOpen = !menu.hidden;

  menu.hidden = isOpen;
  trigger.setAttribute('aria-expanded', String(!isOpen));
});

menu.addEventListener('click', (e) => {
  const item = e.target.closest('li[data-value]');

  if (item) {
    label.textContent = item.textContent.trim();
    menu.querySelectorAll('li').forEach((li) => li.setAttribute('aria-selected', 'false'));
    item.setAttribute('aria-selected', 'true');
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    hot.updateSettings({ selectionMode: item.dataset.value });
  }
});

document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menu.hidden) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }
});
