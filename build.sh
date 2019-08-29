#!/usr/bin/env bash
set -e
set -x

# Fetch and compile Lua
lua=lua-5.1.5
wget https://www.lua.org/ftp/$lua.tar.gz
tar -xf $lua.tar.gz
cd $lua
emmake make generic local
cd ..

# Compile Clingo.
git submodule update --init --recursive

cd clingo
mkdir -p build/web
cd build/web

emcmake cmake \
        -DCLINGO_BUILD_WEB=On \
        -DCLINGO_BUILD_WITH_PYTHON=Off \
        -DLUA_INCLUDE_DIR="$(pwd)/$lua/include" \
        -DLUA_LIBRARIES="$(pwd)/$lua/lib/liblua.a" \
        -DCLINGO_BUILD_WITH_LUA=Off \
        -DCLINGO_REQUIRE_LUA=Off \
        -DCLINGO_BUILD_SHARED=Off \
        -DCLASP_BUILD_WITH_THREADS=Off \
        -DCMAKE_VERBOSE_MAKEFILE=On \
        -DCMAKE_BUILD_TYPE=release \
        -DCMAKE_CXX_FLAGS="-s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1" \
        -DCMAKE_EXE_LINKER_FLAGS="" \
        -DCMAKE_EXE_LINKER_FLAGS_RELEASE="" \
        ../..

cd ../..
make -C build/web web

# Copy the results to root.
cd ..  
cp ./clingo/build/web/bin/clingo.* ./
