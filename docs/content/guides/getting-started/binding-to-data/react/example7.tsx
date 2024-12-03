import { FC } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import Handsontable from 'handsontable';

interface Person {
  id: number | undefined;
  name: string | undefined;
  address: string | undefined;
  attr: (attr: string, val?: Handsontable.CellValue) => keyof Person | Person;
}

// register Handsontable's modules
registerAllModules();

interface ModelOptions {
  [x: string]: any;
  id?: number;
  name?: string;
  address?: string;
  hasOwnProperty?: (prop: string) => boolean;
}

type PrivPerson = {
  [K in keyof Person]: Person[K];
} & { [key: string]: any };

function model(opts: ModelOptions): Partial<Person> {
  const _pub: Partial<Person> = {
    id: undefined,
    name: undefined,
    address: undefined,
    attr: undefined,
  };

  const _priv: Partial<PrivPerson> = {};

  for (const i in opts) {
    if (opts.hasOwnProperty && opts.hasOwnProperty(i)) {
      _priv[i] = opts[i];
    }
  }

  _pub.attr = function (
    attr: keyof Person | string,
    val?: Handsontable.CellValue
  ) {
    if (typeof val === 'undefined') {
      window.console && console.log('GET the', attr, 'value of', _pub);

      return _priv[attr];
    }

    window.console && console.log('SET the', attr, 'value of', _pub);
    _priv[attr] = val;

    return _pub;
  };

  return _pub;
}

function property(attr: keyof Person | string) {
  return (row: Handsontable.RowObject, value?: Handsontable.CellValue) =>
    (row as Person).attr(attr, value);
}

const data: Partial<Person>[] = [
  model({ id: 1, name: 'Ted Right', address: '' }),
  model({ id: 2, name: 'Frank Honest', address: '' }),
  model({ id: 3, name: 'Joan Well', address: '' }),
  model({ id: 4, name: 'Gail Polite', address: '' }),
  model({ id: 5, name: 'Michael Fair', address: '' }),
];

const ExampleComponent: FC = () => (
  <HotTable
    data={data}
    dataSchema={model}
    height="auto"
    width="auto"
    colHeaders={['ID', 'Name', 'Address']}
    columns={[
      { data: property('id') },
      { data: property('name') },
      { data: property('address') },
    ]}
    minSpareRows={1}
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
