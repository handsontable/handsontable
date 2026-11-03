import React from 'react';
import { HotTable } from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef
} from './_helpers';
import { HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

/**
 * Worth noting, that although it's possible to use React's Pure Components on renderer components, it doesn't do much, as currently they're recreated on every
 * Handsontable's `render`.
 */
describe('React PureComponents', () => {
  it('should be possible to declare the renderer as PureComponent', async() => {
    class RendererComponent2 extends React.PureComponent<any, any> {
      render(): React.ReactElement<string> {
        return (
          <>
            value: {this.props.value}
          </>
        );
      }
    }

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        renderer={RendererComponent2}/>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>value: A1</div>');
  });

  /*
    Editors cannot be declared as PureComponents, as they need to be functional components.
   */
});
