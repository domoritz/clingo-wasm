#!/usr/bin/env bash
set -e
set -x

# Fetch and compile Lua
lua=lua-5.3.4
lua_dir=$(pwd)/$lua
wget https://www.lua.org/ftp/$lua.tar.gz
tar -xf $lua.tar.gz
cd $lua
emmake make generic local
cd ..


# Fetch and compile Clingo.
clingo_version=5.4.0
clingo=clingo-$clingo_version
wget https://github.com/potassco/clingo/archive/v$clingo_version.tar.gz -O clingo.tar.gz
tar -xf clingo.tar.gz

cd $clingo
mkdir -p build/web
cd build/web

emcmake cmake \
        -DCLINGO_BUILD_WEB=On \
        -DCLINGO_BUILD_WITH_PYTHON=Off \
        -DLUA_INCLUDE_DIR="$lua_dir/include" \
        -DLUA_LIBRARIES="$lua_dir/lib/liblua.a" \
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
cp ./$clingo/build/web/bin/clingo.* ./
