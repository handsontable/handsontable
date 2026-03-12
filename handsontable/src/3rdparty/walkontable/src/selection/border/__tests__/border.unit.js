import Border from '../border';

describe('Border', () => {
  describe('updateMultipleSelectionHandlesPosition', () => {
    it('should always keep top and bottom handles above selection borders', () => {
      const styles = {
        top: {
          borderWidth: '1px',
          width: '12px',
        },
        topHitArea: {
          width: '40px',
        },
        bottom: {},
        bottomHitArea: {},
      };
      const borderMock = {
        wot: {
          wtSettings: {
            getSetting: key => (key === 'rtlMode' ? false : 0),
          },
          wtTable: {
            getWidth: () => 400,
            getHeight: () => 300,
          },
        },
        selectionHandles: {
          styles,
        },
        settings: {
          border: {
            cornerVisible: () => true,
          },
        },
        isPartRange: () => false,
      };

      Border.prototype.updateMultipleSelectionHandlesPosition.call(borderMock, 1, 1, 50, 50, 40, 24);

      expect(styles.top.zIndex).toBe('9999');
      expect(styles.topHitArea.zIndex).toBe('9999');
      expect(styles.bottom.zIndex).toBe('9999');
      expect(styles.bottomHitArea.zIndex).toBe('9999');
    });
  });
});
