 #!/usr/bin/bash

# This script generates the JS files for all the TS code examples. It skips the examples that already have a JS file.

find content/guides -wholename "*/javascript/*.ts" -print0 | while read -d $'\0' ts_filename; do
  js_filename="${ts_filename%.*}.js"
    
  tsc --target esnext --skipLibCheck $ts_filename > /dev/null

  if [ -f "$js_filename" ]; then
    eslint --fix --no-ignore -c eslintrc.examples.js $js_filename > /dev/null
    echo "Generated $js_filename"
  else
    echo "Failed to generate $js_filename"
  fi
done
