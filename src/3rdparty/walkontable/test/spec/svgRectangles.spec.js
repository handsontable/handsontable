describe('getSvgPathsRenderer', () => {
  let container;
  let svg;
  let svgResizer;
  let svgPathsRenderer;

  const totalWidth = 10;
  const totalHeight = 10;

  function callSvgPathsRenderer(rawData) {
    const stylesAndCommands = Walkontable.precalculateStylesAndCommands(rawData, totalWidth, totalHeight);
    const strokeStyles = [...stylesAndCommands.keys()];
    const strokeCommands = [...stylesAndCommands.values()];

    svgResizer(totalWidth, totalHeight);
    svgPathsRenderer(strokeStyles, strokeCommands);
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    container.innerHTML = '';
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.background = 'white';
    container.appendChild(svg);

    svgResizer = Walkontable.getSvgResizer(svg);
    svgPathsRenderer = Walkontable.getSvgPathsRenderer(svg);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('stroke alignment of a rectangle in the middle', () => {
    it('should center 1px line exactly on the path', async() => {
      const rawData = [
        {
          x1: 2,
          x2: 7,
          y1: 2,
          y2: 7,
          topStyle: '1px #000',
          rightStyle: '1px #000',
          leftStyle: '1px #000',
          bottomStyle: '1px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▯▯▯▯▯▯▯▯
▯▯▯▯▯▯▯▯▯▯
▯▯▮▮▮▮▮▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▮▮▮▮▮▯▯
▯▯▯▯▯▯▯▯▯▯
▯▯▯▯▯▯▯▯▯▯`);
    });
    it('should center 2px on the path with a leak to the top-left', async() => {
      const rawData = [
        {
          x1: 2,
          x2: 7,
          y1: 2,
          y2: 7,
          topStyle: '2px #000',
          rightStyle: '2px #000',
          leftStyle: '2px #000',
          bottomStyle: '2px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▯▯▯▯▯▯▯▯
▯▮▮▮▮▮▮▮▯▯
▯▮▮▮▮▮▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▮▮▮▮▮▯▯
▯▮▮▮▮▮▮▮▯▯
▯▯▯▯▯▯▯▯▯▯
▯▯▯▯▯▯▯▯▯▯`);
    });
    it('should center 3px line exactly on the path', async() => {
      const rawData = [
        {
          x1: 2,
          x2: 7,
          y1: 2,
          y2: 7,
          topStyle: '3px #000',
          rightStyle: '3px #000',
          leftStyle: '3px #000',
          bottomStyle: '3px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▯▯▯▯▯▯▯▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▯▯▮▮▮▯
▯▮▮▮▯▯▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▯▯▯▯▯▯▯▯▯`);
    });
  });

  describe('stroke alignment of a rectangle that touches the edges vertically', () => {
    it('should center 1px line exactly on the path', async() => {
      const rawData = [
        {
          x1: 2,
          x2: 7,
          y1: 0,
          y2: 9,
          topStyle: '1px #000',
          rightStyle: '1px #000',
          leftStyle: '1px #000',
          bottomStyle: '1px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▮▮▮▮▮▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▯▯▯▯▮▯▯
▯▯▮▮▮▮▮▮▯▯`);
    });
    it('should center 2px on the path with a leak to the top-left', async() => {
      const rawData = [
        {
          x1: 2,
          x2: 7,
          y1: 0,
          y2: 9,
          topStyle: '2px #000',
          rightStyle: '2px #000',
          leftStyle: '2px #000',
          bottomStyle: '2px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▮▮▮▮▮▮▮▯▯
▯▮▮▮▮▮▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▯▯▯▮▮▯▯
▯▮▮▮▮▮▮▮▯▯
▯▮▮▮▮▮▮▮▯▯`);
    });
    it('should center 3px line exactly on the path', async() => {
      const rawData = [
        {
          x1: 2,
          x2: 7,
          y1: 0,
          y2: 9,
          topStyle: '3px #000',
          rightStyle: '3px #000',
          leftStyle: '3px #000',
          bottomStyle: '3px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▯▯▮▮▮▯
▯▮▮▮▯▯▮▮▮▯
▯▮▮▮▯▯▮▮▮▯
▯▮▮▮▯▯▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯
▯▮▮▮▮▮▮▮▮▯`);
    });
  });

  describe('stroke alignment of a rectangle that touches the edges horizontally', () => {
    it('should center 1px line exactly on the path', async() => {
      const rawData = [
        {
          x1: 0,
          x2: 9,
          y1: 2,
          y2: 7,
          topStyle: '1px #000',
          rightStyle: '1px #000',
          leftStyle: '1px #000',
          bottomStyle: '1px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▯▯▯▯▯▯▯▯
▯▯▯▯▯▯▯▯▯▯
▮▮▮▮▮▮▮▮▮▮
▮▯▯▯▯▯▯▯▯▮
▮▯▯▯▯▯▯▯▯▮
▮▯▯▯▯▯▯▯▯▮
▮▯▯▯▯▯▯▯▯▮
▮▮▮▮▮▮▮▮▮▮
▯▯▯▯▯▯▯▯▯▯
▯▯▯▯▯▯▯▯▯▯`);
    });
    it('should center 2px on the path with a leak to the top-left', async() => {
      const rawData = [
        {
          x1: 0,
          x2: 9,
          y1: 2,
          y2: 7,
          topStyle: '2px #000',
          rightStyle: '2px #000',
          leftStyle: '2px #000',
          bottomStyle: '2px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▯▯▯▯▯▯▯▯
▮▮▮▮▮▮▮▮▮▮
▮▮▮▮▮▮▮▮▮▮
▮▮▯▯▯▯▯▯▮▮
▮▮▯▯▯▯▯▯▮▮
▮▮▯▯▯▯▯▯▮▮
▮▮▮▮▮▮▮▮▮▮
▮▮▮▮▮▮▮▮▮▮
▯▯▯▯▯▯▯▯▯▯
▯▯▯▯▯▯▯▯▯▯`);
    });
    it('should center 3px line exactly on the path', async() => {
      const rawData = [
        {
          x1: 0,
          x2: 9,
          y1: 2,
          y2: 7,
          topStyle: '3px #000',
          rightStyle: '3px #000',
          leftStyle: '3px #000',
          bottomStyle: '3px #000',
        }
      ];

      callSvgPathsRenderer(rawData);

      return testSvgAsAsciiArt(svg, `
▯▯▯▯▯▯▯▯▯▯
▮▮▮▮▮▮▮▮▮▮
▮▮▮▮▮▮▮▮▮▮
▮▮▮▮▮▮▮▮▮▮
▮▮▮▯▯▯▯▮▮▮
▮▮▮▯▯▯▯▮▮▮
▮▮▮▮▮▮▮▮▮▮
▮▮▮▮▮▮▮▮▮▮
▮▮▮▮▮▮▮▮▮▮
▯▯▯▯▯▯▯▯▯▯`);
    });
  });
});
