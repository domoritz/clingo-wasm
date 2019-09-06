
if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
  message=$(git show -s)
  regexp="\\[Travis\\]"
  if [[ $message =~ $regexp ]]; then
    echo "Skipping rebuild of automated commit."
  else
    if [[ $TRAVIS_BRANCH != 'master' ]]; then
      git add clingo.wasm clingo.js
      git commit -m "[Travis] Automated build of WASM files (build $TRAVIS_BUILD_NUMBER)."
    fi
  fi
else
  echo "No changes detected in WASM file."
fi
