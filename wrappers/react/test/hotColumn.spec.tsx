import React from 'react';
import {
  mount,
  ReactWrapper
} from 'enzyme';
import Handsontable from 'handsontable';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  RendererComponent,
  mockElementDimensions,
  sleep,
  EditorComponent,
  simulateKeyboardEvent,
  simulateMouseEvent
} from './_helpers';

beforeEach(() => {
  let container = document.createElement('DIV');
  container.id = 'hotContainer';
  document.body.appendChild(container);
});

describe('Passing column settings using HotColumn', () => {
  it('should apply the Handsontable settings passed as HotColumn arguments to the Handsontable instance', async (done) => {
    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot" data={[[2]]}
        readOnly={false}
      >
        <HotColumn title="test title"></HotColumn>
        <HotColumn readOnly={true}></HotColumn>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(300);

    let hotInstance = wrapper.instance().hotInstance;

    expect(hotInstance.getSettings().columns[0].title).toEqual('test title');
    expect(hotInstance.getCellMeta(0, 0).readOnly).toEqual(false);

    expect(hotInstance.getSettings().columns[1].title).toEqual(void 0);
    expect(hotInstance.getCellMeta(0, 1).readOnly).toEqual(true);

    expect(hotInstance.getSettings().licenseKey).toEqual('non-commercial-and-evaluation');

    wrapper.detach();

    done();
  });

  it('should allow to use data option as a string', async(done) => {
    const dataKeyCellValue = 'Value of key1 in row 0';
    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot" data={[{ key1: dataKeyCellValue }]}
        readOnly={false}
      >
        <HotColumn data="key1"></HotColumn>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(300);

    let hotInstance = wrapper.instance().hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual(dataKeyCellValue);

    wrapper.detach();

    done();
  })
});

