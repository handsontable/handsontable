#
rm -rf .vuepress/dist
DOCS_VERSION=9.1 BUILD_MODE=production node_modules/.bin/vuepress build -d .vuepress/dist/prebuild-9-1
DOCS_VERSION=9.0 BUILD_MODE=production node_modules/.bin/vuepress build -d .vuepress/dist/prebuild-9-0 
 
mv .vuepress/dist/prebuild-9-1 .vuepress/dist/docs/  
mv .vuepress/dist/prebuild-9-0 .vuepress/dist/docs/9.0    
