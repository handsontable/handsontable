#!/usr/bin/bash

# This script generates the JS/JSX files for all the TS/TSX code examples.
# It skips the examples that already have a JS/JSX file.

jobs_limit=16

generate_single_file() {
  ts_filename="$1"
  js_filename="${ts_filename%.*}.js"
  jsx_filename="${ts_filename%.*}.jsx"
  
  if [[ "$ts_filename" == *.ts ]]; then
    tsc --target esnext --skipLibCheck "$ts_filename" > /dev/null
    target_filename="$js_filename"
  elif [[ "$ts_filename" == *.tsx ]]; then
    tsc --target esnext --jsx preserve --skipLibCheck "$ts_filename" > /dev/null
    target_filename="$jsx_filename"
  else
    return
  fi

  if [ -f "$target_filename" ]; then
    eslint --fix --no-ignore -c eslintrc.examples.js "$target_filename" > /dev/null
    echo "Generated and formatted $target_filename"
  else
    echo "Failed to generate $target_filename"
  fi
}

echo "Running $jobs_limit jobs in parallel..."

find content/guides -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while read -d $'\0' ts_filename; do
  while test "$(jobs | wc -l)" -ge "$jobs_limit"; do
    sleep 1
  done

  generate_single_file "$ts_filename" &
done

wait
echo "Waiting for the result of all jobs..."
sleep 20
echo "All jobs finished"
