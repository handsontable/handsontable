/**
 * Guards the scrollbar the Walkontable test page renders. The specs size their wrappers from
 * `getScrollbarWidth()` and assume a bar that takes layout space. An overlay scrollbar (macOS "Show
 * scroll bars: When scrolling") or a launcher flag such as `--hide-scrollbars` would make that width 0
 * and silently change what every scrollbar-dependent spec covers.
 */
describe('Test page scrollbar', () => {
  const CLASSIC_SCROLLBAR_SIZE = 15; // Keep in sync with `::-webkit-scrollbar` in css/walkontable.test.css.

  let box;

  afterEach(() => {
    if (box) {
      box.remove();
      box = null;
    }
  });

  it('should be styled by the test page, so the OS scrollbar setting cannot change its size', async() => {
    // Passes on any OS, unlike the measured widths below, which a Linux or a classic-scrollbar macOS
    // already gives. It fails when the rule in `css/walkontable.test.css` is removed or stops matching.
    box = document.createElement('div');
    box.style.cssText = 'position: absolute; width: 100px; height: 100px; overflow: scroll;';
    document.body.appendChild(box);

    const scrollbarStyle = getComputedStyle(box, '::-webkit-scrollbar');

    expect(scrollbarStyle.width).toBe(`${CLASSIC_SCROLLBAR_SIZE}px`);
    expect(scrollbarStyle.height).toBe(`${CLASSIC_SCROLLBAR_SIZE}px`);
  });

  it('should be a classic one that takes layout space', async() => {
    expect(getScrollbarWidth()).toBe(CLASSIC_SCROLLBAR_SIZE);
  });

  it('should take layout space on both axes of an overflowing box', async() => {
    box = document.createElement('div');
    box.style.cssText = 'position: absolute; width: 100px; height: 100px; overflow: scroll;';
    box.innerHTML = '<div style="width: 300px; height: 300px;"></div>';
    document.body.appendChild(box);

    expect(box.offsetWidth - box.clientWidth).toBe(CLASSIC_SCROLLBAR_SIZE);
    expect(box.offsetHeight - box.clientHeight).toBe(CLASSIC_SCROLLBAR_SIZE);
  });
});
