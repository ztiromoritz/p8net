#!/usr/bin/env bash
#Move to project home
cd "$(dirname "$0")/.."

if test -f ".env"; then
	. .env
fi

if [[ -z "${P8_HOME}" ]]; then
	echo "Please set P8_HOME. You can use a .env file in the project root folder"
fi

"$P8_HOME"/pico8 -root_path "$(pwd)/src/" -run src/p8net.p8 

