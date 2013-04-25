#!/bin/sh
(echo 'var tests = [' && (cd testcases && ls *.html) | sed "s/.*/  '\0',/" && echo '];') > testcases.js
