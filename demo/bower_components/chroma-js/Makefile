
all: chroma.min.js

clean:
	@rm chroma.js chroma.min.js license.coffee

license.coffee: LICENSE
	@echo "###*" > $@          \
	echo " * @license" >> $@  \
	echo " *" >> $@           \
	while read i              \
	do                        \
	   echo " * $i"  >> $@    \
	done < LICENSE            \
	echo "###" >> $@

chroma.js: license.coffee src/api.coffee src/color.coffee src/conversions/*.coffee  src/scale.coffee src/limits.coffee src/colors/*.coffee src/utils.coffee src/interpolate.coffee
	@coffee -o . -j $@ $^

chroma.min.js: chroma.js
	@uglifyjs --comments "@license" chroma.js > $@

test: chroma.js
	@npm test