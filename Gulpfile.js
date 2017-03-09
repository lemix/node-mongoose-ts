var gulp = require('gulp');
var del = require('del');
var run = require('gulp-run');
var shell = require('gulp-shell');
var rename = require('gulp-rename');

gulp.task('compile', shell.task(['tsc -p .']));

gulp.task('clean', function () {
    return del([
        'build/*',
        'index.js'
    ]);
});

gulp.task('build', function () {
    return gulp.src(['src/index.ts'])
        .pipe(run('rollup <%= file.path %> --format cjs --config', { silent: true }))
        .pipe(rename('index.js'))
        .pipe(gulp.dest('.'));
});

