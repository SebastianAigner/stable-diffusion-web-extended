cd dist
git add -A
git commit -m "deploy"
git push -f git@github.com:SebastianAigner/stable-diffusion-web-extended.git main:gh-pages
