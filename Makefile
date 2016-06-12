all: dist/sj.bundle.js dist/sj.bundle.min.js

dist/sj.bundle.js: src/*.js
	browserify -t babelify --standalone sj src/main.js -o dist/sj.bundle.js

dist/sj.bundle.min.js: dist/sj.bundle.js
	uglify -s dist/sj.bundle.js -o dist/sj.bundle.min.js

test:
	browserify -t babelify test/test-aggregator.js | testling
	browserify -t babelify test/test-compile.js | testling
	browserify -t babelify test/test-element.js | testling
	browserify -t babelify test/test-suite.js | testling


test-browser:
	browserify -t babelify test/test-*.js | testling -x open

.PHONY: all test test-browser

