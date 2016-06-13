all: dist/sj.bundle.js dist/sj.bundle.min.js

test.js: src/*.js test/test-suite.js
	browserify -t babelify test/test-suite.js -o test.js

setup:
	npm install uglify-js -g

dist/sj.bundle.js: src/*.js
	browserify --debug -t babelify --standalone sj src/main.js -o dist/sj.bundle.js

dist/sj.bundle.min.js: dist/sj.bundle.js
	uglifyjs --source-map dist/sj.bundle.min.js.map dist/sj.bundle.js -o dist/sj.bundle.min.js

test:
	browserify -t babelify test/test-aggregator.js | testling
	browserify -t babelify test/test-compile.js | testling
	browserify -t babelify test/test-element.js | testling
	browserify -t babelify test/test-suite.js | testling

pages:
	git subtree push --prefix dist origin gh-pages

test-browser:
	browserify -t babelify test/test-*.js | testling -x open

.PHONY: all test test-browser setup

