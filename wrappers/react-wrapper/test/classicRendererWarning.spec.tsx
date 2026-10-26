import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
} from './_helpers';
import { HotTableProps, HotTableRef } from '../src/types';
import { CLASSIC_FUNCTION_RENDERER_WARNING } from '../src/helpers';

registerAllModules();

// Returns null when React calls this with one props object, so the warning
// assertion stays reachable. Declared arity stays 7.
function createClassicRenderer() {
  return function classicRenderer(instance, td, row, col, prop, value, cellProperties) {
    if (!td || !cellProperties || !instance || row < 0 || col < 0 || prop === undefined) {
      return null;
    }

    td.textContent = String(value);

    return td;
  };
}

function mountGrid(props: HotTableProps): HotTableRef {
  return mountComponentWithRef<HotTableRef>((
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      id="test-hot"
      data={createSpreadsheetData(2, 2)}
      width={300}
      height={300}
      rowHeights={23}
      colWidths={50}
      autoRowSize={false}
      autoColumnSize={false}
      init={function() {
        mockElementDimensions(this.rootElement, 300, 300);
      }}
      {...props}
    />
  ));
}

function classicWarningCalls(warnSpy: jest.SpyInstance): unknown[][] {
  return warnSpy.mock.calls.filter(args => args[0] === CLASSIC_FUNCTION_RENDERER_WARNING);
}

describe('classic function renderer passed to the React renderer prop', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should warn once when a 7-arg function is passed to the HotTable renderer prop', async() => {
    const classicRenderer = createClassicRenderer();

    expect(classicRenderer.length).toBe(7);

    const hotInstance = mountGrid({ renderer: classicRenderer }).hotInstance!;

    expect(classicWarningCalls(warnSpy)).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(CLASSIC_FUNCTION_RENDERER_WARNING);

    await act(async() => {
      hotInstance.render();
    });

    expect(classicWarningCalls(warnSpy)).toHaveLength(1);
  });

  it('should warn once when a 7-arg function is passed to the HotColumn renderer prop', async() => {
    const classicRenderer = createClassicRenderer();

    expect(classicRenderer.length).toBe(7);

    mountGrid({
      children: (
        <HotColumn renderer={classicRenderer} />
      ),
    });

    expect(classicWarningCalls(warnSpy)).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(CLASSIC_FUNCTION_RENDERER_WARNING);
  });

  it('should not warn when a function component is passed to the renderer prop', async() => {
    const ValueRenderer = ({ value }: { value?: string }) => <div>value: {value}</div>;

    expect(ValueRenderer.length).toBe(1);

    const hotInstance = mountGrid({ renderer: ValueRenderer }).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.textContent).toEqual('value: A1');
    expect(warnSpy).not.toHaveBeenCalledWith(CLASSIC_FUNCTION_RENDERER_WARNING);
  });

  it('should not warn when a 7-arg function is passed to hotRenderer', async() => {
    const classicRenderer = createClassicRenderer();

    expect(classicRenderer.length).toBe(7);

    const hotInstance = mountGrid({ hotRenderer: classicRenderer }).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.textContent).toEqual('A1');
    expect(warnSpy).not.toHaveBeenCalledWith(CLASSIC_FUNCTION_RENDERER_WARNING);
  });
});
