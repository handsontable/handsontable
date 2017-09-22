#!/bin/bash

set -e

INFO='\033[1;33m'
DONE='\033[0;32m'
NC='\033[0m'

echo -e "${INFO}*** Installing the proper Handsontable CE dependency (the ${HOT_BRANCH} branch) ***${NC}"

yarn add handsontable/handsontable#${HOT_BRANCH} --save

echo -e "${INFO}*** Testing the Handsontable PRO ***${NC}"

npm run test
