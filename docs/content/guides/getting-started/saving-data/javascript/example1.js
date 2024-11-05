import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1');
const exampleConsole = document.querySelector('#output');
const autosave = document.querySelector('#autosave');
const load = document.querySelector('#load');
const save = document.querySelector('#save');
const hot = new Handsontable(container, {
  startRows: 8,
  startCols: 6,
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  afterChange(change, source) {
    if (source === 'loadData') {
      return; // don't save this change
    }

    if (!change) {
      return;
    }

    if (!autosave.checked) {
      return;
    }

    fetch('{{$basePath}}/scripts/json/save.json', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: change }),
    }).then(() => {
      exampleConsole.innerText = `Autosaved (${change.length} cell${
        change.length > 1 ? 's' : ''
      })`;
      console.log('The POST request is only used here for the demo purposes');
    });
  },
  autoWrapRow: true,
  autoWrapCol: true,
});

load.addEventListener('click', () => {
  fetch('{{$basePath}}/scripts/json/load.json').then((response) => {
    response.json().then((data) => {
      hot.loadData(data.data);
      // or, use `updateData()` to replace `data` without resetting states
      exampleConsole.innerText = 'Data loaded';
    });
  });
});
save.addEventListener('click', () => {
  // save all cell's data
  fetch('{{$basePath}}/scripts/json/save.json', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: hot.getData() }),
  }).then(() => {
    exampleConsole.innerText = 'Data saved';
    console.log('The POST request is only used here for the demo purposes');
  });
});
autosave.addEventListener('click', () => {
  if (autosave.checked) {
    exampleConsole.innerText = 'Changes will be autosaved';
  } else {
    exampleConsole.innerText = 'Changes will not be autosaved';
  }
});
