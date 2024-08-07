import { webfont } from 'webfont';
import { writeFile } from 'node:fs/promises';

const fontName = 'ht-icons';

const createFontData = buffer => `"data:font/woff2;charset=utf-8;base64,${Buffer.from(buffer).toString('base64')}"`;

const createFontScss = (data, glyphsData) => `@font-face {
  font-family: "${fontName}";
  src: url(${data});
  font-weight: normal;
  font-style: normal;
}
    
[class^="${fontName}"], [class*="${fontName}"] {
  font-family: '${fontName}' !important;
  font-style:normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${glyphsData.map(glyph => `.${fontName}-${glyph.metadata.name}:before { 
  content: '\\${glyph.metadata.unicode[0].charCodeAt(0).toString(16)}'; 
}`).join('\n')}
`;

const writeToFile = async(fileName, data) => {
  try {
    await writeFile(fileName, data);
    console.log(`Wrote data to ${fileName}`);
  } catch (error) {
    console.error(`Got an error trying to write the file: ${error.message}`);
  }
};

// eslint-disable-next-line no-useless-catch
try {
  const theme = process.env.npm_config_theme;

  if (!theme) {
    throw new Error('Enter font type name. Example: npm run generate-svg-font --theme=main-light');
  }

  const result = await webfont({
    files: `./src/styles/themes/${theme}/icons/files/*.svg`,
    fontName,
    formats: 'woff2',
    ligatures: false,
    fontHeight: 1000,
    normalize: true
  });

  const data = createFontData(result.woff2);
  const scss = createFontScss(data, result.glyphsData);

  writeToFile(`./src/styles/themes/${theme}/icons/index.scss`, scss);
} catch (err) {
  throw err;
}

