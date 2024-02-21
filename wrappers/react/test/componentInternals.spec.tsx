import React from 'react';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  renderComponentWithProps,
  sleep,
} from './_helpers';
import { HOT_DESTROYED_WARNING } from "../src/helpers";
import { HotTableProps, HotRendererProps } from '../src'

describe('Component lifecyle', () => {
  it('renderer components should trigger their lifecycle methods', async () => {
    class RendererComponent2 extends React.Component<HotRendererProps, any, any> {
      constructor(props) {
        super(props);

        rendererCounters.set(`${this.props.row}-${this.props.col}`, {
          didMount: 0,
          willUnmount: 0
        });
      }

      componentDidMount(): void {
        const counters = rendererCounters.get(`${this.props.row}-${this.props.col}`);
        counters.didMount++;
      }

      componentWillUnmount(): void {
        const counters = rendererCounters.get(`${this.props.row}-${this.props.col}`);
        counters.willUnmount++;
      }

      render(): React.ReactElement<string> {
        return (
          <>
            test
          </>
        );
      }
    }

    let secondGo = false;
    const rendererRefs = new Map();
    const rendererCounters = new Map();

    const hotInstance = mountComponentWithRef((
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
                renderer={(props) => <RendererComponent2 {...props} ref={function (instance) {
                  if (!secondGo && instance) {
                    rendererRefs.set(`${props.row}-${props.col}`, instance);
                  }
                }} />}>
        <HotColumn/>
        <HotColumn renderer={(props) => <RendererComponent2 {...props} ref={function (instance) {
          if (!secondGo && instance) {
            rendererRefs.set(`${props.row}-${props.col}`, instance);
          }
        }} />}/>
      </HotTable>
    ), false).hotInstance;

    expect(rendererCounters.size).toEqual(3 * 2);

    rendererCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(0);
    });

    secondGo = true;

    await act(async () => {
      hotInstance.render();
    });

    await sleep(300);

    rendererCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(0);
    });
  });

  it('editor components should trigger their lifecycle methods', async () => {
    const editorCounters = {
      didMount: 0,
      willUnmount: 0
    };

    const EditorComponent2 = () => {
      React.useEffect(() => {
        editorCounters.didMount++;

        return () => {
          editorCounters.willUnmount++;
        };
      }, []);

      return (
        <>test</>
      );
    };

    const props: HotTableProps = {
      licenseKey: "non-commercial-and-evaluation",
      id: "test-hot",
      data: createSpreadsheetData(3, 2),
      width: 300,
      height: 300,
      rowHeights: 23,
      colWidths: 50,
      init: function () {
        mockElementDimensions(this.rootElement, 300, 300);
      },
      editor: (props) => <EditorComponent2 {...props} key={Math.random()} />
    };

    renderComponentWithProps(HotTable, props, false);

    expect(editorCounters.didMount).toEqual(1);
    expect(editorCounters.willUnmount).toEqual(0);

    // rerender
    renderComponentWithProps(HotTable, { ...props, editor: undefined }, false);

    expect(editorCounters.didMount).toEqual(1);
    expect(editorCounters.willUnmount).toEqual(1);
  });

  it('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
    'has been destroyed', async () => {
    const warnFunc = console.warn;
    const warnCalls = [];

    const componentInstance = mountComponentWithRef((
      <HotTable
        id="test-hot"
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"
      />
    ));

    console.warn = (warningMessage) => {
      warnCalls.push(warningMessage);
    };

    expect(componentInstance.hotInstance.isDestroyed).toEqual(false);

    componentInstance.hotInstance.destroy();

    expect(componentInstance.hotInstance).toEqual(null);

    expect(warnCalls.length).toBeGreaterThan(0);
    warnCalls.forEach((message) => {
      expect(message).toEqual(HOT_DESTROYED_WARNING);
    });

    console.warn = warnFunc;
  });
});
