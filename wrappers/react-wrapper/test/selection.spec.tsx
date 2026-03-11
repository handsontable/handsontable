import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import {
  sleep,
  renderHotTableWithProps
} from './_helpers';
import { HotTableProps } from '../src/types'

// register Handsontable's modules
registerAllModules();

describe('Selection preservation', () => {
  it('should preserve non-consecutive selection after React state update', async () => {
    const hotSettings: HotTableProps = {
      licenseKey: "non-commercial-and-evaluation",
      id: "hot",
      data: [
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
      ],
      selectionMode: 'multiple',
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    await sleep(100);

    // Create a non-consecutive selection (multiple ranges)
    act(() => {
      hotInstance.selectCells([[0, 0], [2, 2]]);
    });

    await sleep(100);

    // Verify we have multiple selection ranges
    const selectedRangesBefore = hotInstance.getSelectedRange();
    expect(selectedRangesBefore).toBeTruthy();
    expect(selectedRangesBefore!.length).toBe(2);
    expect(selectedRangesBefore![0].from.row).toBe(0);
    expect(selectedRangesBefore![0].from.col).toBe(0);
    expect(selectedRangesBefore![1].from.row).toBe(2);
    expect(selectedRangesBefore![1].from.col).toBe(2);

    // Update React state (this triggers updateSettings in the wrapper)
    act(() => {
      hotSettings.contextMenu = true;
      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    await sleep(100);

    // Verify selection is preserved after state update
    const selectedRangesAfter = hotInstance.getSelectedRange();
    expect(selectedRangesAfter).toBeTruthy();
    expect(selectedRangesAfter!.length).toBe(2);
    expect(selectedRangesAfter![0].from.row).toBe(0);
    expect(selectedRangesAfter![0].from.col).toBe(0);
    expect(selectedRangesAfter![1].from.row).toBe(2);
    expect(selectedRangesAfter![1].from.col).toBe(2);
  }, 15000);

  it('should preserve active selection layer after React state update', async () => {
    const hotSettings: HotTableProps = {
      licenseKey: "non-commercial-and-evaluation",
      id: "hot",
      data: [
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
      ],
      selectionMode: 'multiple',
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    await sleep(100);

    // Create a non-consecutive selection
    act(() => {
      hotInstance.selectCells([[0, 0], [1, 1], [2, 2]]);
    });

    await sleep(100);

    const activeLayerBefore = (hotInstance as any).selection.getActiveSelectionLayerIndex();

    // Update React state
    act(() => {
      hotSettings.readOnly = true;
      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    await sleep(100);

    // Verify active layer is preserved
    const activeLayerAfter = (hotInstance as any).selection.getActiveSelectionLayerIndex();
    expect(activeLayerAfter).toBe(activeLayerBefore);
  }, 15000);

  it('should preserve selection when no selection exists', async () => {
    const hotSettings: HotTableProps = {
      licenseKey: "non-commercial-and-evaluation",
      id: "hot",
      data: [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ],
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    await sleep(100);

    // Don't select anything
    const selectedRangesBefore = hotInstance.getSelectedRange();
    expect(selectedRangesBefore).toBeUndefined();

    // Update React state
    act(() => {
      hotSettings.contextMenu = true;
      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    await sleep(100);

    // Verify no selection after update
    const selectedRangesAfter = hotInstance.getSelectedRange();
    expect(selectedRangesAfter).toBeUndefined();
  });

  it('should preserve single cell selection after React state update', async () => {
    const hotSettings: HotTableProps = {
      licenseKey: "non-commercial-and-evaluation",
      id: "hot",
      data: [
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
      ],
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    await sleep(100);

    // Select a single cell
    act(() => {
      hotInstance.selectCell(1, 2);
    });

    await sleep(100);

    const selectedRangesBefore = hotInstance.getSelectedRange();
    expect(selectedRangesBefore).toBeTruthy();
    expect(selectedRangesBefore!.length).toBe(1);
    expect(selectedRangesBefore![0].from.row).toBe(1);
    expect(selectedRangesBefore![0].from.col).toBe(2);

    // Update React state
    act(() => {
      hotSettings.readOnly = true;
      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    await sleep(100);

    // Verify selection is preserved
    const selectedRangesAfter = hotInstance.getSelectedRange();
    expect(selectedRangesAfter).toBeTruthy();
    expect(selectedRangesAfter!.length).toBe(1);
    expect(selectedRangesAfter![0].from.row).toBe(1);
    expect(selectedRangesAfter![0].from.col).toBe(2);
  });
});
