#!/usr/bin/env bash
set -x
#Move to project home
cd "$(dirname "$0")/.."

if test -f ".env"; then
	. .env
fi

if [[ -z "${P8_HOME}" ]]; then
	echo "Please set P8_HOME. You can use a .env file in the project root folder"
fi

mkdir -p dist/

cp src/p8net.js dist/
echo "lelel"
"$P8_HOME"/pico8 -root_path "$(pwd)/src/" -x src/build.p8 -home "$(pwd)/p8-home"

#todo extract server.lua 

node index.js
