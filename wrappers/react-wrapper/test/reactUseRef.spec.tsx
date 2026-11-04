import React, { useEffect, useRef } from 'react';
import { HotTable } from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponent
} from './_helpers';
import { HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

describe('Using useRef hooks within HotTable', () => {
  it('should be possible the get Handsontable instance', async() => {
    const refData = createSpreadsheetData(3, 3);
    let data!: string[][];

    function ExampleComponent() {
      const hotRef = useRef<HotTableRef>(null);

      useEffect(() => {
        const hot = hotRef.current!.hotInstance!;

        data = hot.getData();
      });

      return (
        <HotTable licenseKey={TEST_LICENSE_KEY}
          ref={hotRef}
          id="test-hot"
          data={refData}
          width={300}
          height={300}
          minRowHeights={23}
          colWidths={50}
          init={function() {
            mockElementDimensions(this.rootElement, 300, 300);
          }}
        ></HotTable>
      );
    }

    mountComponent((
      <ExampleComponent/>
    ));

    expect(data).toEqual(refData);
  });
});
