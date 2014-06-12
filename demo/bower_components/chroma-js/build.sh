#!/bin/bash
echo "###*" > license.coffee
echo " * @license" >> license.coffee
echo " *" >> license.coffee
while read i
do
   echo " * $i"  >> license.coffee
done < LICENSE
echo "###" >> license.coffee
coffee -o . -j chroma.js license.coffee src/api.coffee src/color.coffee src/conversions/*.coffee  src/scale.coffee src/limits.coffee src/colors/*.coffee src/utils.coffee src/interpolate.coffee
uglifyjs --comments "@license" chroma.js > chroma.min.js
rm license.coffee
