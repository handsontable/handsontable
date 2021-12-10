import React from 'react';
import {
  mount,
  ReactWrapper
} from 'enzyme';
import { registerAllModules } from 'handsontable/registry';
import {
  HotTable
} from '../src/hotTable';
import {
  HotColumn
} from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  sleep
} from './_helpers';
import {
  AUTOSIZE_WARNING
} from '../src/helpers';

beforeEach(() => {
  let container = document.createElement('DIV');
  container.id = 'hotContainer';
  document.body.appendChild(container);
});

registerAllModules();

describe('`autoRowSize`/`autoColumns` warning', () => {
  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a global component-based renderer' +
    'is defined (using the default Handsontable settings - autoColumnSize is enabled by default)', async () => {
    console.warn = jasmine.createSpy('warn');

    const RendererComponent = function (props) {
      return <>test</>
    };

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent hot-renderer></RendererComponent>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);

    wrapper.detach();
  });

  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a global component-based renderer' +
    'is defined', async () => {
    console.warn = jasmine.createSpy('warn');

    const RendererComponent = function (props) {
      return <>test</>
    };

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                autoRowSize={false}
                autoColumnSize={true}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent hot-renderer></RendererComponent>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);

    wrapper.detach();
  });

  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a component-based renderer' +
    'is defined for any column (using the default Handsontable settings - autoColumnSize enabled by default)', async () => {
    console.warn = jasmine.createSpy('warn');

    const RendererComponent = function (props) {
      return <>test</>
    };

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn>
          <RendererComponent hot-renderer></RendererComponent>
        </HotColumn>
        <HotColumn/>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);

    wrapper.detach();
  });

  it('should recognize whether `autoRowSize` or `autoColumnSize` is enabled and throw a warning, if a component-based renderer' +
    'is defined for any column', async () => {
    console.warn = jasmine.createSpy('warn');

    const RendererComponent = function (props) {
      return <>test</>
    };

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
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
        <HotColumn>
          <RendererComponent hot-renderer></RendererComponent>
        </HotColumn>
        <HotColumn/>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);

    wrapper.detach();
  });

  it('should throw a warning, when `autoRowSize` or `autoColumnSize` is defined, and both function-based and component-based renderers are defined', async () => {
    console.warn = jasmine.createSpy('warn');

    const RendererComponent = function (props) {
      return <>test</>
    };

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
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
        <HotColumn>
          <RendererComponent hot-renderer/>
        </HotColumn>
        <HotColumn/>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).toHaveBeenCalledWith(AUTOSIZE_WARNING);

    wrapper.detach();
  });

  it('should NOT throw any warnings, when `autoRowSize` or `autoColumnSize` is defined, but only global function-based renderers were defined', async () => {
    console.warn = jasmine.createSpy('warn');

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                autoRowSize={true}
                autoColumnSize={false}
                renderer={function() {}}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn/>
        <HotColumn/>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).not.toHaveBeenCalled();

    wrapper.detach();
  });

  it('should NOT throw any warnings, when `autoRowSize` or `autoColumnSize` is defined, but only function-based renderers were defined for columns', async () => {
    console.warn = jasmine.createSpy('warn');

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
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
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).not.toHaveBeenCalled();

    wrapper.detach();
  });

  it('should NOT throw any warnings, when `autoRowSize` or `autoColumnSize` is defined, but only function-based renderers were defined for columns, when ' +
    'the `columns` option is defined as a function', async () => {
    console.warn = jasmine.createSpy('warn');

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
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
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    expect(console.warn).not.toHaveBeenCalled();

    wrapper.detach();
  });
});
