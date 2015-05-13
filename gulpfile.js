var ts = require('gulp-typescript');
var gulp = require('gulp');
var watch = require('gulp-watch');

var tsProject = ts.createProject({
    declarationFiles: true,
    noExternalResolve: true,
    target: 'ES5',
    module: 'amd',
});


gulp.task('watch', ['js'], function() {
    gulp.watch('jupyterdrive/ts/*.ts', ['js']);
});

gulp.task('js', function() {
    var tsResult = gulp.src('jupyterdrive/ts/*.ts')
                       .pipe(ts(tsProject));
    
    return tsResult.js.pipe(gulp.dest('jupyterdrive/gdrive')) ;
});
