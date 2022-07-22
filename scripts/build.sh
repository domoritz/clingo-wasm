#!/usr/bin/env bash

set -ex

source "${BASH_SOURCE%/*}"/versions.sh

docker run -v "$(pwd)":/src emscripten/emsdk:${emscripten_version} bash -c 'scripts/install_deps.sh; scripts/build_clingo.sh'
