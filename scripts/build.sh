#!/usr/bin/env bash

set -ex

source ${BASH_SOURCE%/*}/versions.sh

docker run -it -v $(pwd):/src trzeci/emscripten:sdk-tag-${emscripten_version}-64bit bash -c 'scripts/install_deps.sh; scripts/build_clingo.sh'
