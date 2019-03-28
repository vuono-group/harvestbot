printf "\n\n\nStash local changes\n\n\n"
git stash

printf "\n\n\nUpdate develop branch and merge to master\n\n\n"
git checkout dev
git pull
git checkout master
git merge dev

VERSION=$(node ./tools/version.js)
printf "Releasing Harvestbot version $VERSION\n"

printf "\n\n\nCreate tag v$VERSION\n\n\n"
git tag -a v$VERSION -m "Version $VERSION"
git push origin master --tags


printf "\n\n\nIncrease version for dev branch\n\n\n"
git checkout dev

npm --no-git-tag-version version minor
NEW_VERSION=$(node ./tools/version.js)
git commit -a -m "Upgrade working version to $NEW_VERSION."
git push origin dev
