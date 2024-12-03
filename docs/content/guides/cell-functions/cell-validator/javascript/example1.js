import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1');
const output = document.querySelector('#output');
const ipValidatorRegexp =
  /^(?:\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b|null)$/;

const emailValidator = (value, callback) => {
  setTimeout(() => {
    if (/.+@.+/.test(value)) {
      callback(true);
    } else {
      callback(false);
    }
  }, 1000);
};

new Handsontable(container, {
  data: [
    {
      id: 1,
      name: { first: 'Joe', last: 'Fabiano' },
      ip: '0.0.0.1',
      email: 'Joe.Fabiano@ex.com',
    },
    {
      id: 2,
      name: { first: 'Fred', last: 'Wecler' },
      ip: '0.0.0.1',
      email: 'Fred.Wecler@ex.com',
    },
    {
      id: 3,
      name: { first: 'Steve', last: 'Wilson' },
      ip: '0.0.0.1',
      email: 'Steve.Wilson@ex.com',
    },
    {
      id: 4,
      name: { first: 'Maria', last: 'Fernandez' },
      ip: '0.0.0.1',
      email: 'M.Fernandez@ex.com',
    },
    {
      id: 5,
      name: { first: 'Pierre', last: 'Barbault' },
      ip: '0.0.0.1',
      email: 'Pierre.Barbault@ex.com',
    },
    {
      id: 6,
      name: { first: 'Nancy', last: 'Moore' },
      ip: '0.0.0.1',
      email: 'Nancy.Moore@ex.com',
    },
    {
      id: 7,
      name: { first: 'Barbara', last: 'MacDonald' },
      ip: '0.0.0.1',
      email: 'B.MacDonald@ex.com',
    },
    {
      id: 8,
      name: { first: 'Wilma', last: 'Williams' },
      ip: '0.0.0.1',
      email: 'Wilma.Williams@ex.com',
    },
    {
      id: 9,
      name: { first: 'Sasha', last: 'Silver' },
      ip: '0.0.0.1',
      email: 'Sasha.Silver@ex.com',
    },
    {
      id: 10,
      name: { first: 'Don', last: 'Pérignon' },
      ip: '0.0.0.1',
      email: 'Don.Pérignon@ex.com',
    },
    {
      id: 11,
      name: { first: 'Aaron', last: 'Kinley' },
      ip: '0.0.0.1',
      email: 'Aaron.Kinley@ex.com',
    },
  ],
  beforeChange(changes) {
    for (let i = changes.length - 1; i >= 0; i--) {
      const currChange = changes[i];

      if (!currChange) {
        return false;
      }

      // gently don't accept the word "foo" (remove the change at index i)
      if (currChange[3] === 'foo') {
        changes.splice(i, 1);
      }
      // if any of pasted cells contains the word "nuke", reject the whole paste
      else if (currChange[3] === 'nuke') {
        return false;
      }
      // capitalise first letter in column 1 and 2
      else if (
        currChange[1] === 'name.first' ||
        currChange[1] === 'name.last'
      ) {
        if (currChange[3] !== null) {
          changes[i][3] =
            currChange[3].charAt(0).toUpperCase() + currChange[3].slice(1);
        }
      }
    }

    return true;
  },
  afterChange(changes, source) {
    if (source !== 'loadData') {
      output.innerText = JSON.stringify(changes);
    }
  },
  colHeaders: ['ID', 'First name', 'Last name', 'IP', 'E-mail'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'ip', validator: ipValidatorRegexp, allowInvalid: true },
    { data: 'email', validator: emailValidator, allowInvalid: false },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
