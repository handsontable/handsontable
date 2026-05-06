import React from 'react';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  renderHotTableWithProps,
  sleep,
} from './_helpers';
import { HOT_DESTROYED_WARNING } from "../src/helpers";
import { HotTableProps, HotRendererProps, HotTableRef } from '../src/types'

describe('Component lifecyle', () => {
  it('renderer components should trigger their lifecycle methods', async () => {
    function RendererComponent2(props: HotRendererProps) {
      React.useEffect(() => {
        rendererCounters.set(`${props.row}-${props.col}`, {
          didMount: 1,
          willUnmount: 0
        });

        return () => {
          const counters = rendererCounters.get(`${props.row}-${props.col}`);
          counters.willUnmount++;
        };
      }, []);

      return (
        <>
          test
        </>
      );
    }

    const rendererCounters = new Map();

    const hotInstance = mountComponentWithRef<HotTableRef>((
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
                renderer={(props) => <RendererComponent2 {...props} />}>
        <HotColumn/>
        <HotColumn renderer={(props) => <RendererComponent2 {...props} />}/>
      </HotTable>
    ), false).hotInstance!;

    expect(rendererCounters.size).toEqual(3 * 2);

    rendererCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(0);
    });

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

    renderHotTableWithProps(props, false);

    expect(editorCounters.didMount).toEqual(1);
    expect(editorCounters.willUnmount).toEqual(0);

    // rerender
    renderHotTableWithProps({ ...props, editor: undefined }, false);

    expect(editorCounters.didMount).toEqual(1);
    expect(editorCounters.willUnmount).toEqual(1);
  });

  it('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
    'has been destroyed', async () => {
    const warnFunc = console.warn;
    const warnCalls: string[] = [];

    const componentInstance = mountComponentWithRef<HotTableRef>((
      <HotTable
        id="test-hot"
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"
      />
    ));

    console.warn = (warningMessage: string) => {
      warnCalls.push(warningMessage);
    };

    expect(componentInstance.hotInstance!.isDestroyed).toEqual(false);

    componentInstance.hotInstance!.destroy();

    expect(componentInstance.hotInstance).toEqual(null);

    expect(warnCalls.length).toBeGreaterThan(0);
    warnCalls.forEach((message) => {
      expect(message).toEqual(HOT_DESTROYED_WARNING);
    });

    console.warn = warnFunc;
  });

  // Regression tests for issue #10800 — custom React renderer components were
  // unmounted and their portal container DIVs detached from the TD on every
  // grid render, causing a visible flicker and loss of component-local state.
  it('should not detach the portal container DIV from any TD when a single cell is edited (#10800)', async () => {
    function StableCell(props: HotRendererProps) {
      return (
        <span data-cell={`${props.row}-${props.col}`}>{String(props.value)}</span>
      );
    }

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(4, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <StableCell {...props} />}
      />
    ), false).hotInstance!;

    await sleep(100);

    let detachedTdCount = 0;
    const observer = new MutationObserver((records) => {
      for (const rec of records) {
        if (
          rec.type === 'childList' &&
          rec.target instanceof HTMLTableCellElement &&
          rec.removedNodes.length > 0
        ) {
          detachedTdCount += rec.removedNodes.length;
        }
      }
    });

    observer.observe(hotInstance.rootElement, { childList: true, subtree: true });

    await act(async () => {
      hotInstance.setDataAtCell(0, 0, 'edited');
    });

    await sleep(50);

    // Flush any queued mutation records so they are reflected in the count.
    observer.takeRecords().forEach((rec) => {
      if (
        rec.type === 'childList' &&
        rec.target instanceof HTMLTableCellElement &&
        rec.removedNodes.length > 0
      ) {
        detachedTdCount += rec.removedNodes.length;
      }
    });
    observer.disconnect();

    expect(detachedTdCount).toEqual(0);
  });

  it('should preserve renderer component state across grid renders (#10800)', async () => {
    let nextSeed = 0;

    function SeededCell(props: HotRendererProps) {
      // useState initialiser runs once per mount. If the wrapper remounts the
      // component on every render, the seed will change.
      const [seed] = React.useState(() => {
        nextSeed += 1;
        return nextSeed;
      });

      return (
        <span data-seed={seed} data-cell={`${props.row}-${props.col}`}>
          {String(props.value)}
        </span>
      );
    }

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(4, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <SeededCell {...props} />}
      />
    ), false).hotInstance!;

    await sleep(100);

    const seedsBefore = Array.from(
      hotInstance.rootElement.querySelectorAll<HTMLElement>('span[data-seed]')
    ).map((el) => `${el.dataset.cell}:${el.dataset.seed}`);

    expect(seedsBefore.length).toEqual(4 * 3);

    await act(async () => {
      hotInstance.setDataAtCell(0, 0, 'edited');
    });

    await sleep(50);

    const seedsAfter = Array.from(
      hotInstance.rootElement.querySelectorAll<HTMLElement>('span[data-seed]')
    ).map((el) => `${el.dataset.cell}:${el.dataset.seed}`);

    expect(seedsAfter).toEqual(seedsBefore);
  });
});
