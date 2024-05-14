 #!/usr/bin/sh 

# This script generates the JS files for all the TS code examples. It skips the examples that already have a JS file.

find content/guides -wholename "*/javascript/*.ts" -print0 | while read -d $'\0' ts_filename; do
  js_filename="${ts_filename%.*}.js"
    
  if [ -f "$js_filename" ]; then
    echo "Skipping $js_filename"
  else
    echo "Generating $js_filename"
    tsc --target esnext --skipLibCheck $ts_filename > /dev/null
    eslint --fix --no-ignore -c eslintrc.examples.js $js_filename
  fi
done
