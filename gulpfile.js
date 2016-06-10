var gulp = require("gulp"),
    babel = require("gulp-babel"),
    concat = require("gulp-concat"),
    plumber = require('gulp-plumber'),
    browserify = require('browserify'),
    uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var babelify = require('babelify');

// see https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-uglify-sourcemap.md
// http://stackoverflow.com/questions/32502678/gulp-uglify-and-sourcemaps
gulp.task("js.bundle", function() {
    var dst = './dist/';
    browserify({
      standalone: 'sj',
      debug: true
    }).require('./src/main.js', {expose: 'sj'}).transform(babelify).bundle()
      .pipe(plumber())
      .pipe(source('sj.bundle.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(gulp.dest(dst))
      .pipe(uglify({preserveComments: 'license'}))//.on('error', gutil.log)
      .pipe(rename({ extname: '.min.js' }))
      .pipe(gulp.dest(dst))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(dst))
      ;
});

gulp.task("default", function(){
    gulp.watch(["src/*.js", 'guplfile.js'], ["js.bundle"]);
});
