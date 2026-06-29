import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const insertColumn = () => {
    const hot = hotRef.current?.hotInstance;

    // insert one column at the end of the grid
    hot?.alter('insert_col_end', hot.countCols() - 1, 1);
  };

  const removeColumn = () => {
    const hot = hotRef.current?.hotInstance;

    // remove the last column, but keep at least one column in the grid
    if (hot && hot.countCols() > 1) {
      hot.alter('remove_col', hot.countCols() - 1, 1);
    }
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button className="button button--primary" onClick={insertColumn}>
            Insert column
          </button>
          <button className="button button--primary" onClick={removeColumn}>
            Remove last column
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['Ana García', 'Engineering', 'Senior Engineer', '2021-04-12'],
          ['James Okafor', 'Marketing', 'Product Manager', '2022-08-30'],
          ['Li Wei', 'Engineering', 'Staff Engineer', '2019-02-18'],
          ['Sofia Rossi', 'Sales', 'Account Executive', '2023-01-09'],
          ['Diego Fernández', 'Design', 'UX Designer', '2020-11-23'],
          ['Amara Singh', 'Engineering', 'Engineering Manager', '2018-06-05'],
        ]}
        colHeaders={['Name', 'Department', 'Title', 'Hire date']}
        rowHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
