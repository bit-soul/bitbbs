var gulp = require('gulp');
var clean = require('gulp-clean');
var concat= require('gulp-concat');

var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minify_css = require('gulp-minify-css');

//*********************************************
//               build
//*********************************************
gulp.task('build', function(cb) {
    return gulp.series(
        'clean',
        'compress-js',
        'compress-css',
        'move-file'
    )(cb);
});

gulp.task('compress-js', function(){
    return gulp.src('./static/js/**/*.js')
        .pipe(uglify().on('error', function(err){
            gutil.log(err);
            this.emit('end');
        }))
        .pipe(concat('js.js'))
        .pipe(gulp.dest('./dist/static/js/'));
});

gulp.task('compress-css', function(){
    return gulp.src('./static/css/**/*.less')
        .pipe(less())
        .pipe(minify_css())
        .pipe(concat('css.css'))
        .pipe(gulp.dest('./dist/static/css/'))
});

gulp.task('move-file', function(){
    return gulp.src([
      './static/**/*',
      '!./static/js/**/*',
      '!./static/css/**/*',
      ], { encoding: false })
      .pipe(gulp.dest('./dist/static/'))
});

//*********************************************
//               clean
//*********************************************
gulp.task("clean", function () {
    return gulp.src('./dist', { allowEmpty: true })
            .pipe(clean());
});