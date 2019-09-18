/**
 * getSvgResizer is a higher-order function that returns a function to resize SVG.
 *
 * @param {HTMLElement} svg <svg> element
 * @returns {Function}
 */
export default function getSvgResizer(svg) {
  let lastTotalWidth;
  let lastTotalHeight;

  return (totalWidth, totalHeight) => {
    if (totalWidth !== lastTotalWidth || totalHeight !== lastTotalHeight) {
      svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

      if (totalWidth !== lastTotalWidth) {
        svg.style.width = `${totalWidth}px`;
        svg.setAttribute('width', totalWidth);
        lastTotalWidth = totalWidth;
      }
      if (totalHeight !== lastTotalHeight) {
        svg.style.height = `${totalHeight}px`;
        svg.setAttribute('height', totalHeight);
        lastTotalHeight = totalHeight;
      }
    }
  };
}
