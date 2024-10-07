import React from 'react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponent,
  RendererComponent
} from './_helpers';
import { AUTOSIZE_WARNING } from '../src/helpers';

registerAllModules();

describe('`autoRowSize`/`autoColumns` warning', () => {
  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a global component-based renderer' +
    'is defined (using the default Handsontable settings - autoColumnSize is enabled by default)', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={RendererComponent}/>
    ));

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);
  });

  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a global component-based renderer' +
    'is defined', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                autoRowSize={false}
                autoColumnSize={true}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={RendererComponent}/>
    ));

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);
  });

  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a component-based renderer' +
    'is defined for any column (using the default Handsontable settings - autoColumnSize enabled by default)', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn renderer={RendererComponent}/>
        <HotColumn/>
      </HotTable>
    ));

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);
  });

  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a component-based renderer' +
    'is defined for any column', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                autoColumnSize={false}
                autoRowSize={true}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn renderer={RendererComponent}/>
        <HotColumn/>
      </HotTable>
    ));

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);
  });

  it('should throw a warning, when `autoRowSize` or `autoColumnSize` is defined, and both function-based and component-based renderers are defined', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                autoRowSize={false}
                autoColumnSize={true}
                columns={function(columnIndex) {
                  return {
                    renderer: function() {}
                  }
                }}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn renderer={RendererComponent}/>
        <HotColumn/>
      </HotTable>
    ));

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);
  });

  it('should NOT throw any warnings, when `autoRowSize` or `autoColumnSize` is defined, but only global function-based renderers were defined', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                autoRowSize={true}
                autoColumnSize={false}
                hotRenderer={function() {}}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn/>
        <HotColumn/>
      </HotTable>
    ));

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should NOT throw any warnings, when `autoRowSize` or `autoColumnSize` is defined, but only function-based renderers were defined for columns', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                autoRowSize={true}
                autoColumnSize={true}
                columns={[{renderer: function() {}}]}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn/>
        <HotColumn/>
      </HotTable>
    ));

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should NOT throw any warnings, when `autoRowSize` or `autoColumnSize` is defined, but only function-based renderers were defined for columns, when ' +
    'the `columns` option is defined as a function', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                autoRowSize={false}
                autoColumnSize={true}
                columns={function(columnIndex) {
                  return {
                    renderer: function() {}
                  }
                }}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn/>
        <HotColumn/>
      </HotTable>
    ));

    expect(console.warn).not.toHaveBeenCalled();
  });
});
