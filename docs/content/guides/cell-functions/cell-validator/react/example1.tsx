import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { CellChange } from 'handsontable/common';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const [output, setOutput] = useState('');

  const ipValidatorRegexp =
    /^(?:\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b|null)$/;

  const emailValidator = (
    value: string,
    callback: (value: boolean) => void
  ) => {
    setTimeout(() => {
      if (/.+@.+/.test(value)) {
        callback(true);
      } else {
        callback(false);
      }
    }, 1000);
  };

  return (
    <>
      <div className="example-controls-container">
        <output className="console" id="output">
          {output}
        </output>
      </div>
      <HotTable
        data={[
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
        ]}
        beforeChange={function (changes, _source) {
          const cellChanges = changes as CellChange;

          for (let i = changes.length - 1; i >= 0; i--) {
            // gently don't accept the word "foo" (remove the change at index i)
            if (cellChanges[i][3] === 'foo') {
              changes.splice(i, 1);
            }
            // if any of pasted cells contains the word "nuke", reject the whole paste
            else if (cellChanges[i][3] === 'nuke') {
              return false;
            }
            // capitalise first letter in column 1 and 2
            else if (
              cellChanges[i][1] === 'name.first' ||
              cellChanges[i][1] === 'name.last'
            ) {
              if (cellChanges[i][3] !== null) {
                cellChanges[i][3] =
                  cellChanges[i][3].charAt(0).toUpperCase() +
                  cellChanges[i][3].slice(1);
              }
            }
          }
        }}
        afterChange={function (changes, source) {
          if (source !== 'loadData' && source !== 'updateData') {
            setOutput(JSON.stringify(changes));
          }
        }}
        colHeaders={['ID', 'First name', 'Last name', 'IP', 'E-mail']}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        columns={[
          { data: 'id', type: 'numeric' },
          { data: 'name.first' },
          { data: 'name.last' },
          { data: 'ip', validator: ipValidatorRegexp, allowInvalid: true },
          { data: 'email', validator: emailValidator, allowInvalid: false },
        ]}
      />
    </>
  );
};

export default ExampleComponent;
