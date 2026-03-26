#!/bin/bash
mkdir -p output
cd ../
PUPPETEER_SKIP_DOWNLOAD=true pnpm install && pnpm -r rebuild

cd handsontable

npm run build:umd
npm run build:umd.min
npm run build:languages
npm run build:languages.min
cp dist/handsontable.full.min.js ../performance-tests/fixtures/handsontable.full.min.js
cp dist/handsontable.full.js ../performance-tests/fixtures/handsontable.full.js

cd ../performance-tests
npm install
npx playwright install chromium
