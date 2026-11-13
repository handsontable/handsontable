import Handsontable from 'handsontable';

const control = { data: 'plain', type: 'numeric', title: `Plain
amount (EUR)` };

export function mount(el) {
  return new Handsontable(el, {
    licenseKey: 'non-commercial-and-evaluation',
    columns: [
      {
        data: 'net',
        type: 'numeric',
        locale: 'de-DE',
        numericFormat: {},

        title: `Net
amount (EUR)`
      },
      {
        data: 'fx',
        type: 'numeric',
        locale: 'fr-FR',
        numericFormat: {},

        title: `FX
    rate`,

        hint: `Rate of ${ 'the' } day
  in EUR`
      },
      control,
    ],
  });
}
