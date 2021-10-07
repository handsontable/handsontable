import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

{
  const observer = hot.rowIndexMapper.createChangesObserver('hiding');

  observer.subscribe((changes) => {
    changes.forEach(({ op, index, oldValue, newValue }) => {

    });
  });
  observer.unsubscribe();

  const hiddenMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-hidden-map', 'hidden', true);
  const pvMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-pv-map', 'linkedPhysicalIndexToValue');
  const lpvMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-lpv-map', 'physicalIndexToValue');
  const trimmingMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-trimming-map', 'trimming');
}

hot.rowIndexMapper.suspendOperations();
hot.rowIndexMapper.resumeOperations();
hot.rowIndexMapper.unregisterMap('my-hidden-map');
hot.rowIndexMapper.unregisterAll();
hot.rowIndexMapper.getPhysicalFromVisualIndex(0);
hot.rowIndexMapper.getVisualFromPhysicalIndex(0);
hot.rowIndexMapper.getRenderableFromVisualIndex(0);
hot.rowIndexMapper.getVisualFromRenderableIndex(0);
hot.rowIndexMapper.getPhysicalFromRenderableIndex(0);
hot.rowIndexMapper.getFirstNotHiddenIndex(3, -1);
hot.rowIndexMapper.getFirstNotHiddenIndex(3, -1, true);
hot.rowIndexMapper.getFirstNotHiddenIndex(3, -1, true, 4);
hot.rowIndexMapper.getFirstNotHiddenIndex(3, 1);
hot.rowIndexMapper.getFirstNotHiddenIndex(3, 1, true);
hot.rowIndexMapper.getFirstNotHiddenIndex(3, 1, true, 2);
hot.rowIndexMapper.getRenderableIndexes();
hot.rowIndexMapper.getRenderableIndexes(false);
hot.rowIndexMapper.getRenderableIndexes(true);
hot.rowIndexMapper.getRenderableIndexesLength();
hot.rowIndexMapper.getNotHiddenIndexes();
hot.rowIndexMapper.getNotHiddenIndexes(false);
hot.rowIndexMapper.getNotHiddenIndexes(true);
hot.rowIndexMapper.getNotHiddenIndexesLength();
hot.rowIndexMapper.getIndexesSequence();
hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);
hot.rowIndexMapper.getNotTrimmedIndexes();
hot.rowIndexMapper.getNotTrimmedIndexes(false);
hot.rowIndexMapper.getNotTrimmedIndexes(true);
hot.rowIndexMapper.getNotTrimmedIndexesLength();
hot.rowIndexMapper.getNumberOfIndexes();
hot.rowIndexMapper.moveIndexes(0, 1);
hot.rowIndexMapper.moveIndexes([0], 1);
hot.rowIndexMapper.isTrimmed(0);
hot.rowIndexMapper.isHidden(0);

{
  const observer = hot.columnIndexMapper.createChangesObserver('hiding');

  observer.subscribe((changes) => {
    changes.forEach(({ op, index, oldValue, newValue }) => {

    });
  });
  observer.unsubscribe();

  const hiddenMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hidden-map', 'hidden', true);
  const pvMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-pv-map', 'linkedPhysicalIndexToValue');
  const lpvMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-lpv-map', 'physicalIndexToValue');
  const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-trimming-map', 'trimming');
}

hot.columnIndexMapper.suspendOperations();
hot.columnIndexMapper.resumeOperations();
hot.columnIndexMapper.unregisterMap('my-hidden-map');
hot.columnIndexMapper.unregisterAll();
hot.columnIndexMapper.getPhysicalFromVisualIndex(0);
hot.columnIndexMapper.getVisualFromPhysicalIndex(0);
hot.columnIndexMapper.getRenderableFromVisualIndex(0);
hot.columnIndexMapper.getVisualFromRenderableIndex(0);
hot.columnIndexMapper.getPhysicalFromRenderableIndex(0);
hot.columnIndexMapper.getFirstNotHiddenIndex(3, -1);
hot.columnIndexMapper.getFirstNotHiddenIndex(3, -1, true);
hot.columnIndexMapper.getFirstNotHiddenIndex(3, -1, true, 4);
hot.columnIndexMapper.getFirstNotHiddenIndex(3, 1);
hot.columnIndexMapper.getFirstNotHiddenIndex(3, 1, true);
hot.columnIndexMapper.getFirstNotHiddenIndex(3, 1, true, 2);
hot.columnIndexMapper.getRenderableIndexes();
hot.columnIndexMapper.getRenderableIndexes(false);
hot.columnIndexMapper.getRenderableIndexes(true);
hot.columnIndexMapper.getRenderableIndexesLength();
hot.columnIndexMapper.getNotHiddenIndexes();
hot.columnIndexMapper.getNotHiddenIndexes(false);
hot.columnIndexMapper.getNotHiddenIndexes(true);
hot.columnIndexMapper.getNotHiddenIndexesLength();
hot.columnIndexMapper.getIndexesSequence();
hot.columnIndexMapper.setIndexesSequence([0, 1, 2]);
hot.columnIndexMapper.getNotTrimmedIndexes();
hot.columnIndexMapper.getNotTrimmedIndexes(false);
hot.columnIndexMapper.getNotTrimmedIndexes(true);
hot.columnIndexMapper.getNotTrimmedIndexesLength();
hot.columnIndexMapper.getNumberOfIndexes();
hot.columnIndexMapper.moveIndexes(0, 1);
hot.columnIndexMapper.moveIndexes([0], 1);
hot.columnIndexMapper.isTrimmed(0);
hot.columnIndexMapper.isHidden(0);
