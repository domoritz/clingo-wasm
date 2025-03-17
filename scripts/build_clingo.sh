#!/usr/bin/env bash

set -ex

source "${BASH_SOURCE%/*}"/versions.sh

# Get number of processors.

if [ "$(uname)" == "Darwin" ]; then
    procs=$(sysctl -n hw.physicalcpu) 
elif [ "$(expr substr "$(uname -s)" 1 5)" == "Linux" ]; then
    procs=$(nproc)
else
   echo "Bad platform"
   exit
fi

# Fetch and compile Lua.

lua=lua-${lua_version}
wget https://www.lua.org/ftp/$lua.tar.gz -O lua.tar.gz
tar -xf lua.tar.gz
pushd $lua
emmake make generic local CC='emcc'
popd

# Fetch and compile Clingo.

clingo=clingo-${clingo_version}
wget https://github.com/potassco/clingo/archive/v"${clingo_version}".tar.gz -O clingo.tar.gz
tar -xf clingo.tar.gz

root_dir=$(pwd)  # assumes that the script is run from the root

pushd $clingo
mkdir -p build/web
pushd build/web

emcmake cmake \
        -DCLINGO_BUILD_WEB=On \
        -DCLINGO_BUILD_WITH_PYTHON=Off \
        -DLUA_INCLUDE_DIR="${root_dir}"/"$lua"/install/include \
        -DLUA_LIBRARIES="${root_dir}"/"$lua"/install/lib/liblua.a \
        -DCLINGO_BUILD_WITH_LUA=On \
        -DCLINGO_REQUIRE_LUA=On \
        -DCLINGO_BUILD_SHARED=Off \
        -DCLASP_BUILD_WITH_THREADS=Off \
        -DCMAKE_VERBOSE_MAKEFILE=On \
        -DCMAKE_BUILD_TYPE=release \
        -DCMAKE_CXX_FLAGS="-s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1" \
        -DCMAKE_EXE_LINKER_FLAGS="" \
        -DCMAKE_EXE_LINKER_FLAGS_RELEASE="" \
        ../..

popd
make -C build/web web -j "$procs"

# Fix export issue of clingo. (Refer to #18954/#20163 in emscripten)
echo "else if (typeof exports === 'object')" >> build/web/bin/clingo.js
echo "  exports['Module'] = Module;" >> build/web/bin/clingo.js

# Copy the results to root.
popd
cp "$clingo"/build/web/bin/clingo.* ./src/
