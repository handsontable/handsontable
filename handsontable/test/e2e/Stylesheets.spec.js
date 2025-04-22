describe('Stylesheets', () => {
  describe('CSS charset declarations', () => {
    it('should have exactly one @charset declaration at the beginning of each CSS file', () => {
      if (!['classic', undefined].includes(spec().loadedTheme)) {
        pending('Test is only valid for the classic theme.');

        return;
      }

      const hotCss = [
        '../dist/handsontable.css',
        '../dist/handsontable.min.css',
        '../dist/handsontable.full.css',
        '../dist/handsontable.full.min.css',
      ];

      hotCss.forEach((cssUrl) => {
        // Create a new XMLHttpRequest to fetch the CSS content.
        const xhr = new XMLHttpRequest();

        xhr.open('GET', cssUrl, false);
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
      });
    });
  });
});
