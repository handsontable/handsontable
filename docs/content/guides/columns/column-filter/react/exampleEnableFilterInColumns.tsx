import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  // remove the column menu button from the 'Brand', 'Price', and 'Date' columns
  const removeColumnMenuButton = (col: number, TH: { querySelector: (value: string) => any }) => {
    if (col > 1) {
      const button = TH.querySelector('.changeType');

      if (!button) {
        return;
      }

      button.parentElement.removeChild(button);
    }
  };

  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '2023-10-11',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '2023-05-03',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '2023-03-27',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '2023-08-28',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '2023-10-02',
          sellTime: '01:23',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          locale: 'en-US',
          numericFormat: {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          },
        },
        {
          title: 'Date',
          type: 'intl-date',
          data: 'sellDate',
          locale: 'en-US',
          dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'intl-time',
          data: 'sellTime',
          locale: 'en-US',
          timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      // enable filtering for all columns
      filters={true}
      // enable the column menu for all columns
      // but display only the 'Filter by value' list and the 'OK' and 'Cancel' buttons
      dropdownMenu={{
        items: {
          filter_by_value: {
            // hide the 'Filter by value' list from all columns but the first one
            hidden() {
              return this.getSelectedRangeLast()!.to.col > 0;
            },
          },
          filter_action_bar: {
            // hide the 'OK' and 'Cancel' buttons from all columns but the first one
            hidden() {
              return this.getSelectedRangeLast()!.to.col > 0;
            },
          },
          clear_column: {
            // hide the 'Clear column' menu item from the first column
            hidden() {
              return this.getSelectedRangeLast()!.to.col < 1;
            },
          },
        },
      }}
      // `afterGetColHeader()` is a Handsontable hook
      // it's fired after Handsontable appends information about a column header to the table header
      afterGetColHeader={removeColumnMenuButton}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
