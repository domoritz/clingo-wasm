#!/usr/bin/env bash

set -ex

if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
  message=$(git show -s)
  regexp="\\[Travis\\]"
  if [[ $message =~ $regexp ]]; then
    echo "Skipping rebuild of automated commit."
  else
    if [[ $TRAVIS_BRANCH != 'master' ]]; then
      git config --global user.email "travis@travis-ci.org"
      git config --global user.name "Travis CI"

      git add clingo.wasm clingo.js
      git commit -m "[Travis] Automated build of WASM files (build $TRAVIS_BUILD_NUMBER)."
      git remote add origin-pushable https://${GH_TOKEN}@github.com/domoritz/clingo-wasm.git > /dev/null 2>&1
      git push --set-upstream origin-pushable HEAD:$TRAVIS_BRANCH
    fi
  fi
else
  echo "No changes detected in WASM file."
fi
