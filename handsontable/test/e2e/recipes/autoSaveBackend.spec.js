describe('Recipe: Auto-save changes to a backend', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function createRecipeData() {
    return [
      { id: 1, product: 'Keyboard', stock: 14, price: 89, status: 'active' },
      { id: 2, product: 'Monitor', stock: 5, price: 249, status: 'active' },
      { id: 3, product: 'Dock', stock: 22, price: 139, status: 'draft' },
      { id: 4, product: 'Webcam', stock: 9, price: 119, status: 'active' },
      { id: 5, product: 'Headset', stock: 16, price: 99, status: 'paused' },
    ];
  }

  /**
   * Creates a HOT config that mirrors the auto-save recipe pattern.
   * Uses a short debounce for fast test execution.
   */
  function createAutoSaveConfig({ saveRowsFn, debounceMs = 50 } = {}) {
    const saveStates = [];
    const savedRowsHistory = [];
    const dirtyRows = new Set();
    const invalidPhysicalRows = new Set();
    let saveTimeout = null;
    let saveRequestCounter = 0;

    const setSaveStatus = state => saveStates.push(state);
    const mockSave = saveRowsFn ?? (async(rows) => { savedRowsHistory.push([...rows]); });

    const config = {
      data: createRecipeData(),
      colHeaders: ['ID', 'Product', 'Stock', 'Price', 'Status'],
      columns: [
        { data: 'id', type: 'numeric', readOnly: true, width: 70 },
        { data: 'product', type: 'text', width: 180 },
        { data: 'stock', type: 'numeric', width: 90 },
        { data: 'price', type: 'numeric', width: 110 },
        { data: 'status', type: 'text', width: 120 },
      ],
      licenseKey: 'non-commercial-and-evaluation',
      afterValidate(isValid, _value, visualRow) {
        const physicalRow = hot().toPhysicalRow(visualRow);

        if (physicalRow === null || physicalRow < 0) {
          return;
        }

        if (isValid) {
          invalidPhysicalRows.delete(physicalRow);
        } else {
          invalidPhysicalRows.add(physicalRow);
        }
      },
      afterChange(changes, source) {
        if (!changes || source === 'loadData') {
          return;
        }

        changes.forEach(([visualRow, _prop, oldValue, newValue]) => {
          if (oldValue !== newValue) {
            const physicalRow = hot().toPhysicalRow(visualRow);

            if (physicalRow !== null && physicalRow >= 0) {
              dirtyRows.add(physicalRow);
            }
          }
        });

        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        saveTimeout = setTimeout(async() => {
          const physicalRows = Array.from(dirtyRows);

          if (physicalRows.length === 0) {
            return;
          }

          if (physicalRows.some(r => invalidPhysicalRows.has(r))) {
            setSaveStatus('error');

            return;
          }

          const requestId = ++saveRequestCounter;
          const rowsToSave = physicalRows
            .map(r => hot().getSourceDataAtRow(r))
            .filter(r => r !== undefined && r !== null);

          dirtyRows.clear();
          setSaveStatus('saving');

          try {
            await mockSave(rowsToSave);

            if (requestId === saveRequestCounter) {
              setSaveStatus('saved');
            }
          } catch (_error) {
            physicalRows.forEach(r => dirtyRows.add(r));

            if (requestId === saveRequestCounter) {
              setSaveStatus('error');
            }
          }
        }, debounceMs);
      },
    };

    return { config, saveStates, savedRowsHistory };
  }

  describe('loadData source handling', () => {
    it('should not trigger a save when changes come from loadData', async() => {
      const { config, saveStates } = createAutoSaveConfig();

      handsontable(config);
      hot().loadData(createRecipeData());

      await sleep(200);

      expect(saveStates).toEqual([]);
    });
  });

  describe('valid cell edits', () => {
    it('should transition through saving → saved states after editing a cell', async() => {
      const { config, saveStates } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(0, 2, 20); // Edit stock of row 0

      await sleep(200);

      expect(saveStates).toContain('saving');
      expect(saveStates[saveStates.length - 1]).toBe('saved');
    });

    it('should send only the modified row, not the full dataset', async() => {
      const { config, savedRowsHistory } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(1, 2, 10); // Edit stock of Monitor row

      await sleep(200);

      expect(savedRowsHistory.length).toBe(1);
      expect(savedRowsHistory[0].length).toBe(1);
      expect(savedRowsHistory[0][0]).toEqual(jasmine.objectContaining({ product: 'Monitor', stock: 10 }));
    });

    it('should batch multiple edits on the same row into a single save request', async() => {
      const { config, savedRowsHistory } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(0, 2, 20); // Edit stock
      await setDataAtCell(0, 3, 100); // Edit price

      await sleep(200);

      expect(savedRowsHistory.length).toBe(1); // One save call
      expect(savedRowsHistory[0].length).toBe(1); // One row
    });

    it('should send only one save request for multiple rapid edits on different rows', async() => {
      const { config, saveStates } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(0, 2, 20);
      await setDataAtCell(1, 2, 10);
      await setDataAtCell(2, 2, 5);

      await sleep(200);

      expect(saveStates.filter(s => s === 'saving').length).toBe(1);
    });
  });

  describe('non-numeric value in a numeric column', () => {
    it('should show error state when a non-numeric string is entered in a numeric column', async() => {
      const { config, saveStates } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(0, 2, 'abc'); // Invalid value in stock (numeric column)

      await waitForNextAnimationFrames(2); // Wait for afterValidate
      await sleep(200); // Wait for debounce

      expect(saveStates).toContain('error');
      expect(saveStates).not.toContain('saved');
    });

    it('should not send invalid row data to the backend', async() => {
      const { config, savedRowsHistory } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(0, 2, 'abc'); // Invalid

      await waitForNextAnimationFrames(2);
      await sleep(200);

      expect(savedRowsHistory.length).toBe(0);
    });

    it('should save successfully after correcting an invalid value', async() => {
      const { config, saveStates } = createAutoSaveConfig();

      handsontable(config);

      await setDataAtCell(0, 2, 'abc'); // Invalid
      await waitForNextAnimationFrames(2);
      await sleep(200);

      expect(saveStates).toContain('error');

      await setDataAtCell(0, 2, 25); // Corrected value
      await waitForNextAnimationFrames(2);
      await sleep(200);

      expect(saveStates[saveStates.length - 1]).toBe('saved');
    });
  });

  describe('save failure', () => {
    it('should show error state when the backend save throws', async() => {
      const failingSave = async() => { throw new Error('Network error'); };
      const { config, saveStates } = createAutoSaveConfig({ saveRowsFn: failingSave });

      handsontable(config);

      await setDataAtCell(0, 2, 20);

      await sleep(200);

      expect(saveStates).toContain('error');
      expect(saveStates).not.toContain('saved');
    });
  });
});
