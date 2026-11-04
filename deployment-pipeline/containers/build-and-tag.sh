VERSION=$(node -p "require('./package.json').version")
SHA=$(git rev-parse --short=7 HEAD); TAG="${VERSION}-${SHA}"; echo "Image tag: $TAG"
