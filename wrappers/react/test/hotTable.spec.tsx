import React from 'react';
import {
  HotTable
} from '../src/hotTable';
import {
  createSpreadsheetData,
  IndividualPropsWrapper,
  mockElementDimensions,
  RendererComponent,
  EditorComponent,
  SingleObjectWrapper,
  sleep,
  simulateKeyboardEvent,
  simulateMouseEvent,
  mountComponent
} from './_helpers';

const SPEC = {
  container: null
};

beforeEach(() => {
  let container = document.createElement('DIV');
  container.id = 'hotContainer';
  document.body.appendChild(container);

  SPEC.container = container;
});

afterEach(() => {
  const container = document.querySelector('#hotContainer');
  container.parentNode.removeChild(container);

  SPEC.container = null;
});

describe('Handsontable initialization', () => {
  it('should render Handsontable when using the HotTable component', async () => {
    const hotInstance = mountComponent((
      <HotTable
        id="test-hot"
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"
      />
    ), SPEC.container).hotInstance;

    expect(hotInstance).not.toBe(null);
    expect(hotInstance).not.toBe(void 0);

    expect(hotInstance.rootElement.id).toEqual('test-hot');
  });

  it('should pass the provided properties to the Handsontable instance', async () => {
    const hotInstance = mountComponent((
      <HotTable
        id="test-hot"
        contextMenu={true}
        rowHeaders={true}
        colHeaders={true}
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"/>
    ), SPEC.container).hotInstance;

    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotInstance.getSettings().colHeaders).toBe(true);
    expect(JSON.stringify(hotInstance.getData())).toEqual('[[2]]');
  });
});

describe('Updating the Handsontable settings', () => {
  it('should call the updateSettings method of Handsontable, when the component properties get updated (when providing properties individually)', async () => {
    const componentInstance = mountComponent((
      <IndividualPropsWrapper/>
    ), SPEC.container);

    const hotInstance = componentInstance.hotTable.hotInstance;
    let updateSettingsCount = 0;


    hotInstance.addHook('afterUpdateSettings', () => {
      updateSettingsCount++;
    });

    await sleep(300);
    componentInstance.setState({hotSettings: {data: [[2]], contextMenu: true, readOnly: true}});

    expect(updateSettingsCount).toEqual(1);
  });

  it('should call the updateSettings method of Handsontable, when the component properties get updated (when providing properties as a single settings object)', async () => {
    const componentInstance = mountComponent((
      <SingleObjectWrapper/>
    ), SPEC.container);

    const hotInstance = componentInstance.hotTable.hotInstance;
    let updateSettingsCount = 0;

    hotInstance.addHook('afterUpdateSettings', () => {
      updateSettingsCount++;
    });

    await sleep(300);
    componentInstance.setState({hotSettings: {data: [[2]], contextMenu: true, readOnly: true}});

    expect(updateSettingsCount).toEqual(1);
  });

  it('should update the Handsontable options, when the component properties get updated (when providing properties individually)', async () => {
    const componentInstance = mountComponent((
      <IndividualPropsWrapper/>
    ), SPEC.container);

    const hotInstance = componentInstance.hotTable.hotInstance;

    expect(hotInstance.getSettings().contextMenu).toEqual(void 0);
    expect(hotInstance.getSettings().readOnly).toEqual(false);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]]');

    await sleep(300);
    componentInstance.setState({hotSettings: {data: [[2]], contextMenu: true, readOnly: true}});

    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().readOnly).toBe(true);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[2]]');
  });

  it('should update the Handsontable options, when the component properties get updated (when providing properties as a single settings object)', async () => {
    const componentInstance = mountComponent((
      <SingleObjectWrapper/>
    ), SPEC.container);

    const hotInstance = componentInstance.hotTable.hotInstance;

    expect(hotInstance.getSettings().contextMenu).toEqual(void 0);
    expect(hotInstance.getSettings().readOnly).toEqual(false);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]]');

    await sleep(300);
    componentInstance.setState({hotSettings: {data: [[2]], contextMenu: true, readOnly: true}});


    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().readOnly).toBe(true);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[2]]');
  });
});

describe('Renderer configuration using React components', () => {
  it('should use the renderer component as Handsontable renderer, when it\'s nested under HotTable and assigned the \'hot-renderer\' attribute', async () => {
    const hotInstance = mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(100, 100)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent hot-renderer></RendererComponent>
      </HotTable>
    ), SPEC.container).hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>value: A1</div>');

    hotInstance.scrollViewportTo(99, 0);
    // For some reason it needs another render
    hotInstance.render();
    await sleep(100);

    expect(hotInstance.getCell(99, 1).innerHTML).toEqual('<div>value: B100</div>');

    hotInstance.scrollViewportTo(99, 99);
    hotInstance.render();
    await sleep(100);

    expect(hotInstance.getCell(99, 99).innerHTML).toEqual('<div>value: CV100</div>');
  });
});

describe('Editor configuration using React components', () => {
  it('should use the editor component as Handsontable editor, when it\'s nested under HotTable and assigned the \'hot-editor\' attribute', async () => {
    const hotInstance = mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <EditorComponent hot-editor></EditorComponent>
      </HotTable>
    ), SPEC.container).hotInstance;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    hotInstance.selectCell(0,0);
    simulateKeyboardEvent('keydown', 13);

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');

    expect(hotInstance.getDataAtCell(0,0)).toEqual('A1');

    simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');

    expect(hotInstance.getDataAtCell(0,0)).toEqual('new-value');

    hotInstance.getActiveEditor().close();

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });
});
