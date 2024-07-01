#!/usr/bin/bash

# This script generates JS/JSX examples from TS/TSX files and formats them using ESLint.
# Usage:
#   ./code-examples-generator.sh path/to/file.ts - generates single example path/to/file.js
#   ./code-examples-generator.sh --generateAll - generates all examples in the content/guides directory
#   ./code-examples-generator.sh --formatAllTsExamples - runs the autoformatter on all TS and TSX example files in the content/guides directory

format() {
  eslint --fix --no-ignore -c eslintrc.examples.js "$1" > /dev/null
}

build_output_filename() {
  local input_filename
  local output_filename
  input_filename="$1"
  
  if [[ "$input_filename" == *.ts ]]; then
    output_filename="${input_filename%.*}.js"
  elif [[ "$input_filename" == *.tsx ]]; then
    output_filename="${input_filename%.*}.jsx"
  else
    echo "Invalid file extension: $input_filename. Must be .ts or .tsx" >&2
    return 1
  fi
  
  echo "$output_filename"
}

generate() {
  local input_filename
  local output_filename
  input_filename="$1"
  output_filename=$(build_output_filename "$input_filename")
  
  if [[ "$input_filename" == *.ts ]]; then
    tsc --target esnext --skipLibCheck "$input_filename" > /dev/null
  elif [[ "$input_filename" == *.tsx ]]; then
    tsc --target esnext --jsx preserve --skipLibCheck "$input_filename" > /dev/null
  else
    echo "Invalid file extension: $input_filename. Must be .ts or .tsx" >&2
    return 1
  fi
  
  if [ ! -f "$output_filename" ]; then
    echo "Failed to generate $output_filename from $input_filename" >&2
    return 1
  fi
}

format_single_file() {
  format "$1"
  echo "Formatted $1"
}

generate_single_example() {
  local input_filename
  local output_filename
  input_filename="$1"
  output_filename=$(build_output_filename "$input_filename")

  generate "$input_filename"
  format "$output_filename"
  echo "Generated $output_filename"
}

go_through_all_examples_concurrently() {
  local task
  local jobs_limit
  task="$1"
  jobs_limit=16

  echo "Running $jobs_limit jobs in parallel..."

  find content/guides -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while read -d $'\0' source_input_filename; do
    while test "$(jobs | wc -l)" -ge "$jobs_limit"; do
      sleep 1
    done

    if [ "$task" == "formatAllTsExamples" ]; then
      format_single_file "$source_input_filename" &
    else
      generate_single_example "$source_input_filename" &
    fi

  done

  wait
  echo "Waiting for the result of all jobs..."
  sleep 20
  echo "All jobs finished"
}

if [ -z "$1" ]; then
  echo "Provide a path to the TS/TSX file or use one of the commands: --generateAll, --formatAllTsExamples"
elif [ "$1" == "--generateAll" ]; then
  echo "Generating all examples..."
  go_through_all_examples_concurrently "generateAll"
elif [ "$1" == "--formatAllTsExamples" ]; then
  echo "Formatting all TS/TSX example files..."
  go_through_all_examples_concurrently "formatAllTsExamples"
else
  echo "Generating single example..."
  generate_single_example "$1"
fi
