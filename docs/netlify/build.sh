#/bin/bash
rm -rf docs
mkdir -p docs/docs
cd .. 
BUILD_MODE=preview npm run docs:build
cd netlify
mv ../.vuepress/dist/docs docs
./build_previous_versions.sh
cp _redirects docs/_redirects
netlify deploy --build --prod