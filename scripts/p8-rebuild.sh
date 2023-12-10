#!/usr/bin/env bash
#Move to project home
cd "$(dirname "$0")/.."

if test -f ".env"; then
	. .env
fi

if [[ -z "${P8_BIN}" ]]; then
	echo "Please set P8_BIN. You can use a .env file in the project root folder"
fi

mkdir -p dist/www/
mkdir -p dist/srv/

cp src/client/* dist/www/
"$P8_BIN"/pico8 -root_path "$(pwd)/src/" -x scripts/build.p8 -home "$(pwd)/p8-home"



node src/server/index.js