describe('Renderer configuration using React components', () => {
  it('should use the renderer component as Handsontable renderer, when it\'s nested under HotColumn and assigned the \'hot-renderer\' attribute', async (done) => {
    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={Handsontable.helper.createSpreadsheetData(100, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn>
          <RendererComponent hot-renderer></RendererComponent>
        </HotColumn>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(300);

    let hotInstance = wrapper.instance().hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('A1');
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>value: B1</div>');

    hotInstance.scrollViewportTo(99, 0);
    hotInstance.render();

    await sleep(300);

    expect(hotInstance.getCell(99, 0).innerHTML).toEqual('A100');
    expect(hotInstance.getCell(99, 1).innerHTML).toEqual('<div>value: B100</div>');

    wrapper.detach();

    done();
  });
});

describe('Editor configuration using React components', () => {
  it('should use the editor component as Handsontable editor, when it\'s nested under HotTable and assigned the \'hot-editor\' attribute', async (done) => {
    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={Handsontable.helper.createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn>
          <EditorComponent hot-editor></EditorComponent>
        </HotColumn>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    const hotInstance = wrapper.instance().hotInstance;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    hotInstance.selectCell(0, 1);
    simulateKeyboardEvent('keydown', 13);

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');

    expect(hotInstance.getDataAtCell(0, 1)).toEqual('B1');

    simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');

    expect(hotInstance.getDataAtCell(0, 1)).toEqual('new-value');

    hotInstance.getActiveEditor().close();

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    hotInstance.selectCell(0, 0);
    simulateKeyboardEvent('keydown', 13);

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    wrapper.detach();

    done();
  });
});

describe('Dynamic HotColumn configuration changes', () => {
  it('should be possible to rearrange and change the column + editor + renderer configuration dynamically', async (done) => {
    function RendererComponent2(props) {
      return (
        <>r2: {props.value}</>
      );
    }

    class WrapperComponent extends React.Component<any, any> {
      constructor(props) {
        super(props);

        this.state = {
          setup: [
            <RendererComponent hot-renderer key={'1'}/>,
            <HotColumn title="test title" className="first-column-class-name" key={'2'}>
              <EditorComponent className="editor-className-1" id="editor-id-1" style={{background: 'red'}} hot-editor/>
            </HotColumn>,
            <HotColumn title="test title 2" key={'3'}>
              <RendererComponent2 hot-renderer></RendererComponent2>
            </HotColumn>
          ]
        }
      }

      render() {
        return (
          <HotTable licenseKey="non-commercial-and-evaluation" id="test-hot"
                    data={Handsontable.helper.createSpreadsheetData(3, 2)}
                    width={300}
                    height={300}
                    rowHeights={23}
                    colWidths={50}
                    readOnly={false}
                    autoRowSize={false}
                    autoColumnSize={false}
                    init={function () {
                      mockElementDimensions(this.rootElement, 300, 300);
                    }}
                    ref={hotTableInstanceRef}>
            {this.state.setup}
          </HotTable>
        );
      };
    }

    let hotTableInstanceRef = React.createRef();

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <WrapperComponent/>
      , {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(300);

    let hotInstance = (hotTableInstanceRef.current as any).hotInstance;
    let editorElement = document.querySelector('#editorComponentContainer');

    expect(hotInstance.getSettings().columns[0].title).toEqual('test title');
    expect(hotInstance.getSettings().columns[0].className).toEqual('first-column-class-name');
    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>value: A1</div>');
    expect(hotInstance.getCell(1, 0).innerHTML).toEqual('<div>value: A2</div>');
    hotInstance.selectCell(0, 0);
    hotInstance.getActiveEditor().open();
    expect(hotInstance.getActiveEditor().constructor.name).toEqual('CustomEditor');
    expect(hotInstance.getActiveEditor().editorComponent.__proto__.constructor.name).toEqual('EditorComponent');
    expect(editorElement.style.display).toEqual('block');
    expect(editorElement.parentNode.style.background).toEqual('red');
    expect(editorElement.parentNode.id).toEqual('editor-id-1');
    expect(editorElement.parentNode.className.includes('editor-className-1')).toBe(true);

    hotInstance.getActiveEditor().close();

    expect(hotInstance.getSettings().columns[1].title).toEqual('test title 2');
    expect(hotInstance.getSettings().columns[1].className).toEqual(void 0);
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>r2: B1</div>');
    expect(hotInstance.getCell(1, 1).innerHTML).toEqual('<div>r2: B2</div>');
    hotInstance.selectCell(0, 1);
    expect(hotInstance.getActiveEditor().constructor.name).toEqual('TextEditor');
    expect(hotInstance.getActiveEditor().editorComponent).toEqual(void 0);
    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    wrapper.instance().setState({
      setup: [
        <EditorComponent className="editor-className-2" id="editor-id-2" style={{background: 'blue'}} hot-editor key={'1'}/>,
        <HotColumn title="test title 2" key={'2'}>
          <RendererComponent2 hot-renderer></RendererComponent2>
        </HotColumn>,
        <HotColumn title="test title" className="first-column-class-name" key={'3'}>
          <RendererComponent hot-renderer/>
        </HotColumn>
      ]
    });

    await sleep(100);

    editorElement = document.querySelector('#editorComponentContainer');

    expect(hotInstance.getSettings().columns[0].title).toEqual('test title 2');
    expect(hotInstance.getSettings().columns[0].className).toEqual(void 0);
    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>r2: A1</div>');
    expect(hotInstance.getCell(1, 0).innerHTML).toEqual('<div>r2: A2</div>');
    hotInstance.selectCell(0, 0);
    hotInstance.getActiveEditor().open();
    expect(hotInstance.getActiveEditor().constructor.name).toEqual('CustomEditor');
    expect(hotInstance.getActiveEditor().editorComponent.__proto__.constructor.name).toEqual('EditorComponent');
    expect(editorElement.style.display).toEqual('block');
    expect(editorElement.parentNode.style.background).toEqual('blue');
    expect(editorElement.parentNode.id).toEqual('editor-id-2');
    expect(editorElement.parentNode.className.includes('editor-className-2')).toBe(true);
    hotInstance.getActiveEditor().close();

    expect(hotInstance.getSettings().columns[1].title).toEqual('test title');
    expect(hotInstance.getSettings().columns[1].className).toEqual('first-column-class-name');
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>value: B1</div>');
    expect(hotInstance.getCell(1, 1).innerHTML).toEqual('<div>value: B2</div>');
    hotInstance.selectCell(0, 1);
    hotInstance.getActiveEditor().open();
    expect(hotInstance.getActiveEditor().constructor.name).toEqual('CustomEditor');
    expect(hotInstance.getActiveEditor().editorComponent.__proto__.constructor.name).toEqual('EditorComponent');
    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');
    hotInstance.getActiveEditor().close();

    expect(hotInstance.getSettings().licenseKey).toEqual('non-commercial-and-evaluation');

    wrapper.detach();

    done();
  });
});
