import React, { Suspense, lazy } from 'react';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  sleep,
} from './_helpers';
import { HotRendererProps, HotTableRef } from '../src/types'

describe('React.lazy', () => {
  it('should be possible to lazy-load components and utilize Suspend', async () => {
    function RendererComponent2(props: HotRendererProps) {
      return (
        <>
          lazy value: {props.value}
        </>
      );
    }

    let promiseResolve: (value: unknown) => void = () => undefined;

    function SuspendedRenderer(props: HotRendererProps) {
      const customImportPromise = new Promise(function (resolve, reject) {
          promiseResolve = resolve;
        }
      ) as any;

      const LazierRenderer = lazy(() => customImportPromise);

      return (
        <Suspense fallback={<>loading-message</>}>
          <LazierRenderer {...props}></LazierRenderer>
        </Suspense>
      )
    }

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(1, 1)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={SuspendedRenderer}/>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>loading-message</div>');

    await act(async () => {
      promiseResolve({
        default: RendererComponent2,
        __esModule: true
      });
    });

    await sleep(40);

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>lazy value: A1</div>');
  });
});
