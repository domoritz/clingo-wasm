#!/usr/bin/env bash

set -e
set -x

# Fetch and compile Lua.

lua=lua-5.3.5
wget https://www.lua.org/ftp/$lua.tar.gz -O lua.tar.gz
tar -xf lua.tar.gz
pushd $lua
emmake make generic local
popd

# Fetch and compile Clingo.

clingo_version=5.4.0
clingo=clingo-$clingo_version
wget https://github.com/potassco/clingo/archive/v$clingo_version.tar.gz -O clingo.tar.gz
tar -xf clingo.tar.gz

pushd $clingo
mkdir -p build/web
pushd build/web

emcmake cmake \
        -DCLINGO_BUILD_WEB=On \
        -DCLINGO_BUILD_WITH_PYTHON=Off \
        -DLUA_INCLUDE_DIR=/src/$lua/install/include \
        -DLUA_LIBRARIES=/src/$lua/install/lib/liblua.a \
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
make -C build/web web

# Copy the results to root.
popd  
cp $clingo/build/web/bin/clingo.* ./
