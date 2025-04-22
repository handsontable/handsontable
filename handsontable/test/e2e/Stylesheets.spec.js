describe('Stylesheets', () => {
  describe('CSS charset declarations', () => {
    it('should have exactly one @charset declaration at the beginning of each CSS file', () => {
      if (!['classic', undefined].includes(spec().loadedTheme)) {
        pending('Test is only valid for the classic theme.');

        return;
      }

      // Clear all initial stylesheets.
      const initialStylesheetNodes =  Array.from(document.styleSheets).filter(
        (sheet) => sheet.href && sheet.href.includes('dist/handsontable')
      ).map(sheet => sheet.ownerNode);

      initialStylesheetNodes.forEach(node => node.remove());

      // Add all the classic theme stylesheets to the document.
      const hotCss = [
        '../dist/handsontable.css',
        '../dist/handsontable.min.css',
        '../dist/handsontable.full.css',
        '../dist/handsontable.full.min.css',
      ];
      const hotCssNodes = [];

      hotCss.forEach(cssUrl => {
        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.href = cssUrl;

        hotCssNodes.push(link);

        document.head.appendChild(link);
      });

      hotCssNodes.forEach((styleSheetNode) => {
        if (styleSheetNode.href && styleSheetNode.href.endsWith('.css')) {

          // Create a new XMLHttpRequest to fetch the CSS content.
          const xhr = new XMLHttpRequest();
          xhr.open('GET', styleSheetNode.href, false);
          xhr.send();

          if (xhr.status === 200) {
            const content = xhr.responseText;
            const charsetRegex = /@charset\s+["'][^"']+["']\s*;/g;
            const matches = content.match(charsetRegex);

            // Check if there is exactly one @charset declaration.
            expect(matches.length).toBe(1);

            // Check if the @charset declaration is at the beginning of the file.
            const firstCharsetIndex = content.indexOf(matches[0]);
            const contentBeforeCharset = content.substring(0, firstCharsetIndex).trim();

            expect(firstCharsetIndex).toBe(0);
            expect(contentBeforeCharset).toBe('');
          }
        }

        // Clean up the temp node.
        styleSheetNode.remove();
      });

      initialStylesheetNodes.forEach(node => document.head.appendChild(node));
    });
  });
});
