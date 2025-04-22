describe('Stylesheets', () => {
  describe('CSS charset declarations', () => {
    it.forTheme('classic')(
      'should have exactly one @charset declaration at the beginning of each CSS file',
      async() => {
        const hotCss = [
          '../dist/handsontable.css',
          '../dist/handsontable.min.css',
          '../dist/handsontable.full.css',
          '../dist/handsontable.full.min.css',
        ];

        await Promise.all(hotCss.map(async(cssUrl) => {
          const response = await fetch(cssUrl);
          const content = await response.text();
          const charsetRegex = /@charset\s+["'][^"']+["']\s*;/g;
          const matches = content.match(charsetRegex);

          // Check if there is exactly one @charset declaration.
          expect(matches.length).toBe(1);

          // Check if the @charset declaration is at the beginning of the file.
          const firstCharsetIndex = content.indexOf(matches[0]);
          const contentBeforeCharset = content.substring(0, firstCharsetIndex).trim();

          expect(firstCharsetIndex).toBe(0);
          expect(contentBeforeCharset).toBe('');
        }));
      }
    );
  });
});
