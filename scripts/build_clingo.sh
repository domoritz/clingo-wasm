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

# Two variants are built: the default single-threaded one, and one with thread
# support (clasp's parallel solving, e.g. the -t option). The threaded build
# needs SharedArrayBuffer, which browsers only expose on cross-origin isolated
# pages, so it is shipped alongside the default build and picked at runtime.
#
# Both are compiled with native WebAssembly exceptions so that C++ exceptions
# in Clingo and setjmp/longjmp in Lua use the wasm exception handling proposal.
st_flags="-fwasm-exceptions"
# Emscripten's default INCOMING_MODULE_JS_API (src/settings.js), which setting
# the option would otherwise replace.
default_module_api="ENVIRONMENT,arguments,canvas,dynamicLibraries,elementPointerLock,instantiateWasm,locateFile,monitorRunDependencies,noExitRuntime,noInitialRun,onAbort,onExit,onRuntimeInitialized,postRun,preInit,preRun,print,printErr,setStatus,statusMessage,stderr,stdin,stdout,thisProgram,wasm,websocket"
# The pthread pool is sized from navigator.hardwareConcurrency (available in
# browsers and in Node >= 21; the JS wrapper only selects this build when it
# exists). mainScriptUrlOrBlob is added to the incoming module API so bundlers
# can tell the pthread workers where to load the module from.
mt_flags="-pthread -fwasm-exceptions -sPTHREAD_POOL_SIZE=navigator.hardwareConcurrency -sINCOMING_MODULE_JS_API=$default_module_api,mainScriptUrlOrBlob"

# Fetch and compile Lua, once per variant.

lua=lua-${lua_version}
wget https://www.lua.org/ftp/$lua.tar.gz -O lua.tar.gz
tar -xf lua.tar.gz
rm -rf $lua-mt
cp -r $lua $lua-mt

pushd $lua
emmake make generic local CC="emcc $st_flags"
popd

pushd $lua-mt
emmake make generic local CC="emcc $mt_flags"
popd

# Fetch and compile Clingo, once per variant.

clingo=clingo-${clingo_version}
wget https://github.com/potassco/clingo/archive/v"${clingo_version}".tar.gz -O clingo.tar.gz
tar -xf clingo.tar.gz

root_dir=$(pwd)  # assumes that the script is run from the root

build_clingo () {
    # $1: build directory below build/, $2: lua tree, $3: emscripten flags,
    # $4: clasp thread support (On/Off)
    local build_dir=build/$1

    mkdir -p "$build_dir"
    pushd "$build_dir"

    emcmake cmake \
            -DCLINGO_BUILD_WEB=On \
            -DCLINGO_BUILD_WITH_PYTHON=Off \
            -DLUA_INCLUDE_DIR="${root_dir}"/"$2"/install/include \
            -DLUA_LIBRARIES="${root_dir}"/"$2"/install/lib/liblua.a \
            -DCLINGO_BUILD_WITH_LUA=On \
            -DCLINGO_REQUIRE_LUA=On \
            -DCLINGO_BUILD_SHARED=Off \
            -DCLASP_BUILD_WITH_THREADS=$4 \
            -DCMAKE_VERBOSE_MAKEFILE=On \
            -DCMAKE_BUILD_TYPE=release \
            -DCMAKE_CXX_FLAGS="$3 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s STACK_SIZE=1mb" \
            -DCMAKE_EXE_LINKER_FLAGS="" \
            -DCMAKE_EXE_LINKER_FLAGS_RELEASE="" \
            ../..

    popd
    make -C "$build_dir" web -j "$procs"
}

pushd $clingo

build_clingo web "$lua" "$st_flags" Off
build_clingo web-mt "$lua-mt" "$mt_flags" On

# Fix export issue of clingo. (Refer to #18954/#20163 in emscripten) The
# threaded build must not get this: it ends in the pthread bootstrap statement,
# so the appended else-branch would be a syntax error, and its exports work
# without the fix.
echo "else if (typeof exports === 'object')" >> build/web/bin/clingo.js
echo "  exports['Module'] = Module;" >> build/web/bin/clingo.js

# The threaded variant is shipped as clingo-mt.js/clingo-mt.wasm next to the
# default build, so rename the wasm file it loads.
sed -i.bak 's/clingo\.wasm/clingo-mt.wasm/g' build/web-mt/bin/clingo.js
popd

# Copy the results to root.
cp "$clingo"/build/web/bin/clingo.js "$clingo"/build/web/bin/clingo.wasm ./src/
cp "$clingo"/build/web-mt/bin/clingo.js ./src/clingo-mt.js
cp "$clingo"/build/web-mt/bin/clingo.wasm ./src/clingo-mt.wasm
