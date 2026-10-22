import { watchFontLoads } from '../fontLoad';

/**
 * A stand-in for `document.fonts`: `startLoading()` fires `loading` and replaces `ready` with a pending
 * promise, `finishLoading()` settles it.
 */
class FakeFontFaceSet extends EventTarget {
  status = 'loaded';

  ready: Promise<unknown> = Promise.resolve();

  #resolveReady: () => void = () => {};

  startLoading() {
    if (this.status !== 'loading') {
      this.status = 'loading';
      this.ready = new Promise<void>((resolve) => {
        this.#resolveReady = resolve;
      });
    }

    this.dispatchEvent(new Event('loading'));
  }

  finishLoading() {
    this.status = 'loaded';
    this.#resolveReady();
  }
}

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('watchFontLoads', () => {
  it('should call back once the fonts that started loading are ready', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();

    watchFontLoads({ fonts }, onFontsLoaded);
    fonts.startLoading();
    await flushPromises();

    expect(onFontsLoaded).not.toHaveBeenCalled();

    fonts.finishLoading();
    await flushPromises();

    expect(onFontsLoaded).toHaveBeenCalledTimes(1);
  });

  it('should call back once for a burst of fonts that load together', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();

    watchFontLoads({ fonts }, onFontsLoaded);
    fonts.startLoading();
    fonts.startLoading();
    fonts.startLoading();
    fonts.finishLoading();
    await flushPromises();

    expect(onFontsLoaded).toHaveBeenCalledTimes(1);
  });

  it('should call back again for a font that loads later', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();

    watchFontLoads({ fonts }, onFontsLoaded);
    fonts.startLoading();
    fonts.finishLoading();
    await flushPromises();
    fonts.startLoading();
    fonts.finishLoading();
    await flushPromises();

    expect(onFontsLoaded).toHaveBeenCalledTimes(2);
  });

  it('should wait for a load that starts before the pending callback runs', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();

    watchFontLoads({ fonts }, onFontsLoaded);
    fonts.startLoading();
    // `ready` settles, and a new load starts before the watcher's `then` callback runs.
    fonts.finishLoading();
    fonts.startLoading();
    await flushPromises();

    expect(onFontsLoaded).not.toHaveBeenCalled();

    fonts.finishLoading();
    await flushPromises();

    expect(onFontsLoaded).toHaveBeenCalledTimes(1);
  });

  it('should not call back when nothing started loading', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();

    watchFontLoads({ fonts }, onFontsLoaded);
    await flushPromises();

    expect(onFontsLoaded).not.toHaveBeenCalled();
  });

  it('should not call back after it stopped watching, even for a load already pending', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();
    const stop = watchFontLoads({ fonts }, onFontsLoaded);

    fonts.startLoading();
    stop();
    fonts.finishLoading();
    await flushPromises();
    fonts.startLoading();
    fonts.finishLoading();
    await flushPromises();

    expect(onFontsLoaded).not.toHaveBeenCalled();
  });

  it('should keep watching after a rejected `ready`', async() => {
    const fonts = new FakeFontFaceSet();
    const onFontsLoaded = jest.fn();

    watchFontLoads({ fonts }, onFontsLoaded);
    fonts.status = 'loading';
    fonts.ready = Promise.reject(new Error('font failed'));
    fonts.dispatchEvent(new Event('loading'));
    await flushPromises();
    fonts.status = 'loaded';
    fonts.startLoading();
    fonts.finishLoading();
    await flushPromises();

    expect(onFontsLoaded).toHaveBeenCalledTimes(1);
  });

  it('should watch nothing when the document has no `fonts` set', () => {
    const onFontsLoaded = jest.fn();
    const stop = watchFontLoads({}, onFontsLoaded);

    expect(() => stop()).not.toThrow();
    expect(onFontsLoaded).not.toHaveBeenCalled();
  });
});
