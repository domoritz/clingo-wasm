#!/usr/bin/env bash

set -ex

docker run -v $(pwd):/src emscripten/emsdk:2.0.15 bash -c 'scripts/install_deps.sh; scripts/build_clingo.sh'
