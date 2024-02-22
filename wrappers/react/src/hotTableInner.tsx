import React from 'react';
import Handsontable from 'handsontable/base';
import { SettingsMapper } from './settingsMapper';
import { RenderersPortalManager } from './renderersPortalManager';
import { isHotColumn } from './hotColumn';
import { HotEditorHooks, HotTableProps, HotTableRef } from './types';
import {
  HOT_DESTROYED_WARNING,
  AUTOSIZE_WARNING,
  createEditorPortal,
  getContainerAttributesProps,
  isCSR,
  warn,
  displayObsoleteRenderersEditorsWarning,
  useUpdateEffect
} from './helpers';
import PropTypes from 'prop-types';
import { getRenderer } from 'handsontable/renderers/registry';
import { getEditor } from 'handsontable/editors/registry';
import { useHotTableContext } from './hotTableContext'
import { HotColumnContextProvider } from './hotColumnContext'
import { EditorContextProvider, makeEditorClass } from "./hotEditor";

const HotTableInner = React.forwardRef<HotTableRef, HotTableProps>((props, ref) => {

  /**
   * Reference to the Handsontable instance.
   */
  const __hotInstance = React.useRef<Handsontable | null>(null);

  /**
   * Reference to the main Handsontable DOM element.
   */
  const hotElementRef = React.useRef<HTMLDivElement>(null);

  /**
   * Reference to component-based editor overridden hooks object.
   */
  const globalEditorHooksRef = React.useRef<HotEditorHooks>();

  /**
   * Reference to HOT-native custom editor class instance.
   */
  const globalEditorClassInstance = React.useRef<Handsontable.editors.BaseEditor>();

  /**
   * HotTable context exposing helper functions.
   */
  const context = useHotTableContext();

  /**
   * Getter for the property storing the Handsontable instance.
   */
  const getHotInstance = React.useCallback((): Handsontable | null => {
    if (!__hotInstance.current || !__hotInstance.current.isDestroyed) {

      // Will return the Handsontable instance or `null` if it's not yet been created.
      return __hotInstance.current;

    } else {
      console.warn(HOT_DESTROYED_WARNING);

      return null;
    }
  }, [__hotInstance]);

  /**
   * Clear both the editor and the renderer cache.
   */
  const clearCache = React.useCallback((): void => {
    context.clearRenderedCellCache();
    context.componentRendererColumns.clear();
  }, [context]);

  /**
   * Get the `Document` object corresponding to the main component element.
   *
   * @returns The `Document` object used by the component.
   */
  const getOwnerDocument = React.useCallback((): Document | null => {
    if (isCSR()) {
      return hotElementRef.current ? hotElementRef.current.ownerDocument : document;
    }

    return null;
  }, [hotElementRef]);

  /**
   * Create a new settings object containing the column settings and global editors and renderers.
   *
   * @returns {Handsontable.GridSettings} New global set of settings for Handsontable.
   */
  const createNewGlobalSettings = (): Handsontable.GridSettings => {
    const newSettings = SettingsMapper.getSettings(props);

    newSettings.columns = context.columnsSettings.length ? context.columnsSettings : newSettings.columns;

    if (props.renderer) {
      newSettings.renderer = context.getRendererWrapper(props.renderer);
      context.componentRendererColumns.set('global', true);
    } else {
      newSettings.renderer = props.hotRenderer || getRenderer('text');
    }

    if (props.editor) {
      newSettings.editor = makeEditorClass(globalEditorHooksRef, globalEditorClassInstance);
    } else {
      newSettings.editor = props.hotEditor || getEditor('text');
    }

    return newSettings;
  };

  /**
   * Detect if `autoRowSize` or `autoColumnSize` is defined, and if so, throw an incompatibility warning.
   */
  const displayAutoSizeWarning = (hotInstance?: Handsontable): void => {
    if (
      hotInstance &&
      (
        hotInstance.getPlugin('autoRowSize')?.enabled ||
        hotInstance.getPlugin('autoColumnSize')?.enabled
      )
    ) {
      if (context.componentRendererColumns.size > 0) {
        warn(AUTOSIZE_WARNING);
      }
    }
  };

  /**
   * Initialize Handsontable after the component has mounted.
   */
  React.useEffect(() => {
    const newGlobalSettings = createNewGlobalSettings();

    __hotInstance.current = new Handsontable.Core(hotElementRef.current, newGlobalSettings);

    /**
     * Handsontable's `beforeViewRender` hook callback.
     */
    __hotInstance.current.addHook('beforeViewRender', () => {
      context.clearPortalCache();
      context.clearRenderedCellCache();
    });

    /**
     * Handsontable's `afterViewRender` hook callback.
     */
    __hotInstance.current.addHook('afterViewRender', () => {
      context.pushCellPortalsIntoPortalManager();
    });

    __hotInstance.current.init();

    displayAutoSizeWarning(__hotInstance.current);
    displayObsoleteRenderersEditorsWarning(props.children);

    /**
     * Destroy the Handsontable instance when the parent component unmounts.
     */
    return () => {
      clearCache();
      getHotInstance()?.destroy();
    }
  }, []);

  /**
   * Logic performed after the component update.
   */
  useUpdateEffect((): void => {
    clearCache();

    const hotInstance = getHotInstance();

    const newGlobalSettings = createNewGlobalSettings();
    hotInstance?.updateSettings(newGlobalSettings, false);

    displayAutoSizeWarning(hotInstance);
    displayObsoleteRenderersEditorsWarning(props.children);
  });

  /**
   * Interface exposed to parent components by HotTable instance via React ref
   */
  React.useImperativeHandle(ref, () => ({
    get hotElementRef() {
      return hotElementRef.current;
    },
    get hotInstance() {
      return getHotInstance();
    }
  }));

  /**
   * Render the component.
   */
  const hotColumnWrapped = React.Children.toArray(props.children)
    .filter(isHotColumn)
    .map((childNode, columnIndex) => (
      <HotColumnContextProvider columnIndex={columnIndex}
                                getOwnerDocument={getOwnerDocument}
                                key={columnIndex}>
        {childNode}
      </HotColumnContextProvider>
    ));

  const containerProps = getContainerAttributesProps(props);
  const editorPortal = createEditorPortal(getOwnerDocument(), props.editor);

  return (
    <React.Fragment>
      <div ref={hotElementRef} {...containerProps}>
        {hotColumnWrapped}
      </div>
      <RenderersPortalManager ref={context.setRenderersPortalManagerRef} />
      <EditorContextProvider hooksRef={globalEditorHooksRef}
                             hotCustomEditorInstanceRef={globalEditorClassInstance}>
        {editorPortal}
      </EditorContextProvider>
    </React.Fragment>
  );
});

/**
 * Prop types to be checked at runtime.
 */
HotTableInner.propTypes = {
  style: PropTypes.object,
  id: PropTypes.string,
  className: PropTypes.string
};

export default HotTableInner;
export { HotTableInner };
