 #!/usr/bin/bash

# This script generates the JS files for all the TS code examples. It skips the examples that already have a JS file.

jobs_limit=16

generate_single_file() {
  ts_filename="$1"
  js_filename="${ts_filename%.*}.js"
    
  tsc --target esnext --skipLibCheck $ts_filename > /dev/null

  if [ -f "$js_filename" ]; then
    eslint --fix --no-ignore -c eslintrc.examples.js $js_filename > /dev/null
    echo "Generated $js_filename"
  else
    echo "Failed to generate $js_filename"
  fi
}

echo "Running $jobs_limit jobs in parallel..."

find content/guides -wholename "*/javascript/*.ts" -print0 | while read -d $'\0' ts_filename; do
  if test "$(jobs | wc -l)" -ge "$jobs_limit"; then
    wait -n
  fi

  generate_single_file "$ts_filename" &
done

wait
sleep 10
echo "All jobs finished"
