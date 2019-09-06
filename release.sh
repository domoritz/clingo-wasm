set -e

if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
  message=$(git show -s)
  regexp="\\[Travis\\]"
  if [[ $message =~ $regexp ]]; then
    echo "Skipping rebuild of automated commit."
  else
    if [[ $TRAVIS_BRANCH != 'master' ]]; then
      git add clingo.wasm clingo.js
      git commit -m "[Travis] Automated build of WASM files (build $TRAVIS_BUILD_NUMBER)."
      git remote add origin-pushable https://${GH_TOKEN}@github.com/domoritz/clingo-wasm.git > /dev/null 2>&1
      git push --set-upstream origin-pushable
    fi
  fi
else
  echo "No changes detected in WASM file."
fi
