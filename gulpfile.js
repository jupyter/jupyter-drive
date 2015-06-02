var ts = require('gulp-typescript');
var gulp = require('gulp');
var watch = require('gulp-watch');
var merge = require('merge2');

var tsProject = ts.createProject({
    declarationFiles: true,
    noExternalResolve: false,
    target: 'ES5',
    module: 'amd',
});


gulp.task('watch', ['js'], function() {
    gulp.watch('jupyterdrive/ts/*.ts', ['js']);
    gulp.watch('jupyterdrive/js/*.js', ['js']);
    gulp.watch('typings/*/*.ts', ['js']);
    gulp.watch('gulpfile.js', ['js']);
});

gulp.task('js', function() {
    console.log('=========== Rebuilding JS ===========')
    var jsResult = gulp.src([
                                'jupyterdrive/js/*.js',
        
    ]).pipe(gulp.dest('jupyterdrive/gdrive'))
    var tsResult = gulp.src([
                                'jupyterdrive/ts/*.ts',
                                'typings/*.d.ts',
                                'typings/*/**.d.ts',
                            ])
                       .pipe(ts(tsProject));
    return merge([
        tsResult.dts.pipe(gulp.dest('jupyterdrive/gdrive')),
        tsResult.js.pipe(gulp.dest('jupyterdrive/gdrive'))
    ]);
});
