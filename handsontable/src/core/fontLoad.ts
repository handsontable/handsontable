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
 * `loading` but never `loadingdone`. `ready` settles once every pending font has loaded, so a burst of
 * fonts (one `loading` per font face) ends in one call. When another load starts before the callback
 * runs, the watcher waits for that load as well.
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
  let isStopped = false;

  const waitForReady = () => {
    fontFaceSet.ready.then(() => {
      if (isStopped) {
        return;
      }

      // A load that started after `ready` settled replaced the promise, and its `loading` event was
      // ignored while this wait was pending, so wait for it too.
      if (fontFaceSet.status === 'loading') {
        waitForReady();

        return;
      }

      isWaiting = false;
      onFontsLoaded();
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

  return () => {
    isStopped = true;
    fontFaceSet.removeEventListener('loading', onLoading);
  };
}
