all: dist/sj.bundle.js dist/sj.bundle.min.js

dist/sj.bundle.js: src/*.js
	browserify -t babelify --standalone sj src/main.js -o dist/sj.bundle.js

dist/sj.bundle.min.js: dist/sj.bundle.js
	uglify -s dist/sj.bundle.js -o dist/sj.bundle.min.js

test:
	browserify -t babelify test.js test/test-sj-expression.js | testling

test-browser:
	browserify -t babelify test.js test/test-sj-expression.js | testling -x open

.PHONY: all test test-browser

