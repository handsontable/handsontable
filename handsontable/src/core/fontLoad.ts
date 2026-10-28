/**
 * The order index the sizing plugins register their `afterFontsLoad` listeners with. It puts them after
 * the listeners of the application (order index 0, the default, which also applies to a listener declared
 * in the settings), so a listener that drops a custom renderer's cached sizes runs before they measure.
 * The plugins share one index and keep the order they were enabled in: AutoColumnSize measures the
 * widths before AutoRowSize measures the rows that wrap in them.
 */
export const FONT_REMEASURE_ORDER_INDEX = 10;

/**
 * The part of `FontFaceSet` the watcher uses. Typed structurally so a document without the CSS Font
 * Loading API, or a test double, can be passed in.
 */
interface FontFaceSetLike {
  readonly status: string;
  readonly ready: Promise<unknown>;
  addEventListener(type: 'loading', listener: () => void): void;
  removeEventListener(type: 'loading', listener: () => void): void;
}

/**
 * Calls `onFontsLoaded` after the document finishes loading web fonts. A font that loads after the grid
 * measured its rows and columns changes the size of the text without changing the grid's container, so
 * no resize observer sees it.
 *
 * The watcher listens for `loading` and then waits for `ready`, not for `loadingdone`: WebKit fires
 * `loading` but never `loadingdone`. `loading` fires once each time the set goes from loaded to loading,
 * not once per font face: a face that starts loading while another one is still loading fires nothing.
 * `ready` settles once every pending font has loaded, so a burst of fonts ends in one call. When another
 * load starts before the callback runs, the watcher waits for that load as well. A load already in
 * progress when the watcher starts is waited for the same way, because its `loading` event fired before
 * the listener was added.
 *
 * Returns a function that removes the listener and drops a pending call. When the document has no `fonts`
 * set (the CSS Font Loading API is missing), nothing is watched and the returned function does nothing.
 *
 * @param {Document} rootDocument The document whose font loads are watched.
 * @param {Function} onFontsLoaded The callback.
 * @returns {Function} The function that stops watching.
 */
export function watchFontLoads(
  rootDocument: { fonts?: FontFaceSetLike },
  onFontsLoaded: () => void,
): () => void {
  const fontFaceSet = rootDocument.fonts;

  if (!fontFaceSet || typeof fontFaceSet.addEventListener !== 'function') {
    return () => {};
  }

  let isWaiting = false;
  // Dropped on stop: a `ready` that never settles (a font load that hangs) keeps the pending `then`
  // callback, and through this the grid that is gone, for as long as the document lives.
  let callback: (() => void) | null = onFontsLoaded;

  const waitForReady = () => {
    fontFaceSet.ready.then(() => {
      if (callback === null) {
        return;
      }

      // A load that started after `ready` settled replaced the promise, and its `loading` event was
      // ignored while this wait was pending, so wait for it too.
      if (fontFaceSet.status === 'loading') {
        waitForReady();

        return;
      }

      isWaiting = false;
      callback();
    }, () => {
      isWaiting = false;
    });
  };

  const onLoading = () => {
    if (isWaiting) {
      return;
    }

    isWaiting = true;
    waitForReady();
  };

  fontFaceSet.addEventListener('loading', onLoading);

  // `loading` fires only when the set goes from loaded to loading, so a font that started loading before
  // the watcher (for example, the page's own text asked for it first) fires no event the watcher sees.
  if (fontFaceSet.status === 'loading') {
    onLoading();
  }

  return () => {
    callback = null;
    fontFaceSet.removeEventListener('loading', onLoading);
  };
}
