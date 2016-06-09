var gulp = require("gulp"),
    babel = require("gulp-babel"),
    concat = require("gulp-concat"),
    plumber = require('gulp-plumber'),
    uglify = require('gulp-uglify'),
    merge = require('merge-stream');

function jsStream() {
    const bundleStream = gulp.src([
                                    "node_modules/webcomponents.js/CustomElements.js",
                                    "node_modules/incremental-dom/dist/incremental-dom.js",
                                    'src/polyfill.js',
                                    'node_modules/whatwg-fetch/fetch.js',
                                    'node_modules/observe-js/src/observe.js'
    ])
        .pipe(plumber());

    const srcStream = gulp.src(['src/sj-expression.js', "src/sj.js", 'src/sj-es5.js'])
        .pipe(plumber())
        .pipe(babel());

    return merge(bundleStream, srcStream);
}

gulp.task("js.bundle.min", function() {
    jsStream()
        .pipe(concat('sj.bundle.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest("./dist/"));
});

gulp.task("js.bundle", function() {
    jsStream()
        .pipe(concat('sj.bundle.js'))
        .pipe(gulp.dest("./dist/"));
});

gulp.task("default", function(){
    gulp.watch(["src/*.js", 'guplfile.js'], ["js.bundle.min", "js.bundle"]);
});
