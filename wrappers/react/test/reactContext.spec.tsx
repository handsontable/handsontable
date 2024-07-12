import React from 'react';
import {
  HotTable
} from '../src/hotTable';
import {
  HotColumn
} from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef
} from './_helpers';
import { BaseEditorComponent } from '../src/baseEditorComponent';

describe('React Context', () => {
  it('should be possible to declare a context and use it inside both renderers and editors', async () => {
    let hotTableInstance = null;
    const TestContext = React.createContext('def-test-val');

    function RendererComponent2() {
      return (
        <TestContext.Consumer>
          {(context) => <>{context}</>}
        </TestContext.Consumer>
      );
    }

    class EditorComponent2 extends BaseEditorComponent {
      render(): React.ReactElement<string> {
        return (
            <TestContext.Consumer>
              {(context) => <>{context}</>}
            </TestContext.Consumer>
        );
      }
    }

    class RendererComponent3 extends React.Component {
      render() {
        return (
          <>
            {this.context}
          </>
        )
      }
    }
    RendererComponent3.contextType = TestContext;

    class EditorComponent3 extends React.Component {
      render() {
        return (
          <>
            {this.context}
          </>
        )
      }
    }
    EditorComponent3.contextType = TestContext;

    mountComponentWithRef((
      <TestContext.Provider value={'testContextValue'}>
        <HotTable licenseKey="non-commercial-and-evaluation"
                  id="test-hot"
                  data={createSpreadsheetData(3, 2)}
                  width={300}
                  height={300}
                  rowHeights={23}
                  colWidths={50}
                  autoRowSize={false}
                  autoColumnSize={false}
                  init={function () {
                    mockElementDimensions(this.rootElement, 300, 300);
                  }}
                  ref={function (instance) {
                    hotTableInstance = instance;
                  }}>
          <HotColumn>
            <RendererComponent2 hot-renderer/>
            <EditorComponent2 hot-editor className="ec2"/>
          </HotColumn>
          <HotColumn>
            <RendererComponent3 hot-renderer/>
            <EditorComponent3 hot-editor className="ec3"/>
          </HotColumn>
        </HotTable>
      </TestContext.Provider>
    ));

    const hotInstance = hotTableInstance.hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>testContextValue</div>');
    expect(hotInstance.getCell(1, 0).innerHTML).toEqual('<div>testContextValue</div>');

    expect(document.querySelector('.ec2').innerHTML).toEqual('testContextValue');

    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>testContextValue</div>');
    expect(hotInstance.getCell(1, 1).innerHTML).toEqual('<div>testContextValue</div>');

    expect(document.querySelector('.ec3').innerHTML).toEqual('testContextValue');
  });
});
