var gulp = require("gulp"),
    babel = require("gulp-babel"),
    uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    plumber = require('gulp-plumber'),
    merge = require('merge-stream'),
    webpack = require('webpack-stream');

function jsStream() {
    const srcStream = gulp.src("src/main.js")
        .pipe(plumber())
        .pipe(webpack())
        .pipe(babel());

    const bundleStream = gulp.src(["node_modules/webcomponents.js/webcomponents.js", "node_modules/incremental-dom/dist/incremental-dom-min.js", 'src/polyfill.js'])
        .pipe(plumber());

    return merge(bundleStream, srcStream);
}

gulp.task("js.bundle.min", function() {
    jsStream()
        .pipe(uglify())
        .pipe(concat('sj.bundle.min.js'))
        .pipe(gulp.dest("./dist/"));
});

gulp.task("js.bundle", function() {
    jsStream()
        .pipe(concat('sj.bundle.js'))
        .pipe(gulp.dest("./dist/"));
});

gulp.task("default", function(){
    gulp.watch("src/*.js", ["js.bundle.min", "js.bundle"]);
});
