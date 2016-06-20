all: dist/sj.bundle.js dist/sj.bundle.min.js

test/compiled.js: src/*.js test/all.js test/test-*.js
	browserify -v --debug -t babelify test/all.js -o test/compiled.js

setup:
	npm install -g uglify-js testling babelify browserify

dist/sj.bundle.js: src/*.js
	browserify --debug -t babelify --standalone sj src/main.js -o dist/sj.bundle.js

dist/sj.bundle.min.js: dist/sj.bundle.js
	uglifyjs --source-map dist/sj.bundle.min.js.map dist/sj.bundle.js -o dist/sj.bundle.min.js

test: test/compiled.js
	phantomjs test/run-qunit.js test/test.html

pages:
	git subtree push --prefix dist origin gh-pages

test-browser:
	browserify -t babelify test/test-*.js | testling -x open

.PHONY: all test test-browser setup

